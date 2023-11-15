import httpStatus from "http-status";
import Database from "../database";
import ApiError from "../utils/apiError";
import { settingService, terminalService } from ".";
import formatString from "../utils/formatString";
import { MongoClient } from "mongodb";
import moment from "moment";

export async function startBackup(id: number) {
    const record = await Database.server.findUnique({
        where: {
            id,
        },
    });
    if (!record) {
        throw new ApiError(httpStatus.NOT_FOUND, "Server not found");
    }
    const terminal = terminalService.createTerminal(record.id);
    const log = terminal.getLog();
    const mongoClient = new MongoClient(record.uri, {
        serverSelectionTimeoutMS: 3000,
    });
    log.push("Connecting...\n");
    await mongoClient.connect();
    log.push("Load setting...\n");
    const command = settingService.getSetting().command;
    const formated = formatString(command, {
        uri: record.uri,
        name: mongoClient.db().databaseName,
        suffix: moment().format(settingService.getSetting().suffixFormat),
        dir: settingService.getSetting().backupDir,
    });
    log.push("Start backup...\n");
    const commandArray = formated.split(" ");
    const runPromisses = terminal.run(commandArray[0], commandArray.slice(1));
    await runPromisses.awaitStarted()
    runPromisses.awaitFinished().then(async () => {
        log.push("Upload backup...\n");
    });
    
}
