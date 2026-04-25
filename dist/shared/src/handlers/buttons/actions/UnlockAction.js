import { InputFile } from 'grammy';
import { initialSession } from '../../../types/SessionData.js';
import { FileNameUtils } from '../../../utils/FileNameUtils.js';
import { notifyTrafficAfterResult } from '../../../utils/TrafficNotifier.js';
import fs from 'fs';
export class UnlockAction {
    ctx;
    handler;
    constructor(ctx, handler) {
        this.ctx = ctx;
        this.handler = handler;
    }
    async execute() {
        const { ctx, handler } = this;
        const i18n = handler.getI18n();
        const localPath = ctx.session.filePaths[0];
        const originalName = ctx.session.tempParams?.originalName || 'document.pdf';
        await handler.logger.logAction('UnlockAction:execute', ctx.from, 'Unlock(auto-crack)', `File:${originalName}`);
        const statusMsg = await ctx.reply(i18n.messages.actions.cracking, { parse_mode: 'HTML' });
        const sizeBytes = fs.statSync(localPath).size;
        try {
            const crackResult = await handler.worker.crack(ctx, localPath, sizeBytes);
            const stats = await fs.promises.stat(crackResult.path);
            await handler.db.logAction(ctx.from.id, 'unlock', stats.size);
            const safeName = FileNameUtils.getSafeName(originalName, i18n.messages.actions.suffix_unlocked);
            await handler.logger.logAction('UnlockAction:execute', ctx.from, 'Unlock result', `File: ${originalName}`, 'Success-password found');
            await ctx.reply(i18n.messages.actions.success_crack.replace('{{password}}', crackResult.password), { parse_mode: 'HTML' });
            await ctx.replyWithDocument(new InputFile(crackResult.path, safeName), {
                reply_markup: handler.keyboards.getMainMenu(handler.isAdmin(ctx))
            });
            await handler.fileService.deleteFile(crackResult.path);
            await handler.fileService.deleteFile(localPath);
            await notifyTrafficAfterResult(ctx, handler.localization, handler.keyboards, handler.logger);
            ctx.session = initialSession();
        }
        catch {
            await handler.logger.logAction('UnlockAction:execute', ctx.from, 'Unlock result', `File: ${originalName}`, 'Failed - asking manual password');
            await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => { });
            await ctx.reply(i18n.messages.actions.fail_manual, {
                parse_mode: 'HTML',
                reply_markup: { force_reply: true }
            });
            ctx.session.currentAction = 'unlock';
            ctx.session.step = 'waiting_for_password';
        }
    }
}
