import httpStatus from "http-status";
import Database from "../database";
import ApiError from "../utils/apiError";
import { settingService, terminalService } from ".";
import formatString from "../utils/formatString";
import { MongoClient } from "mongodb";
import moment from "moment";
import drive from "../gdrive";
import fs from "fs";
import formatDataSize from "./formatDataSize";
import createPromise from "./createPromise";

export async function startBackup(id: number) {
    const startedPromise = await createPromise<void>();
    const finishedPromise = await createPromise<void>();

    const record = await Database.server.findUnique({
        where: {
            id,
        },
    });
    if (!record) {
        throw new ApiError(httpStatus.NOT_FOUND, "Server not found");
    }
    const terminal = terminalService.createTerminal(record.id);
    try {
        const server = await Database.server.findUnique({
            where: {
                id,
            },
        });
        if (!server) {
            throw new ApiError(httpStatus.NOT_FOUND, "Server not found");
        }
        const terminalLog = terminal.getLog();
        const mongoClient = new MongoClient(record.uri, {
            serverSelectionTimeoutMS: 3000,
        });
        terminalLog.push("Connecting...\n");
        await mongoClient.connect();
        terminalLog.push("Load setting...\n");
        const command = settingService.getSetting().command;
        const formattedFileName = formatString(settingService.getSetting().fileNameFormat, {
            suffix: moment().format(settingService.getSetting().suffixFormat),
            name: mongoClient.db().databaseName,
        });
        const dir = settingService.getSetting().backupDir;
        const formated = formatString(command, {
            uri: record.uri,
            fileName: formattedFileName,
            dir,
        });
        terminalLog.push("Start backup...\n");
        const commandArray = formated.split(" ");
        const runPromisses = await terminal.run(commandArray[0], commandArray.slice(1));
        await runPromisses.awaitStarted();
        startedPromise.resolve();
        (async () => {
            try {
                await runPromisses.awaitFinished();
                terminalLog.push("Upload backup...\n");
                const path = `${dir}/${formattedFileName}`;
                terminalLog.push(`Uploading: ${path}\n`);
                const isExist = fs.existsSync(path);
                if(!isExist) {
                    throw new Error("Backup file not found");
                }
                const fileSize = fs.statSync(path).size;
                const fileStream = fs.createReadStream(path);
                let uploadedSize = 0;
                fileStream.on("data", (chunk) => {
                    uploadedSize += chunk.length;
                    terminalLog.push(`Uploading... ${formatDataSize(uploadedSize)}/${formatDataSize(fileSize)} ${Math.round(uploadedSize / fileSize * 100)}%\n`);
                });
                await drive.files.create({
                    media: {
                        body: fs.createReadStream(path),
                    },
                    requestBody: {
                        name: formattedFileName,
                        parents: [server.gdriveDirId || settingService.getSetting().driveDirId],
                    },
                });
                terminalLog.push("Cleaning...\n");
                fs.unlinkSync(path);
                terminalLog.push("Done\n");
                finishedPromise.resolve();
            } catch (error: any) {
                terminal.reportError(error);
                finishedPromise.reject(error);
            }
        })();
    } catch (error: any) {
        terminal.reportError(error);
        startedPromise.reject(error);
    }
    return {
        awaitStarted: () => startedPromise.promise,
        awaitFinished: () => finishedPromise.promise,
    }
}
