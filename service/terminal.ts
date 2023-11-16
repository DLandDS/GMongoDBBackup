import { spawn } from 'child_process';
import FixedLengthArray from '../utils/fixedLenghtArray';
import ApiError from '../utils/apiError';
import httpStatus from 'http-status';
import Database from '../database';
import log from '../log/log';

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

    run(command: string, args?: string[]) {
        let startPromiseResolve: (args?: any) => any;
        let startPromiseReject: (reason: any) => any;
        let finishPromiseResolve: (args?: any) => any;
        let finishPromiseReject: (reason: any) => any;
        const startPromise = new Promise((resolve, reject) => {
            startPromiseReject = reject;
            startPromiseResolve = resolve;
        });
        const finishPromise = new Promise((resolve, reject) => {
            finishPromiseReject = reject;
            finishPromiseResolve = resolve;
        });
        try {
            this.process = spawn(command, args);
            startPromiseResolve!?.call(this);
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
                            finishPromiseReject!?.call(this, err);
                        });
                        log("INFO", `The ${this.id} backup is complete.`)
                        finishPromiseResolve!?.call(this);
                    } else {
                        finishPromiseReject!?.call(this, new Error(`The ${this} backup is exited with code ${code}`));
                    }
                });
            } else {
                startPromiseReject!?.call(this, new Error("Failed to spawn process"));
                this.alive = false;
            }
        } catch (error) {
            startPromiseReject!?.call(this, error);
            this.alive = false;
        }
        return {
            awaitStarted: () => {
                return startPromise;
            },
            awaitFinished: () => {
                return finishPromise;
            }
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