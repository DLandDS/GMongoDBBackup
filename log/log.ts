import moment from "moment";

export const LogType = {
    INFO: "INFO",
    WARN: "WARN",
    ERROR: "ERROR",
} as const;

export type LogType = typeof LogType[keyof typeof LogType];

export default function log(type: LogType, message: string){
    console.log(`${moment().format("YYYY-MM-DD HH:mm:ss")} [${type}]: ${message}`);
}