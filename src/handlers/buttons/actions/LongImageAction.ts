import type { BotContext }          from '../../../types/BotContext.js';
import { initialSession }           from '../../../types/SessionData.js';
import { FileNameUtils }            from '../../../utils/FileNameUtils.js';
import { notifyTrafficAfterResult } from '../../../utils/TrafficNotifier.js';
import { isDuplicateCall }          from '../../../utils/BusyGuard.js';
import { handleProcessingTimeout, handleServerBusy, handleUserCancelled, handleWorkerTechnicalError } from '../../../utils/ProcessingTimeoutHelper.js';
import { sendPreActionInfo, sendTrafficUsedSummary } from '../../../utils/PreActionInfo.js';
import fs                           from 'fs';
import path                         from 'path';

const MAX_LONG_IMAGE_FILES = 10;

export const LONG_IMAGE_CONFIRM_WORDS = new Set([
    'yes', 'yeah', 'yeap', 'yep', 'yup', 'sure', 'ok', 'okay',
    'да', 'ага', 'конечно', 'ок',
    'כן',
]);

export class LongImageAction{

    constructor(
        private readonly ctx:     BotContext,
        private readonly handler: any,
    ){}

    private getPageLimit(subType: string | null | undefined, isVip: boolean): number{

        if(isVip) return Infinity;

        const limits: Record<string, number> = {
            free:     25,
            starter:  50,
            pro:      100,
            ultra:    200,
            business: 400,
        };

        return limits[subType || 'free'] ?? limits.free;

    }

    async showModeMenu(): Promise<void>{

        const { ctx, handler } = this;
        const i18n = handler.getI18n();

        await handler.logger.logAction('LongImageAction:showModeMenu', ctx.from!, 'LongImage', 'Showing mode menu');

        ctx.session.currentAction = 'long_image';

        const user  = await handler.db.getUser(ctx.from!.id);
        const limit = this.getPageLimit(user?.subType, user?.isVip === 1);

        const bulkBtnText = i18n.messages.actions.long_image.buttons.btn_long_image_bulk
            .replaceAll('{{limit}}', String(limit));

        await sendPreActionInfo(
            ctx, handler,
            i18n.messages.actions.long_image.rule.replaceAll('{{limit}}', String(limit)),
            i18n.messages.actions.long_image.availability.replaceAll('{{limit}}', String(limit)),
            {
                keyboard: [
                    [{text: i18n.messages.actions.long_image.buttons.btn_long_image_pages}],
                    [{text: bulkBtnText}],
                    [{text: i18n.messages.user.buttons.common.btn_back}],
                ],
                resize_keyboard: true,
            },
        );

    }

    async startPagesMode(): Promise<void>{

        const { ctx, handler } = this;
        const i18n = handler.getI18n();

        await handler.logger.logAction('LongImageAction:startPagesMode', ctx.from!, 'LongImage mode', 'Pages selected');

        ctx.session.step = 'waiting_for_long_image_pages';

        await ctx.reply(i18n.messages.actions.long_image.ask_long_image_pages, {
            parse_mode:   'HTML',
            reply_markup: handler.keyboards.getBackOnlyMenu(),
        });

    }

    async startBulkMode(): Promise<void>{

        const { ctx, handler } = this;
        const i18n = handler.getI18n();

        await handler.logger.logAction('LongImageAction:startBulkMode', ctx.from!, 'LongImage mode', 'Bulk (1 page per PDF) selected');

        ctx.session.step      = 'waiting_for_long_image_bulk';
        ctx.session.filePaths = [];

        const user  = await handler.db.getUser(ctx.from!.id);
        const limit = this.getPageLimit(user?.subType, user?.isVip === 1);

        await ctx.reply(i18n.messages.actions.long_image.ask_long_image_bulk.replaceAll('{{limit}}', String(limit)), {
            parse_mode:   'HTML',
            reply_markup: {
                keyboard: [[{text: i18n.messages.user.buttons.common.btn_cancel}]],
                resize_keyboard: true,
            },
        });

    }

