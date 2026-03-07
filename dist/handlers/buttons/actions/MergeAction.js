import { InputFile } from 'grammy';
import { initialSession } from '../../../types/SessionData.js';
import { FileNameUtils } from '../../../utils/FileNameUtils.js';
import { notifyTrafficAfterResult } from '../../../utils/TrafficNotifier.js';
import path from 'path';
import fs from 'fs';
export const MERGE_CONFIRM_WORDS = new Set(['да', 'yes', 'כן', 'да.', 'yes.', 'כן.']);
export class MergeAction {
    ctx;
    handler;
    constructor(ctx, handler) {
        this.ctx = ctx;
        this.handler = handler;
    }
    async showModeMenu() {
        const { ctx, handler } = this;
        const lang = handler.getLang(ctx);
        const i18n = handler.getI18n(ctx);
        const isAdmin = handler.isAdmin(ctx);
        await handler.logger.logAction('MergeAction:showModeMenu', ctx.from, 'Merge', 'Showing mode menu');
        ctx.session.currentAction = 'merge';
        await ctx.reply(i18n.messages.actions.ask_merge_mode, {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: [
                    [{ text: i18n.buttons.files.btn_merge_one_by_one }],
                    [{ text: i18n.buttons.files.btn_merge_archive }],
                    [{ text: i18n.buttons.files.btn_merge_bulk }],
                    [{ text: i18n.buttons.common.btn_cancel }]
                ],
                resize_keyboard: true
            }
        });
    }
    async startOneByOne() {
        const { ctx, handler } = this;
        const i18n = handler.getI18n(ctx);
        await handler.logger.logAction('MergeAction:startOneByOne', ctx.from, 'Merge mode', 'One-by-one selected');
        ctx.session.currentAction = 'merge';
        ctx.session.step = 'waiting_for_merge_files';
        await ctx.reply(i18n.messages.actions.ask_merge_files, {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: [[{ text: i18n.buttons.files.btn_execute_merge }]],
                resize_keyboard: true
            }
        });
    }
    async startArchiveMode() {
        const { ctx, handler } = this;
        const i18n = handler.getI18n(ctx);
        await handler.logger.logAction('MergeAction:startArchiveMode', ctx.from, 'Merge mode', 'Archive selected');
        ctx.session.currentAction = 'merge';
        ctx.session.step = 'waiting_for_merge_archive';
        await ctx.reply(i18n.messages.actions.ask_merge_archive, {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: [[{ text: i18n.buttons.common.btn_cancel }]],
                resize_keyboard: true
            }
        });
    }
    async startBulkMode() {
        const { ctx, handler } = this;
        const i18n = handler.getI18n(ctx);
        await handler.logger.logAction('MergeAction:startBulkMode', ctx.from, 'Merge mode', 'Bulk selected');
        ctx.session.currentAction = 'merge';
        ctx.session.step = 'waiting_for_merge_bulk';
        ctx.session.filePaths = [];
        await ctx.reply(i18n.messages.actions.ask_merge_bulk, {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: [[{ text: i18n.buttons.common.btn_cancel }]],
                resize_keyboard: true
            }
        });
    }
    async handleBulkConfirm(text) {
        const { ctx, handler } = this;
        const i18n = handler.getI18n(ctx);
        const normalized = text.trim().toLowerCase();
        if (MERGE_CONFIRM_WORDS.has(normalized)) {
            await ctx.reply(`✅ ${ctx.session.filePaths.length} ${i18n.messages.actions.merge_confirm_words}`, {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: [
                        [{ text: i18n.buttons.files.btn_execute_merge }],
                        [{ text: i18n.buttons.common.btn_cancel }]
                    ],
                    resize_keyboard: true
                }
            });
            ctx.session.step = 'waiting_for_merge_files';
        }
        else {
            ctx.session.step = 'waiting_for_merge_bulk';
            await ctx.reply(i18n.messages.actions.merge_bulk_received.replace('{{count}}', String(ctx.session.filePaths.length)), {
                parse_mode: 'HTML'
            });
        }
    }
    async execute() {
        const { ctx, handler } = this;
        const lang = handler.getLang(ctx);
        const i18n = handler.getI18n(ctx);
        const isAdmin = handler.isAdmin(ctx);
        if (ctx.session.filePaths.length < 2) {
            await ctx.reply(i18n.messages.actions.merge_not_enough_files);
            return;
        }
        await handler.logger.logAction('MergeAction:execute', ctx.from, 'Merge execute', `Files: ${ctx.session.filePaths.length}`);
        const statusMsg = await ctx.reply(i18n.messages.common.wait, { parse_mode: 'HTML' });
        try {
            let totalSize = 0;
            for (const p of ctx.session.filePaths)
                totalSize += fs.statSync(p).size;
            const result = await handler.worker.merge(ctx, ctx.session.filePaths, totalSize);
            await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => { });
            const originalName = ctx.session.tempParams?.originalName || 'Document.pdf';
            if (result.isFallback) {
                await this.deliverFallback(result, lang, isAdmin, i18n);
            }
            else {
                await this.deliverSuccess(result.path, originalName, lang, isAdmin, i18n, totalSize);
            }
            for (const p of ctx.session.filePaths)
                await handler.fileService.deleteFile(p);
            ctx.session = initialSession();
        }
        catch (e) {
            await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => { });
            await handler.logger.error('MergeAction:execute', e, { user: ctx.from });
            await ctx.reply(`Error:${e.message}`);
            ctx.session = initialSession();
        }
    }
    async deliverSuccess(resultPath, originalName, lang, isAdmin, i18n, totalSize) {
        const { ctx, handler } = this;
        const safeName = FileNameUtils.getSafeName(originalName, 'merged');
        await handler.logger.logAction('MergeAction:deliverySuccess', ctx.from, 'Merge result', `Files: ${ctx.session.filePaths.length}`, 'Success');
        await ctx.replyWithDocument(new InputFile(resultPath, safeName), {
            reply_markup: handler.keyboards.getMainMenu(lang, isAdmin)
        });
        await handler.db.logAction(ctx.from.id, 'merge', totalSize);
        await handler.fileService.deleteFile(resultPath);
        await notifyTrafficAfterResult(ctx, lang, handler.localization, handler.keyboards, handler.logger);
    }
    async deliverFallback(result, lang, isAdmin, i18n) {
        const { ctx, handler } = this;
        await handler.logger.logAction('MergeAction:deliverFallback', ctx.from, 'Merge fallback', `Chunks: ${result.paths?.length || 0}`);
        await ctx.reply(i18n.messages.actions.merge_fallback, { parse_mode: 'HTML' });
        if (result.paths?.length) {
            for (const chunkPath of result.paths) {
                try {
                    await ctx.replyWithDocument(new InputFile(chunkPath, path.basename(chunkPath)));
                    await handler.fileService.deleteFile(chunkPath);
                }
                catch { }
            }
        }
        if (result.zipPath) {
            await ctx.replyWithDocument(new InputFile(result.zipPath, path.basename(result.zipPath)), {
                caption: i18n.messages.actions.merge_zip_success,
                parse_mode: 'HTML',
                reply_markup: handler.keyboards.getMainMenu(lang, isAdmin),
            });
            await handler.fileService.deleteFile(result.zipPath);
        }
    }
}
