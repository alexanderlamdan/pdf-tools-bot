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
import { SmartQueueService } from '../../services/SmartQueueService.js';
import { notifyTrafficAfterResult } from '../../utils/TrafficNotifier.js';
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
        this.keyboards = new Keyboards(this.localization);
        this.logger = new LoggerService(this.config);
        this.db = new DatabaseService(this.logger);
        this.workerService = new PdfWorkerService(this.config, SmartQueueService.getInstance(this.localization, this.db));
        this.fileService = new FileService(this.config, this.localApi);
    }
    async handle(ctx) {
        const { lang } = this.localization.getUserLanguage(ctx.from?.language_code);
        const i18n = this.localization.get(lang);
        const text = ctx.message?.text;
        const isAdmin = ctx.from?.id === this.config.adminId;
        if (!text)
            return;
        if (ctx.from) {
            await this.db.registerUser(ctx.from.id, ctx.from.username, ctx.from.first_name, lang);
        }
        if (text.startsWith('/') || this.localization.getActionKeyByText(text))
            return;
        const action = ctx.session.currentAction;
        const step = ctx.session.step;
        if (action === 'protect' && step === 'waiting_for_password') {
            await this.logger.logAction('TextHandler', ctx.from, 'Password input', 'protect — ***HIDDEN***');
            const password = text.trim();
            if (password.length < 1) {
                await ctx.reply(i18n.errors.password_empty);
                return;
            }
            const filePath = ctx.session.filePaths[0];
            if (!filePath) {
                await ctx.reply(i18n.messages.actions.file_lost);
                ctx.session = initialSession();
                return;
            }
            const statusMsg = await ctx.reply(i18n.messages.actions.encrypting);
            let resultPath = null;
            const sizeBytes = fs.statSync(filePath).size;
            try {
                resultPath = await this.workerService.encrypt(ctx, filePath, password, sizeBytes);
                const stats = await fs.promises.stat(resultPath);
                await this.db.logAction(ctx.from.id, 'protect', stats.size);
                const suffix = i18n.messages.actions.suffix_protected;
                const originalName = ctx.session.tempParams?.originalName || 'Document.pdf';
                const safeName = FileNameUtils.getSafeName(originalName, suffix);
                const safePassword = FileNameUtils.escapeHtml(password);
                await this.logger.logAction('TextHandler', ctx.from, 'Protect result', `File: ${originalName}`, 'Success');
                await ctx.replyWithDocument(new InputFile(resultPath, safeName), {
                    caption: i18n.messages.actions.success_protect,
                    parse_mode: 'HTML',
                    reply_markup: this.keyboards.getMainMenu(lang, isAdmin)
                });
                await this.fileService.deleteFile(filePath);
                await this.fileService.deleteFile(resultPath);
                await notifyTrafficAfterResult(ctx, lang, this.localization, this.keyboards, this.logger);
                ctx.session = initialSession();
                return;
            }
            catch (e) {
                const safeError = e;
                if (safeError.message && safeError.message.length > 2000) {
                    safeError.message = safeError.message.substring(0, 2000) + '... [TRUNCATED]';
                }
                await this.logger.error('TextHandler:protect', safeError, { user: ctx.from, message: ctx.message });
                ctx.session = initialSession();
            }
            finally {
                await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => { });
            }
            return;
        }
        else if (action === 'unlock' && step === 'waiting_for_password') {
            await this.logger.logAction('TextHandler', ctx.from, 'Password input', 'unlock — ***HIDDEN***');
            const password = text.trim();
            const filePath = ctx.session.filePaths[0];
            if (!filePath) {
                await ctx.reply(i18n.messages.actions.file_lost);
                return;
            }
            const statusMsg = await ctx.reply(i18n.messages.actions.decrypting);
            const sizeBytes = fs.statSync(filePath).size;
            try {
                const resultPath = await this.workerService.decrypt(ctx, filePath, password, sizeBytes);
                const stats = await fs.promises.stat(resultPath);
                this.db.logAction(ctx.from.id, 'unlock', stats.size);
                const safeName = FileNameUtils.getSafeName(ctx.session.tempParams?.originalName || 'doc.pdf', '');
                await this.logger.logAction('TextHandler', ctx.from, 'Unlock result', `File: ${ctx.session.tempParams?.originalName || 'doc.pdf'}`, 'Success — password accepted');
                await ctx.replyWithDocument(new InputFile(resultPath, safeName), {
                    caption: i18n.messages.actions.success_crack.replace('{{password}}', password),
                    parse_mode: 'HTML',
                    reply_markup: this.keyboards.getMainMenu(lang, isAdmin)
                });
                await this.fileService.deleteFile(resultPath);
                await this.fileService.deleteFile(filePath);
                await notifyTrafficAfterResult(ctx, lang, this.localization, this.keyboards, this.logger);
                ctx.session = initialSession();
                return;
            }
            catch (e) {
                await this.logger.logAction('TextHandler', ctx.from, 'Unlock result', `File: ${ctx.session.tempParams?.originalName || 'doc.pdf'}`, 'Failed — wrong password');
                await ctx.reply(i18n.messages.actions.fail_crack);
            }
            finally {
                await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => { });
            }
            return;
        }
        else if (action === 'split' && step === 'waiting_for_split_pages') {
            const pages = text.trim();
            const filePath = ctx.session.filePaths[0];
            if (!filePath) {
                await ctx.reply(i18n.messages.actions.file_lost, { parse_mode: 'HTML' });
                ctx.session = initialSession();
                return;
            }
            await this.logger.logAction('TextHandler', ctx.from, 'Split pages input', `Pages: ${pages} | File: ${ctx.session.tempParams?.originalName || 'doc.pdf'}`);
            const statusMsg = await ctx.reply(i18n.messages.common.wait, { parse_mode: 'HTML' });
            try {
                const sizeBytes = fs.statSync(filePath).size;
                const result = await this.workerService.split(ctx, filePath, pages, sizeBytes);
                const originalName = ctx.session.tempParams?.originalName || 'Document.pdf';
                const safeNamePdf = FileNameUtils.getSafeName(originalName, 'splitted');
                const captionPdf = i18n.messages.actions.split_caption_success_file + `<b>${pages}</b>`;
                const captionZip = i18n.messages.actions.split_caption_success_zip + `<b>${pages}</b>`;
                await ctx.replyWithDocument(new InputFile(result.path, safeNamePdf), {
                    caption: captionPdf,
                    parse_mode: 'HTML',
                    reply_markup: result.zipPath ? undefined : this.keyboards.getMainMenu(lang, isAdmin)
                });
                const statsPdf = await fs.promises.stat(result.path);
                let totalLogSize = statsPdf.size;
                if (result.zipPath) {
                    const safeNameZip = safeNamePdf.replace('.pdf', '.zip');
                    await ctx.replyWithDocument(new InputFile(result.zipPath, safeNameZip), {
                        caption: captionZip,
                        parse_mode: 'HTML',
                        reply_markup: this.keyboards.getMainMenu(lang, isAdmin)
                    });
                    const statsZip = await fs.promises.stat(result.zipPath);
                    totalLogSize += statsZip.size;
                    await this.fileService.deleteFile(result.zipPath);
                }
                await this.db.logAction(ctx.from.id, 'split', totalLogSize);
                await this.logger.logAction('TextHandler', ctx.from, 'Split result', `Pages: ${pages} | File: ${originalName}`, `Success — ${result.zipPath ? 'PDF + ZIP' : 'PDF only'}`);
                await this.fileService.deleteFile(filePath);
                await this.fileService.deleteFile(result.path);
                await notifyTrafficAfterResult(ctx, lang, this.localization, this.keyboards, this.logger);
                ctx.session = initialSession();
            }
            catch (e) {
                await this.logger.error('TextHandler:split', e, { user: ctx.from, message: ctx.message });
                await ctx.reply(`Error: ${e.message}`, {
                    reply_markup: this.keyboards.getMainMenu(lang, isAdmin)
                });
                ctx.session = initialSession();
            }
            finally {
                await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => { });
            }
            return;
        }
        await this.logger.logAction('TextHandler', ctx.from, 'Rejected text', text.length > 50 ? text.substring(0, 50) + '...' : text);
        await ctx.reply(i18n.errors.text_rejected, {
            parse_mode: 'HTML',
            reply_markup: this.keyboards.getMainMenu(lang, isAdmin)
        });
    }
}
