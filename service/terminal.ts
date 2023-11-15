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
    if(!record) {
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
    private process: ReturnType<typeof spawn>;
    private id: number;
    private alive: boolean = true;
    startedTime: Date = new Date();
    endedTime?: Date;

    constructor(id: number, process: ReturnType<typeof spawn>) {
        log("INFO", `The ${id} backup is running.`)
        this.id = id;
        this.process = process;
        this.process.stdout?.on("data", (data) => {
            this.log.push(data.toString());
        });
        this.process.stderr?.on("data", (data) => {
            this.log.push(data.toString());
        });
        this.process.on("close", (code) => {
            this.alive = false;
            this.log.push(`child process exited with code ${code}`);
            this.endedTime = new Date();
            if(code == 0){
                updateLastBackup(this.id).catch((err) => {
                    log("ERROR", `Failed to update last backup time at "${id}"`)
                    console.error(err);
                });
                log("INFO", `The "${id}" backup is complete.`)
            } else {
                log("ERROR", `The "${id}" backup is exited with code ${code}`)
            }
        });
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
}


const terminals: Map<number, Terminal> = new Map();

export function createTerminal(id: number, command: string, args?: string[]) {
    if (terminals.has(id)) {
        const terminal = terminals.get(id)!;
        if (terminal.isAlive()) {
            throw new ApiError(httpStatus.CONFLICT, `The process is already running at pid "${terminal.getProcess().pid}"`);
        } else {
            terminals.delete(id);
        }
    }
    const process = spawn(command, args);
    const terminal = new Terminal(id, process);
    terminals.set(id, terminal);
    return terminal;
}

export function getTerminal(id: number) {
    return terminals.get(id);
}

export function stopTerminal(id: number) {
    if (terminals.has(id)) {
        terminals.get(id)?.getProcess().kill();
    }
}

export function removeTerminal(id: number) {
    if (terminals.has(id)) {
        terminals.get(id)?.getProcess().kill();
    }
    terminals.delete(id);
}