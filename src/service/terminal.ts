import { spawn } from 'child_process';
import FixedLengthArray from '../utils/fixedLenghtArray';
import ApiError from '../utils/apiError';
import httpStatus from 'http-status';
import Database from '../database';
import log from '../log/log';
import createPromise from './createPromise';

class TerminalLog {
    private log: string[] = new FixedLengthArray<string>(100);
    private listeners: ((log: string) => void)[] = [];

    push(log: string) {
        this.log.push(log);
        this.listeners.forEach(listener => listener(log));
    }

    addListener(listener: (log: string) => void) {
        this.listeners.push(listener);
    }

    removeListener(listener: (log: string) => void) {
        const index = this.listeners.indexOf(listener);
        if (index !== -1) {
            this.listeners.splice(index, 1);
        }
    }

    getLog() {
        return this.log;
    }
}

async function updateLastBackup(id: number) {
    const record = await Database.server.findUnique({
        where: {
            id
        },
    });
    if (!record) {
        throw new ApiError(httpStatus.NOT_FOUND, "Server not found");
    }
    await Database.server.update({
        where: {
            id
        },
        data: {
            ...record,
            lastBackup: new Date(),
            id: undefined,
        }
    });
}


class Terminal {
    private log: TerminalLog = new TerminalLog();
    private process?: ReturnType<typeof spawn>;
    private id: number;
    private alive: boolean = true;
    startedTime: Date = new Date();
    endedTime?: Date;
    error?: Error;

    constructor(id: number) {
        log("INFO", `The ${id} backup is running.`)
        this.id = id;
    }

    async run(command: string, args?: string[]) {
        const startPromise = await createPromise<void>();
        const finishPromise = await createPromise<void>();
        try {
            this.process = spawn(command, args);
            startPromise.resolve();
            if (this.process) {
                this.process.stdout?.on("data", (data) => {
                    this.log.push(data.toString());
                });
                this.process.stderr?.on("data", (data) => {
                    this.log.push(data.toString());
                });
                this.process.on("close", (code) => {
                    this.alive = false;
                    this.log.push(`child process exited with code ${code}\n`);
                    this.endedTime = new Date();
                    if (code == 0) {
                        updateLastBackup(this.id).catch((err) => {
                            finishPromise.reject(err);
                        });
                        log("INFO", `The ${this.id} backup is complete.`)
                        finishPromise.resolve();
                    } else {
                        finishPromise.reject(new Error(`The ${this.id} backup is exited with code ${code}`));
                    }
                });
            } else {
                startPromise.reject(new Error("Failed to spawn process"));
                this.alive = false;
            }
        } catch (error) {
            startPromise.reject(error);
            this.alive = false;
        }
        return {
            awaitStarted: () => startPromise.promise,
            awaitFinished: () => finishPromise.promise
        }
    }

    getLog() {
        return this.log;
    }

    getId() {
        return this.id;
    }

    getProcess() {
        return this.process;
    }

    isAlive() {
        return this.alive;
    }

    reportError(error: Error) {
        this.error = error;
        this.log.push(`ERROR: ${error.message}\n`);
        log("ERROR", `The "${this.id}" backup is reported with error: ${error.message}`, error);
        this.alive = false;
    }
}


const terminals: Map<number, Terminal> = new Map();

export function createTerminal(id: number) {
    if (terminals.has(id)) {
        const terminal = terminals.get(id)!;
        if (terminal.isAlive()) {
            throw new ApiError(httpStatus.CONFLICT, `The process is already running${terminal.getProcess()?.pid ? `at pid ${terminal.getProcess()?.pid}` : ""}`);
        } else {
            terminals.delete(id);
        }
    }
    const terminal = new Terminal(id);
    terminals.set(id, terminal);
    return terminal;
}

export function getTerminal(id: number) {
    return terminals.get(id);
}

export function stopTerminal(id: number) {
    if (terminals.has(id)) {
        terminals.get(id)?.getProcess()?.kill();
    }
}

export function removeTerminal(id: number) {
    stopTerminal(id);
    terminals.delete(id);
}