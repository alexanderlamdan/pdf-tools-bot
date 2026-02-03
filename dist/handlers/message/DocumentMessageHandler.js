import { FileService } from "../../services/FileService.js";
import { PdfWorkerService } from "../../services/PdfWorkerService.js";
import { LocalizationService } from "../../services/LocalizationService.js";
import { LoggerService } from "../../services/LoggerService.js";
import { initialSession } from "../../types/SessionData.js";
import { InputFile } from "grammy";
import fs from 'fs';
export class DocumentMessageHandler {
    config;
    localApi;
    fileService;
    workerService;
    localization;
    logger;
    constructor(config, localApi, localization) {
        this.config = config;
        this.localApi = localApi;
        this.localization = localization;
        this.fileService = new FileService(this.config, this.localApi);
        this.workerService = new PdfWorkerService(this.config);
        this.logger = new LoggerService(this.config);
    }
    isSupportedDocument(ctx) {
        return ctx.message?.document?.mime_type === "application/pdf";
    }
    async handle(ctx) {
        const document = ctx.message?.document;
        if (!document)
            return;
        const { lang } = this.localization.getUserLanguage(ctx.from?.language_code);
        const action = ctx.session.currentAction;
        const logInfo = `FILE_ID:${document.file_id} | NAME:${document.file_name} | SIZE:${document.file_size}`;
        await this.logger.logToTelegram(`📄 <b>PDF Document Received</b>\nName: ${document.file_name}\nSize: ${document.file_size} bytes\nLang: ${lang}`, 'DocumentHandler INFO', {
            user: ctx.from,
            message: ctx.message,
            errorText: 'Start processing...',
            botName: ctx.me?.username ?? 'unknown'
        });
        this.logger.logToFile('system/document-process.log', `START PROCESS | USER:${ctx.from.id} | ${logInfo}`);
        const statusMsg = await ctx.reply(this.localization.t(lang, 'processing'), { parse_mode: "HTML" });
        let localPath = null;
        let resultPath = null;
        try {
            localPath = await this.fileService.downloadFile(ctx, document.file_id);
            this.logger.logToFile('system/document-process.log', `DOWNLOADED | Path: ${localPath}`);
            if (action === 'idle') {
                const infoText = await this.workerService.getPdfInfo(localPath, lang);
                this.logger.logToFile('system/document-process.log', `WORKER RESPONSE | Length: ${infoText.length} chars`);
                await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, `${this.localization.t(lang, 'pdf_info')}\n${infoText}`, { parse_mode: "HTML" });
                this.logger.logToFile('system/document-process.log', `SUCCESS | INFO SENT to User ${ctx.from.id}`);
            }
            else if (action === 'compress') {
                await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, this.localization.t(lang, 'compress_info_process'), { parse_mode: "HTML" });
                resultPath = await this.workerService.compress(localPath);
                const oldSize = (await fs.promises.stat(localPath)).size;
                const newSize = (await fs.promises.stat(resultPath)).size;
                const saved = ((oldSize - newSize) / 1024 / 1024).toFixed(2);
                const percent = Math.round(((oldSize - newSize) / oldSize) * 100);
                await ctx.replyWithDocument(new InputFile(resultPath), {
                    caption: `${this.localization.t(lang, 'size_before')} ${(oldSize / 1024 / 1024).toFixed(2)} MB\n ${this.localization.t(lang, 'size_after')} ${(newSize / 1024 / 1024).toFixed(2)} MB\n ${this.localization.t(lang, 'saved_after_compress')} ${saved} MB (${percent}%)</b>`,
                    parse_mode: 'HTML'
                });
                await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id);
                ctx.session = initialSession();
            }
            else if (action === 'protect') {
                ctx.session.filePaths = [localPath];
                ctx.session.step = 'waiting_for_password';
                await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id);
                await ctx.reply(this.localization.t(lang, 'set_password'), { parse_mode: "HTML" });
                localPath = null;
            }
            else if (action === 'crack') {
                await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, this.localization.t(lang, 'cracking_process'), { parse_mode: "HTML" });
                const crackResult = await this.workerService.crack(localPath);
                await ctx.reply(this.localization.t(lang, 'crack_success').replace('{{password}}', crackResult.password), { parse_mode: 'HTML' });
                await ctx.replyWithDocument(new InputFile(crackResult.path));
                resultPath = crackResult.path;
                ctx.session = initialSession();
            }
        }
        catch (e) {
            const errorStack = e.stack ?? e.message;
            console.error("Error in Document Handler", e);
            await this.logger.logToTelegram(`❌ <b>Error Processing PDF</b>\n${e.message}`, 'Error in DocumentHandler', {
                user: ctx.from,
                message: ctx.message,
                errorText: errorStack,
                botName: ctx.me?.username ?? 'unknown'
            });
            this.logger.logToFile('system/document-errors.log', `ERROR | User:${ctx.from.id} | File:${document.file_name} | ${e.message}`);
            await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, `<b>Error:</b> ${e.message}`, { parse_mode: "HTML" });
            ctx.session = initialSession();
        }
        finally {
            if (localPath)
                await this.fileService.deleteFile(localPath);
            if (resultPath)
                await this.fileService.deleteFile(resultPath);
        }
    }
}
