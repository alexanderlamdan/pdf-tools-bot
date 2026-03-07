import { BaseHandler } from '../base/BaseHandler.js';
import { initialSession } from '../../types/SessionData.js';
import { FileNameUtils } from '../../utils/FileNameUtils.js';
import { getTrafficState, getTrafficStateAfterFile } from '../../utils/SubscriptionUtils.js';
export class DocumentMessageHandler extends BaseHandler {
    isSupportedDocument(ctx) {
        return ctx.message?.document?.mime_type === 'application/pdf';
    }
    async handle(ctx) {
        const lang = this.getLang(ctx);
        const i18n = this.getI18n(ctx);
        const isAdmin = this.isAdmin(ctx);
        const document = ctx.message?.document;
        if (!document)
            return;
        if (!this.isSupportedDocument(ctx)) {
            await this.handleInvalidFormat(ctx, document, lang, isAdmin);
            return;
        }
        await this.checkTrafficLimits(ctx, document);
        await this.trackActivity(ctx, document, lang);
        const statusMsg = await ctx.reply(i18n.messages.analysis.processing, {
            parse_mode: 'HTML',
            reply_markup: { remove_keyboard: true },
        });
        (async () => {
            let localPath = null;
            try {
                localPath = await this.fileService.downloadFile(ctx, document.file_id);
                const info = await this.worker.getPdfInfo(ctx, localPath, lang, document.file_size || 0);
                ctx.session.filePaths = [localPath];
                ctx.session.tempParams = { originalName: document.file_name || 'doc.pdf' };
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
    async handleBulkMergeFile(ctx) {
        const lang = this.getLang(ctx);
        const i18n = this.getI18n(ctx);
        const doc = ctx.message?.document;
        try {
            const localPath = await this.fileService.downloadFile(ctx, doc.file_id);
            ctx.session.filePaths.push(localPath);
            const count = ctx.session.filePaths.length;
            if (count === 1) {
                ctx.session.tempParams = {
                    ...ctx.session.tempParams,
                    originalName: doc.file_name || 'document.pdf'
                };
            }
            ctx.session.step = 'waiting_for_merge_confirm';
            await ctx.reply(i18n.messages.actions.merge_bulk_received.replace('{{count}}', String(count)), { parse_mode: 'HTML' });
            await this.logger.logAction('DocumentHandler:handleBulkMergeFile', ctx.from, 'Bulk merge file added', `File: ${doc.file_name} | Total: ${count}`);
        }
        catch (e) {
            await this.logger.error('DocumentMessageHandler:handleBulkMergeFile', e, { user: ctx.from, message: ctx.message });
            await ctx.reply(this.getI18n(ctx).messages.actions.file_lost);
        }
    }
    async checkTrafficLimits(ctx, document) {
        const user = await this.db.getUser(ctx.from.id);
        if (!user || user.isVip === 1)
            return;
        const i18n = this.getI18n(ctx);
        const currentState = getTrafficState(user, this.config.adminId);
        const fileSizeBytes = document.file_size || 0;
        if (currentState.status === 'blocked') {
            await this.logger.logAction('DocumentMessageHandler:checkTrafficLimits', ctx.from, 'Upload blocked', `Used ${(currentState.usedBytes / 1024 / 1024 / 1024).toFixed(2)} GB`);
            await ctx.reply(i18n.messages.subscription.limit_exceeded, {
                parse_mode: 'HTML',
                reply_markup: this.keyboards.getSubscriptionMenu(this.getLang(ctx))
            });
            ctx.session.currentAction = 'idle';
            ctx.session.step = 'idle';
            return;
        }
        const stateAfter = getTrafficStateAfterFile(user, fileSizeBytes, this.config.adminId);
        if (stateAfter.status === 'blocked') {
            ctx.session.tempParams = { ...ctx.session.tempParams, willExceedLimit: 'true' };
            await this.logger.logAction('DocumentMessageHandler:checkTrafficLimits', ctx.from, 'Last free file', `File: ${document.file_name}`);
        }
        else if (currentState.status === 'warning' || currentState.status === 'warning_strong') {
            ctx.session.tempParams = { ...ctx.session.tempParams, trafficWarning: currentState.remainMB };
        }
    }
    async trackActivity(ctx, doc, lang) {
        await this.registerUser(ctx);
        await this.db.logAction(ctx.from.id, 'upload', doc.file_size || 0);
        await this.logger.logAction('DocumentMessageHandler:trackActivity', ctx.from, 'File upload', `📄 ${doc.file_name} | ${this.formatSize(doc.file_size || 0)}`);
        for (const oldPath of ctx.session.filePaths)
            await this.fileService.deleteFile(oldPath);
        ctx.session.filePaths = [];
    }
    async handleCorruptFile(ctx, lang) {
        const i18n = this.getI18n(ctx);
        ctx.session.currentAction = 'ready';
        await ctx.reply(i18n.messages.analysis.corrupt, {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: [
                    [{ text: i18n.buttons.files.btn_repair }],
                    [{ text: i18n.buttons.common.btn_cancel }]
                ],
                resize_keyboard: true
            }
        });
    }
    async handleEncryptedFile(ctx, lang) {
        const i18n = this.getI18n(ctx);
        ctx.session.currentAction = 'unlock';
        await ctx.reply(i18n.messages.analysis.encrypted, {
            parse_mode: 'HTML',
            reply_markup: this.keyboards.getEncryptedFileMenu(lang)
        });
    }
    async handleValidFile(ctx, doc, info, lang) {
        const i18n = this.getI18n(ctx);
        ctx.session.currentAction = 'ready';
        const reportText = this.generateAnalysisReport(doc, info, lang);
        await ctx.reply(reportText, {
            parse_mode: 'HTML',
            reply_markup: this.keyboards.getFileActionsMenu(lang)
        });
    }
    async handleInvalidFormat(ctx, doc, lang, isAdmin) {
        const i18n = this.getI18n(ctx);
        await this.logger.logAction('DocumentMessageHandler:handleInvalidFormat', ctx.from, 'Trash upload', `Rejected: ${doc.file_name} (${doc.mime_type})`);
        try {
            await ctx.deleteMessage();
        }
        catch { }
        await ctx.reply(i18n.errors.not_pdf, {
            parse_mode: 'HTML',
            reply_markup: this.keyboards.getMainMenu(lang, isAdmin)
        });
    }
    async handleError(ctx, e, msgId, path, lang) {
        const i18n = this.getI18n(ctx);
        await this.logger.error('DocumentMessageHandler:handleError', e, { user: ctx.from, message: ctx.message });
        const isCorrupt = e.message?.includes('invalid') || e.message?.includes('corrupt');
        const errorText = isCorrupt ? i18n.messages.analysis.corrupt : `Error: ${e.message}`;
        await ctx.api.editMessageText(ctx.chat.id, msgId, errorText, { parse_mode: 'HTML' }).catch(() => { });
        if (path)
            await this.fileService.deleteFile(path);
        ctx.session = initialSession();
    }
    generateAnalysisReport(doc, info, lang) {
        const i18n = this.getI18n({ from: { language_code: lang } });
        const yes = i18n.messages.analysis.val_yes;
        const no = i18n.messages.analysis.val_no;
        let compressStatus = info.can_compress ? yes : no;
        if (!info.can_compress) {
            if (info.is_scanned)
                compressStatus = i18n.messages.analysis.val_scanned;
            else if (info.cant_compress_reason)
                compressStatus = i18n.messages.analysis.val_reason.replace('{{reason}}', info.cant_compress_reason);
        }
        return i18n.messages.analysis.result_title + '\n\n'
            + i18n.messages.analysis.field_name.replace('{{name}}', FileNameUtils.escapeHtml(doc.file_name || 'doc.pdf')) + '\n'
            + i18n.messages.analysis.field_size.replace('{{size}}', this.formatSize(info.size)) + '\n'
            + i18n.messages.analysis.field_pages.replace('{{pages}}', String(info.pages ?? 0)) + '\n'
            + i18n.messages.analysis.field_type.replace('{{type}}', info.is_scanned ? i18n.messages.analysis.type_scanned : i18n.messages.analysis.type_standard) + '\n'
            + i18n.messages.analysis.field_encrypted.replace('{{encrypted}}', info.encrypted ? yes : no) + '\n\n'
            + i18n.messages.analysis.field_actions
                .replace('{{compress}}', compressStatus)
                .replace('{{split}}', info.can_split ? yes : no)
                .replace('{{merge}}', info.can_merge ? yes : no)
                .replace('{{meta}}', info.has_metadata ? yes : no);
    }
    formatSize(bytes) {
        if (!+bytes)
            return '0 bytes';
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${['Bytes', 'KB', 'MB', 'GB'][i]}`;
    }
}
