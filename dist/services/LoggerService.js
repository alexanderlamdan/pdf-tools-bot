import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { Bot, InputFile } from 'grammy';
import { TelegramLogFormatter } from './telegramLogFormatter/TelegramLogFormatter.js';
import { UserInfoFormatter } from '../utils/UserInfoFormatter.js';
export class LoggerService {
    config;
    logDir;
    logChannelId;
    logBot;
    formatter;
    maxFileSize = 50 * 1024 * 1024;
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
        const timeString = `[${now.toLocaleString('en-IL', { timeZone: 'Asia/Jerusalem',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(/[/]/g, '-').replace(',', '')}]`;
        const logLine = `[${timeString}] ${message}\n`;
        this.ensureDirSync(path.dirname(fullPath));
        try {
            if (fs.existsSync(fullPath)) {
                const stats = fs.statSync(fullPath);
                if (stats.size >= this.maxFileSize) {
                    const timestamp = Date.now();
                    const rotatedPath = `${fullPath}.${timestamp}`;
                    fs.renameSync(fullPath, rotatedPath);
                    const archiveName = `${path.basename(rotatedPath)}.tar.gz`;
                    const dirName = path.dirname(fullPath);
                    exec(`tar -czf "${archiveName}" "${path.basename(rotatedPath)}" && rm "${path.basename(rotatedPath)}"`, { cwd: dirName }, (error) => {
                        if (error) {
                            console.error(`[Logger] Failed to compress log: ${error.message}`);
                        }
                        else {
                            console.log(`[Logger] Log archived: ${archiveName}`);
                        }
                    });
                }
            }
        }
        catch (e) {
            console.error('[Logger] Error during log rotation: ', e);
        }
        try {
            fs.appendFileSync(fullPath, logLine, 'utf-8');
        }
        catch (e) {
            console.error('[Logger] Failed to write to file: ', e);
        }
    }
    async logAction(user, action, details = '') {
        const userLink = `<a href="tg://user?id=${user.id}">${user.first_name}</a>`;
        const telegramText = `👤 <b>User:</b> ${userLink} (<code>${user.id}</code>)\n` +
            `⚡️ <b>Action:</b> ${action}\n` +
            (details ? `📝 <b>Details:</b> ${details}` : '');
        const fileLog = `ACTION | User: ${user.id} (${user.username || ''}) | Action: ${action} | ${details}`;
        this.logToFile('actions.log', fileLog);
        await this.sendToTelegram(telegramText);
    }
    async error(source, error, context) {
        const userStr = context?.user ? `User: ${context.user.id}` : 'System';
        this.logToFile('errors.log', `ERROR | ${source} | ${userStr} | ${error.message} | Stack: ${error.stack}`);
        let body = '';
        if (context?.user && context?.message) {
            body = this.formatter.formatErrorLog({
                botName: this.config.botName,
                user: context.user,
                message: context.message,
                errorText: error.message
            });
        }
        else {
            body = `❌ <b>ERROR:</b> ${source}\nMessage: ${error.message}`;
        }
        await this.sendToTelegram(body);
    }
    async sendToTelegram(body) {
        try {
            if (body.length <= 4000) {
                await this.logBot.api.sendMessage(this.logChannelId, body, { parse_mode: 'HTML' });
            }
            else {
                const tmpDir = os.tmpdir();
                const filename = `log_${Date.now()}.html`;
                const filePath = path.join(tmpDir, filename);
                fs.writeFileSync(filePath, body);
                await this.logBot.api.sendDocument(this.logChannelId, new InputFile(filePath), {
                    caption: `<b>Too long</b>`,
                    parse_mode: 'HTML'
                });
                fs.unlink(filePath, () => { });
            }
        }
        catch (e) {
            console.error('Logger fail: ', e);
            this.logToFile('system/logger-errors.log', `ERROR sending to telegram: ${e}`);
        }
    }
}
