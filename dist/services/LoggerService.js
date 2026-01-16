import fs from 'fs';
import path from 'path';
import os from 'os';
import { Bot, InputFile } from 'grammy';
import { TelegramLogFormatter } from './telegramLogFormatter/TelegramLogFormatter.js';
export class LoggerService {
    config;
    logDir;
    logChannelId;
    logBot;
    formatter;
    constructor(config) {
        this.config = config;
        this.logDir = `/srv/runtime/${config.botName}/logs`;
        if (config.channelLogId === undefined) {
            throw new Error('LoggerService: config.channelLogId is required');
        }
        this.logChannelId = config.channelLogId;
        this.logBot = new Bot(config.token);
        this.formatter = new TelegramLogFormatter();
    }
    ensureDirSync(dir) {
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true });
    }
    logToFile(subpath, message) {
        const fullPath = path.join(this.logDir, subpath);
        const now = new Date();
        const logLine = `[${now.toLocaleString('en-IL', {
            timeZone: 'Asia/Jerusalem',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(/[/]/g, '-').replace(',', '')}] ${message}\n`;
        this.ensureDirSync(path.dirname(fullPath));
        fs.appendFileSync(fullPath, logLine, 'utf8');
    }
    async logToTelegram(text, title = 'Log', options) {
        let body = text;
        if (options?.user && options?.message && options?.errorText && options?.botName) {
            body = this.formatter.formatErrorLog({
                botName: options.botName,
                user: options.user,
                message: options.message,
                errorText: options.errorText
            });
        }
        try {
            if (body.length <= 1500) {
                await this.logBot.api.sendMessage(this.logChannelId, `<b>${title}</b>\n${body}`, { parse_mode: "HTML" });
            }
            else {
                const tmpDir = os.tmpdir();
                const filename = `log_${Date.now()}.log`;
                const filePath = path.join(tmpDir, filename);
                fs.writeFileSync(filePath, body);
                await this.logBot.api.sendDocument(this.logChannelId, new InputFile(filePath), {
                    caption: `<b>${title}</b>\n(log added as a file)`,
                    parse_mode: "HTML"
                });
                fs.unlink(filePath, () => { });
            }
        }
        catch (e) {
            this.logToFile('system/logger-errors.log', `ERROR logToTelegram: ${e}`);
        }
    }
}