    async handleBulkConfirm(text: string): Promise<void>{

        const { ctx, handler } = this;
        const i18n = handler.getI18n();

        const normalized = text.trim().toLowerCase();

        if(LONG_IMAGE_CONFIRM_WORDS.has(normalized)){

            if(ctx.session.filePaths.length === 0){
                await ctx.reply(i18n.messages.actions.long_image.errors.long_image_bulk_no_files);
                return;
            }

            await ctx.reply(
                `✅ ${ctx.session.filePaths.length} ${i18n.messages.actions.long_image.long_image_bulk_confirm_words}`,
                {
                    parse_mode:   'HTML',
                    reply_markup: {
                        keyboard: [
                            [{text: i18n.messages.actions.long_image.buttons.btn_long_image_execute}],
                            [{text: i18n.messages.user.buttons.common.btn_cancel}],
                        ],
                        resize_keyboard: true,
                    },
                },
            );

            ctx.session.step = 'waiting_for_long_image_files';

        }else{

            ctx.session.step = 'waiting_for_long_image_bulk';
            await ctx.reply(
                i18n.messages.actions.long_image.long_image_bulk_received
                    .replace('{{count}}', String(ctx.session.filePaths.length)),
                {parse_mode: 'HTML'},
            );

        }

    }

    async execute(): Promise<void>{

        const { ctx, handler } = this;
        const i18n   = handler.getI18n();
        const isAdmin = handler.isAdmin(ctx);

        if(isDuplicateCall(ctx, handler)) return;

        if(ctx.session.filePaths.length === 0){
            await ctx.reply(i18n.messages.actions.long_image.errors.long_image_bulk_no_files);
            return;
        }

        const user    = await handler.db.getUser(ctx.from!.id);
        const plan    = user?.isVip ? 'vip' : (user?.subType || 'free');
        const isFree  = plan === 'free';

        await handler.logger.logAction(
            'LongImageAction:execute',
            ctx.from!,
            'Long image bulk execute',
            `Files: ${ctx.session.filePaths.length} | Plan: ${plan}`,
        );

        const statusMsg = await ctx.reply(i18n.messages.actions.long_image.long_image_processing, {parse_mode: 'HTML', reply_markup: handler.keyboards.getCancelOnlyMenu()});
        const filePaths = [...ctx.session.filePaths];

        setImmediate(async () => {

            try{

                let totalSize = 0;
                for(const p of filePaths) totalSize += fs.statSync(p).size;

                const resultPath = await handler.worker.toLongImageBulk(
                    ctx,
                    filePaths,
                    totalSize,
                    isFree,
                    plan,
                );

                Object.assign(ctx.session, initialSession());

                await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});

                const safeName = `long_image_${filePaths.length}_pages.jpg`;

                const isPaidResult = await handler.isPaidUser(ctx);
                await handler.sendDocumentWithWatermark(ctx, resultPath, safeName, {
                    caption:      i18n.messages.actions.long_image.success_long_image,
                    parse_mode:   'HTML',
                    reply_markup: handler.keyboards.getFileActionsMenu([], isPaidResult),
                });

                await handler.db.logAction(ctx.from!.id, 'long_image', totalSize);
                await handler.fileService.deleteFile(resultPath);
                for(const p of filePaths) await handler.fileService.deleteFile(p);

                await sendTrafficUsedSummary(ctx, handler, totalSize);

                await notifyTrafficAfterResult(ctx, handler.localization, handler.keyboards, handler.logger);

            }catch(e: any){

                await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});

                if(e.message === 'PROCESSING_TIMEOUT'){

                    await handleProcessingTimeout(ctx, handler, 'LongImageBulk', `${filePaths.length} files (bulk)`);

                }else if(e.message === 'SERVER_BUSY'){

                    await handleServerBusy(ctx, handler, 'LongImageBulk', `${filePaths.length} files (bulk)`);

                }else if(e.message === 'USER_CANCELLED'){

                    await handleUserCancelled(ctx, handler, 'LongImageBulk', `${filePaths.length} files (bulk)`);

                }else{

                    await handleWorkerTechnicalError(ctx, handler, 'LongImageBulk', `${filePaths.length} files (bulk)`);

                }

                for(const p of filePaths) await handler.fileService.deleteFile(p);
                Object.assign(ctx.session, initialSession());

            }

        });

    }

}
