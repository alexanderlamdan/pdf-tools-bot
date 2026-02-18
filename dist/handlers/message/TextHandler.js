import { LocalizationService } from '../../services/LocalizationService.js';
import { PdfWorkerService } from '../../services/PdfWorkerService.js';
import { FileService } from '../../services/FileService.js';
import { InputFile } from 'grammy';
import { initialSession } from '../../types/SessionData.js';
import { FileNameUtils } from '../../utils/FileNameUtils.js';
import { Keyboards } from '../../services/Keyboards.js';
import { LoggerService } from '../../services/LoggerService.js';
import { DatabaseService } from '../../services/DatabaseService.js';
import fs from 'fs';
export class TextHandler {
    config;
    localApi;
    localization;
    workerService;
    fileService;
    keyboards;
    logger;
    db;
    constructor(config, localApi, localization) {
        this.config = config;
        this.localApi = localApi;
        this.localization = localization;
        this.workerService = new PdfWorkerService(this.config);
        this.fileService = new FileService(this.config, this.localApi);
        this.keyboards = new Keyboards(this.localization);
        this.logger = new LoggerService(this.config);
        this.db = new DatabaseService(this.logger);
    }
    async handle(ctx) {
        const { lang } = this.localization.getUserLanguage(ctx.from?.language_code);
        const text = ctx.message?.text;
        const isAdmin = ctx.from?.id === this.config.adminId;
        if (!text)
            return;
        if (ctx.from) {
            await this.db.registerUser(ctx.from.id, ctx.from.username, ctx.from.first_name);
        }
        if (text.startsWith('/') || this.localization.getActionKeyByText(text))
            return;
        const action = ctx.session.currentAction;
        const step = ctx.session.step;
        if (action === 'protect' && step === 'waiting_for_password') {
            await this.logger.logAction(ctx.from, 'Input password', '***HIDDEN***');
            const password = text.trim();
            if (password.length < 1) {
                await ctx.reply(this.localization.t(lang, 'errors.password_empty'));
                return;
            }
            const filePath = ctx.session.filePaths[0];
            if (!filePath) {
                await ctx.reply(this.localization.t(lang, 'messages.actions.file_lost'));
                ctx.session = initialSession();
                return;
            }
            const statusMsg = await ctx.reply(this.localization.t(lang, 'messages.actions.encrypting'));
            let resultPath = null;
            try {
                resultPath = await this.workerService.encrypt(filePath, password);
                const stats = await fs.promises.stat(resultPath);
                await this.db.logAction(ctx.from.id, 'protect', stats.size);
                const suffix = this.localization.t(lang, 'messages.actions.suffix_protected');
                const originalName = ctx.session.tempParams?.originalName || 'Document.pdf';
                const safeName = FileNameUtils.getSafeName(originalName, suffix);
                const safePassword = FileNameUtils.escapeHtml(password);
                await ctx.replyWithDocument(new InputFile(resultPath, safeName), {
                    caption: this.localization.t(lang, 'messages.actions.success_protect'),
                    parse_mode: 'HTML',
                    reply_markup: this.keyboards.getMainMenu(lang, isAdmin)
                });
                await this.fileService.deleteFile(filePath);
                await this.fileService.deleteFile(resultPath);
                ctx.session = initialSession();
                return;
            }
            catch (e) {
                await this.logger.error('TextHandler:protect', e, { user: ctx.from, message: ctx.message });
                ctx.session = initialSession();
            }
            finally {
                await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => { });
            }
            return;
        }
        else if (action === 'unlock' && step === 'waiting_for_password') {
            const password = text.trim();
            const filePath = ctx.session.filePaths[0];
            if (!filePath) {
                await ctx.reply(this.localization.t(lang, 'messages.actions.file_lost'));
                return;
            }
            const statusMsg = await ctx.reply(this.localization.t(lang, 'messages.actions.decrypting'));
            try {
                const resultPath = await this.workerService.decrypt(filePath, password);
                const stats = await fs.promises.stat(resultPath);
                this.db.logAction(ctx.from.id, 'unlock', stats.size);
                const safeName = FileNameUtils.getSafeName(ctx.session.tempParams?.originalName || 'doc.pdf', '');
                await ctx.replyWithDocument(new InputFile(resultPath, safeName), {
                    caption: this.localization.t(lang, 'messages.actions.success_crack').replace('{{password}}', password),
                    parse_mode: 'HTML',
                    reply_markup: this.keyboards.getMainMenu(lang, isAdmin)
                });
                await this.fileService.deleteFile(resultPath);
                await this.fileService.deleteFile(filePath);
                ctx.session = initialSession();
                return;
            }
            catch (e) {
                await ctx.reply(this.localization.t(lang, 'messages.actions.decrypt_fail'));
                await this.logger.logAction(ctx.from, 'Unlock Failed', 'Wrong password');
            }
            finally {
                await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => { });
            }
            return;
        }
        await this.logger.logAction(ctx.from, 'Spam text', text);
        await ctx.reply(this.localization.t(lang, 'errors.text_rejected'), {
            parse_mode: 'HTML',
            reply_markup: this.keyboards.getMainMenu(lang, isAdmin)
        });
    }
}
