import { spawn } from 'child_process';
import FixedLengthArray from '../utils/fixedLenghtArray';

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


class Terminal {
    private log: TerminalLog = new TerminalLog();
    private process: ReturnType<typeof spawn>;
    private id: string;

    constructor(id: string, process: ReturnType<typeof spawn>) {
        this.id = id;
        this.process = process;
        this.process.stdout?.on("data", (data) => {
            this.log.push(data.toString());
        });
        this.process.stderr?.on("data", (data) => {
            this.log.push(data.toString());
        });
        this.process.on("close", (code) => {
            this.log.push(`child process exited with code ${code}`);
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
}


const terminals: Map<string, Terminal> = new Map();

export function createTerminal(id: string, command: string, args?: string[]) {
    const process = spawn(command, args);
    const terminal = new Terminal(id, process);
    terminals.set(id, terminal);
    return terminal;
}

export function getTerminal(id: string) {
    return terminals.get(id);
}

export function removeTerminal(id: string) {
    terminals.delete(id);
}