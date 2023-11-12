import fs from "fs";
import Joi from "joi";
import log from "../log/log";

const filePath = "data/setting.json";

let setting: { command: string, terminalLogSize: number };

const defaultSetting = { command: "echo Hello World", terminalLogSize: 100 };

if (fs.existsSync(filePath)) {
    setting = readSettingFile();
} else {
    setting = { 
        ...defaultSetting,
    };
    writeSettingFile(setting);
}

log("INFO", "Setting loaded");

function readSettingFile() {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
}

async function writeSettingFile(setting: { command: string }) {
    const data = JSON.stringify(setting, null, 2);
    if (!fs.existsSync("data")) {
        fs.mkdirSync("data");
    }
    await fs.promises.writeFile(filePath, data);
}

export async function saveSetting() {
    writeSettingFile(setting);
}

export async function updateSetting(newSetting: { command: string, terminalLogSize: number }) {
    setting = {
        ...setting,
        ...newSetting,
    };
    await saveSetting();
    return setting;
}

export function getSetting() {
    return {
        ...defaultSetting,
        ...setting,
    };
}