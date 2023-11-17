import httpStatus from "http-status";
import { actionService } from ".";
import Database from "../database";
import log from "../log/log";
import ApiError from "../utils/apiError";

const intervals = new Map<number, NodeJS.Timeout>();

export async function init() {
    const servers = await Database.server.findMany();
    for (const server of servers) {
        if (server.enabled) {
            const intervalId = setInterval(async () => {
                actionService.startBackup(server.id);
            // }, server.interval * 60 * 1000);
            }, 10000);
            intervals.set(server.id, intervalId);

        }
    }
    log("INFO", "Schedule initialized");
}

export async function disable(id: number) {
    const interval = intervals.get(id);
    if (interval) {
        clearInterval(interval);
        intervals.delete(id);
    }
    const server = await Database.server.findUnique({
        where: {
            id
        }
    });
    if (!server) {
        throw new ApiError(httpStatus.NOT_FOUND, "Server not found");
    }
    await Database.server.update({
        where: {
            id
        },
        data: {
            ...server,
            enabled: false,
        }
    });
    log("INFO", `Schedule for server ${id} disabled`);
}

export async function activate(id: number) {
    const server = await Database.server.findUnique({
        where: {
            id
        }
    });
    if (!server) {
        throw new ApiError(httpStatus.NOT_FOUND, "Server not found");
    }
    await Database.server.update({
        where: {
            id
        },
        data: {
            ...server,
            enabled: true,
        }
    });
    if(!intervals.has(server.id)) {
        const intervalId = setInterval(async () => {
            actionService.startBackup(server.id);
        // }, server.interval * 60 * 1000);
        }, 10000);
        intervals.set(server.id, intervalId);
    }
    log("INFO", `Schedule for server ${id} activated`);
}

export function isActive(id: number) {
    return intervals.has(id);
}

export async function isEnabled(id: number){
    const server = await Database.server.findUnique({
        where: {
            id
        }
    });
    if (!server) {
        throw new ApiError(httpStatus.NOT_FOUND, "Server not found");
    }
    return server.enabled;
}