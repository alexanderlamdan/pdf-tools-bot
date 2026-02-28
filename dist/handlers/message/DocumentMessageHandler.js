import { FileService } from '../../services/FileService.js';
import { PdfWorkerService } from '../../services/PdfWorkerService.js';
import { LocalizationService } from '../../services/LocalizationService.js';
import { LoggerService } from '../../services/LoggerService.js';
import { initialSession } from '../../types/SessionData.js';
import { Keyboards } from '../../services/Keyboards.js';
import { FileNameUtils } from '../../utils/FileNameUtils.js';
import { DatabaseService } from '../../services/DatabaseService.js';
import { SmartQueueService } from '../../services/SmartQueueService.js';
import { getTrafficState, getTrafficStateAfterFile } from '../../utils/SubscriptionUtils.js';
export class DocumentMessageHandler {
    config;
    localApi;
    fileService;
    workerService;
    localization;
    logger;
    keyboards;
    db;
    constructor(config, localApi, localization) {
        this.config = config;
        this.localApi = localApi;
        this.localization = localization;
        this.logger = new LoggerService(this.config);
        this.db = new DatabaseService(this.logger);
        this.keyboards = new Keyboards(this.localization);
        this.fileService = new FileService(this.config, this.localApi);
        this.workerService = new PdfWorkerService(this.config, SmartQueueService.getInstance(this.localization, this.db));
    }
    async handle(ctx) {
        const lang = this.getLang(ctx);
        const i18n = this.localization.get(lang);
        await ctx.reply(i18n.messages.queue.file_upload);
        const document = ctx.message?.document;
        if (!document)
            return;
        const isAdmin = ctx.from?.id === this.config.adminId;
        if (ctx.session.step === 'waiting_for_merge_files') {
            if (!this.isSupportedDocument(ctx)) {
                await this.handleInvalidFormat(ctx, document, lang, isAdmin);
                return;
            }
            (async () => {
                try {
                    const localPath = await this.fileService.downloadFile(ctx, document.file_id);
                    ctx.session.filePaths.push(localPath);
                    await ctx.reply(`${i18n.messages.actions.merge_file_queue}<b>${ctx.session.filePaths.length}</b>`, { parse_mode: 'HTML' });
                    return;
                }
                catch (e) {
                    console.error("[Background Merge Error]: ", e);
                }
            })();
            return;
        }
        const user = await this.db.getUser(ctx.from.id);
        if (user && user.isVip !== 1) {
            const currentState = getTrafficState(user, this.config.adminId);
            const fileSizeBytes = document.file_size || 0;
            if (currentState.status === 'blocked') {
                await this.logger.logAction('DocumentMessageHandler', ctx.from, 'Upload blocked — traffic exhausted', `Used: ${(currentState.usedBytes / 1024 / 1024 / 1024).toFixed(2)} GB / limit`);
                await ctx.reply(i18n.messages.subscription.limit_exceeded, {
                    parse_mode: 'HTML',
                    reply_markup: this.keyboards.getSubscriptionMenu(lang)
                });
                ctx.session.currentAction = 'idle';
                ctx.session.step = 'idle';
                return;
            }
            const stateAfter = getTrafficStateAfterFile(user, fileSizeBytes, this.config.adminId);
            if (stateAfter.status === 'blocked') {
                ctx.session.tempParams = {
                    ...(ctx.session.tempParams || {}),
                    willExceedLimit: 'true'
                };
                await this.logger.logAction('DocumentMessageHandler', ctx.from, 'Last free file', `File: ${document.file_name} | After upload traffic will be exhausted`);
            }
            else if (currentState.status === 'warning' || currentState.status === 'warning_strong') {
                ctx.session.tempParams = {
                    ...(ctx.session.tempParams || {}),
                    trafficWarning: currentState.remainMB
                };
            }
        }
        await ctx.reply(i18n.messages.queue.file_upload);
        if (ctx.session.filePaths && ctx.session.filePaths.length > 0) {
            for (const oldPath of ctx.session.filePaths) {
                await this.fileService.deleteFile(oldPath);
            }
            ctx.session.filePaths = [];
        }
        if (!this.isSupportedDocument(ctx)) {
            await this.handleInvalidFormat(ctx, document, lang, isAdmin);
            return;
        }
        await this.trackActivity(ctx, document, lang);
        const statusMsg = await ctx.reply(i18n.messages.analysis.processing, {
            parse_mode: 'HTML',
            reply_markup: { remove_keyboard: true }
        });
        (async () => {
            let localPath = null;
            try {
                localPath = await this.fileService.downloadFile(ctx, document.file_id);
                const info = await this.workerService.getPdfInfo(ctx, localPath, lang, document.file_size || 0);
                this.updateSession(ctx, localPath, document.file_name);
                await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id);
                if (info.is_corrupt && !info.encrypted) {
                    await this.handleCorruptFile(ctx, lang);
                }
                else if (info.encrypted) {
                    await this.handleEncryptedFile(ctx, lang);
                }
                else {
                    await this.handleValidFile(ctx, document, info, lang);
                }
                localPath = null;
            }
            catch (error) {
                await this.handleError(ctx, error, statusMsg.message_id, localPath, lang);
            }
        })();
    }
    getLang(ctx) {
        return this.localization.getUserLanguage(ctx.from?.language_code).lang;
    }
    isSupportedDocument(ctx) {
        return ctx.message?.document?.mime_type === 'application/pdf';
    }
    updateSession(ctx, path, originalName) {
        ctx.session.filePaths = [path];
        ctx.session.tempParams = { originalName: originalName || 'doc.pdf' };
    }
    formatSize(bytes) {
        if (!+bytes)
            return '0 Bytes';
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat(((bytes / Math.pow(k, i))).toFixed(2))} ${['Bytes', 'KB', 'MB', 'GB'][i]}`;
    }
    async handleInvalidFormat(ctx, doc, lang, isAdmin) {
        const i18n = this.localization.get(lang);
        await this.logger.logAction('DocumentMessageHandler', ctx.from, 'Trash upload', `Rejected: ${doc.file_name} (${doc.mime_type})`);
        try {
            await ctx.deleteMessage();
        }
        catch { }
        await ctx.reply(i18n.errors.not_pdf, {
            parse_mode: 'HTML',
            reply_markup: this.keyboards.getMainMenu(lang, isAdmin)
        });
    }
    async trackActivity(ctx, doc, lang) {
        await this.db.registerUser(ctx.from.id, ctx.from.username, ctx.from.first_name, lang);
        await this.db.logAction(ctx.from.id, 'upload', doc.file_size || 0);
        const sizeFormatted = this.formatSize(doc.file_size || 0);
        await this.logger.logAction('DocumentMessageHandler', ctx.from, 'File upload', `📄 ${doc.file_name} | ${sizeFormatted}`);
    }
    async handleCorruptFile(ctx, lang) {
        const i18n = this.localization.get(lang);
        await ctx.reply(i18n.messages.analysis.corrupt, {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: [[{ text: i18n.buttons.files.btn_repair }]],
                resize_keyboard: true
            }
        });
    }
    async handleEncryptedFile(ctx, lang) {
        const i18n = this.localization.get(lang);
        ctx.session.currentAction = 'unlock';
        await ctx.reply(i18n.messages.analysis.encrypted, {
            parse_mode: 'HTML',
            reply_markup: this.keyboards.getEncryptedFileMenu(lang)
        });
    }
    async handleValidFile(ctx, doc, info, lang) {
        ctx.session.currentAction = 'ready';
        const reportText = this.generateAnalysisReport(doc, info, lang);
        await ctx.reply(reportText, {
            parse_mode: 'HTML',
            reply_markup: this.keyboards.getFileActionsMenu(lang)
        });
    }
    async handleError(ctx, e, msgId, path, lang) {
        const i18n = this.localization.get(lang);
        console.error(e);
        await this.logger.error('DocumentHandler', e, { user: ctx.from, message: ctx.message });
        const isCorrupt = e.message?.includes('invalid') || e.message?.includes('corrupt');
        const errorKey = isCorrupt ? i18n.messages.analysis.corrupt : i18n.messages.actions.file_lost;
        const errorText = isCorrupt ? errorKey : `Error: ${e.message}`;
        await ctx.api.editMessageText(ctx.chat.id, msgId, errorText, { parse_mode: 'HTML' }).catch(() => { });
        if (path) {
            await this.fileService.deleteFile(path);
        }
        ctx.session = initialSession();
    }
    generateAnalysisReport(doc, info, lang) {
        const i18n = this.localization.get(lang);
        const yes = i18n.messages.analysis.val_yes;
        const no = i18n.messages.analysis.val_no;
        let text = i18n.messages.analysis.result_title + '\n\n';
        text += i18n.messages.analysis.field_name.replace('{{name}}', FileNameUtils.escapeHtml(doc.file_name || 'doc.pdf')) + '\n';
        text += i18n.messages.analysis.field_size.replace('{{size}}', this.formatSize(info.size)) + '\n';
        const pageCount = (info.pages !== undefined && info.pages !== null) ? info.pages.toString() : '0';
        text += i18n.messages.analysis.field_pages.replace('{{pages}}', pageCount) + '\n';
        let typeStr = i18n.messages.analysis.type_standard;
        if (info.is_scanned) {
            typeStr = i18n.messages.analysis.type_scanned;
        }
        text += i18n.messages.analysis.field_type.replace('{{type}}', typeStr) + '\n';
        const encVal = info.encrypted ? yes : no;
        text += i18n.messages.analysis.field_encrypted.replace('{{encrypted}}', encVal) + '\n\n';
        let compressStatus = info.can_compress ? yes : no;
        if (!info.can_compress) {
            if (info.is_scanned) {
                compressStatus = i18n.messages.analysis.val_scanned;
            }
            else if (info.cant_compress_reason) {
                compressStatus = i18n.messages.analysis.val_reason.replace('{{reason}}', info.cant_compress_reason);
            }
        }
        const splitVal = info.can_split ? yes : no;
        const mergeVal = info.can_merge ? yes : no;
        const metaVal = info.has_metadata ? yes : no;
        text += i18n.messages.analysis.field_actions
            .replace('{{compress}}', compressStatus)
            .replace('{{split}}', splitVal)
            .replace('{{merge}}', mergeVal)
            .replace('{{meta}}', metaVal);
        return text;
    }
}
