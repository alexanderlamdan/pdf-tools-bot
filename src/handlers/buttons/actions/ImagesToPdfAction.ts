import type { BotContext }          from '../../../types/BotContext.js';
import { initialSession }           from '../../../types/SessionData.js';
import { isDuplicateCall }          from '../../../utils/BusyGuard.js';
import { handleProcessingTimeout, handleServerBusy, handleUserCancelled, handleWorkerTechnicalError } from '../../../utils/ProcessingTimeoutHelper.js';
import { getImagesWeeklyLimit, isPhotoOnlyTier, getAllowedImageMimeTypes } from '../../../utils/SubscriptionPlans.js';
import { calcNextWeeklyReset }      from '../../../utils/SubscriptionUtils.js';
import { sendPreActionInfo, sendTrafficUsedSummary } from '../../../utils/PreActionInfo.js';
import fs                           from 'fs';

export class ImagesToPdfAction{

    constructor(
        private readonly ctx:     BotContext,
        private readonly handler: any,
    ){}

    async handlePhoto(): Promise<void>{

        const { ctx, handler } = this;
        const i18n = handler.getI18n();

        if(handler.worker.isUserBusy(ctx.from!.id)){
            
            await ctx.reply(i18n.messages.actions.shared.please_wait ?? '⏳ Please wait for the current operation to finish.');
            return;
            
        }

        const user  = await handler.db.getUser(ctx.from!.id);
        const isVip = user?.isVip === 1;
        const plan  = user?.subType || 'free';

        if(!isVip && !isPhotoOnlyTier(plan)){

            await ctx.reply(i18n.messages.actions.images_to_pdf.images_use_document_instead, {parse_mode: 'HTML'});
            return;

        }

        const quota = await this.checkQuota(user, isVip, plan);
        if(!quota) return;

        const isNewBatch = ctx.session.currentAction !== 'images';

        if(isNewBatch){
            const isTrueFree = !isVip && plan === 'free';
            const watermarkNote = isTrueFree
                ? '\n• Free output includes a watermark page and embedded metadata'
                : '';

            const rules = i18n.messages.actions.images_to_pdf.images_rule
                .replaceAll('{{formats}}', 'JPG, PNG only')
                .replaceAll('{{limit}}', String(isVip ? '∞' : quota.limit))
                .replaceAll('{{used}}', String(quota.used))
                .replaceAll('{{method}}', 'as photos')
                .replaceAll('{{watermark_note}}', watermarkNote);

            await sendPreActionInfo(ctx, handler, rules, i18n.messages.actions.images_to_pdf.availability_photo);

            ctx.session.currentAction = 'images';
            ctx.session.filePaths = [];

        }

        ctx.session.step = 'waiting_for_images_bulk';

        const photos = (ctx.message as any)?.photo;
        if(!photos || photos.length === 0) return;

        const largest = photos[photos.length - 1];

        await this.addToBatch(largest.file_id, isVip, quota.limit, quota.used);

    }

    async handleImageDocument(): Promise<void>{

        const { ctx, handler } = this;
        const i18n = handler.getI18n();

        if(handler.worker.isUserBusy(ctx.from!.id)){

            await ctx.reply(i18n.messages.actions.shared.please_wait ?? '⏳ Please wait for the current operation to finish.');
            return;

        }

        const user  = await handler.db.getUser(ctx.from!.id);
        const isVip = user?.isVip === 1;
        const plan  = user?.subType || 'free';

        if(!isVip && isPhotoOnlyTier(plan)){

            await ctx.reply(i18n.messages.actions.images_to_pdf.errors.images_document_not_available, {parse_mode: 'HTML'});
            return;

        }

        const mimeType = ctx.message?.document?.mime_type || '';
        const allowed  = getAllowedImageMimeTypes(plan, isVip);

        if(!allowed.includes(mimeType)){

            const formatsLabel = allowed.map(m => m.split('/')[1].toUpperCase()).join(', ');

            const msg = i18n.messages.actions.images_to_pdf.errors.images_format_not_available
                .replaceAll('{{formats}}', formatsLabel);

            await ctx.reply(msg, {parse_mode: 'HTML'});
            return;

        }

        const quota = await this.checkQuota(user, isVip, plan);
        if(!quota) return;

        const isNewBatch = ctx.session.currentAction !== 'images';

        if(isNewBatch){

            const formatsLabel = allowed.map(m => m.split('/')[1].toUpperCase()).join(', ');
            
            const rules = i18n.messages.actions.images_to_pdf.images_rule
                .replaceAll('{{formats}}', formatsLabel)
                .replaceAll('{{limit}}', String(isVip ? '∞' : quota.limit))
                .replaceAll('{{used}}', String(quota.used))
                .replaceAll('{{method}}', 'as a document (file)')
                .replaceAll('{{watermark_note}}', '');

            await sendPreActionInfo(ctx, handler, rules, i18n.messages.actions.images_to_pdf.availability_document);

            ctx.session.currentAction = 'images';
            ctx.session.filePaths = [];

        }

        ctx.session.step = 'waiting_for_images_bulk';

        const doc = ctx.message?.document;
        if(!doc) return;

        await this.addToBatch(doc.file_id, isVip, quota.limit, quota.used);

    }

    private async checkQuota(user: any, isVip: boolean, plan: string): Promise<{limit: number; used: number} | null>{

        const { ctx, handler } = this;
        const i18n = handler.getI18n();

        const limit = getImagesWeeklyLimit(plan, isVip);
        const used  = Number(user?.imagesUsedThisWeek || 0);

        if(!isVip && used >= limit){

            const resetInfo = calcNextWeeklyReset(user?.joinedAt, handler.localization.getLang(), i18n.messages.user.reset_countdown);

            const msg = i18n.messages.actions.images_to_pdf.errors.images_quota_exhausted
                .replaceAll('{{limit}}', String(limit))
                .replaceAll('{{reset}}', resetInfo);

            await ctx.reply(msg, {parse_mode: 'HTML'});
            return null;

        }

        return {limit, used};

    }

    private async addToBatch(fileId: string, isVip: boolean, limit: number, used: number): Promise<void>{

        const { ctx, handler } = this;
        const i18n = handler.getI18n();

        const remainingThisWeek = isVip ? Infinity : (limit - used - ctx.session.filePaths.length);

        if(remainingThisWeek <= 0){

            await ctx.reply(i18n.messages.actions.images_to_pdf.errors.images_batch_limit_reached, {parse_mode: 'HTML'});
            return;

        }

        const localPath = await handler.fileService.downloadFile(ctx, fileId);
        ctx.session.filePaths.push(localPath);

        const totalAdded = ctx.session.filePaths.length;

        await handler.logger.logAction('ImagesToPdfAction:addToBatch', ctx.from!, 'Image added', `Total in batch: ${totalAdded}`);

        await ctx.reply(
            i18n.messages.actions.images_to_pdf.images_added.replaceAll('{{count}}', String(totalAdded)),
            {
                parse_mode:   'HTML',
                reply_markup: {
                    keyboard: [
                        [{text: i18n.messages.actions.images_to_pdf.buttons.btn_images_execute}],
                        [{text: i18n.messages.user.buttons.common.btn_cancel}],
                    ],
                    resize_keyboard: true,
                },
            },
        );

    }

    async execute(): Promise<void>{

        const { ctx, handler } = this;
        const i18n    = handler.getI18n();
        const isAdmin = handler.isAdmin(ctx);

        if(isDuplicateCall(ctx, handler)) return;

        const filePaths = [...ctx.session.filePaths];

        if(filePaths.length === 0){

            await ctx.reply(i18n.errors.file_lost);
            ctx.session = initialSession();
            return;

        }

        let totalSize = 0;
        for(const p of filePaths) totalSize += fs.statSync(p).size;

        await handler.logger.logAction('ImagesToPdfAction:execute', ctx.from!, 'Images to PDF started', `Files: ${filePaths.length}`);

        const statusMsg = await ctx.reply(i18n.messages.actions.images_to_pdf.converting_images, {parse_mode: 'HTML', reply_markup: handler.keyboards.getCancelOnlyMenu()});

        setImmediate(async () => {

            try{

                const resultPath = await handler.worker.imagesToPdf(ctx, filePaths, totalSize);

                Object.assign(ctx.session, initialSession());

                await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});

                const safeName      = `images_${filePaths.length}.pdf`;
                const isPaidResult  = await handler.isPaidUser(ctx);

                await handler.sendDocumentWithWatermark(ctx, resultPath, safeName, {
                    caption:      i18n.messages.actions.images_to_pdf.success_images_to_pdf,
                    parse_mode:   'HTML',
                    reply_markup: handler.keyboards.getFileActionsMenu([], isPaidResult),
                });

                await handler.db.incrementImageQuota(ctx.from!.id, filePaths.length);
                
                const trafficCharge = Math.round(totalSize * 0.35);
                await handler.db.logAction(ctx.from!.id, 'images_to_pdf', trafficCharge);

                await sendTrafficUsedSummary(ctx, handler, trafficCharge);

                await handler.logger.logAction('ImagesToPdfAction:execute', ctx.from!, 'Images to PDF result', `Files: ${filePaths.length}`, 'Success');

                await handler.fileService.deleteFile(resultPath).catch(() => {});
                for(const p of filePaths) await handler.fileService.deleteFile(p).catch(() => {});

            }catch(e: any){

                await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});

                if(e.message === 'PROCESSING_TIMEOUT'){

                    await handleProcessingTimeout(ctx, handler, 'ImagesToPdf', 'images');

                }else if(e.message === 'SERVER_BUSY'){

                    await handleServerBusy(ctx, handler, 'ImagesToPdf', 'images');

                }else if(e.message === 'USER_CANCELLED'){

                    await handleUserCancelled(ctx, handler, 'ImagesToPdf', 'images');

                }else if(e.message === 'IMAGES_TOO_LARGE'){

                    await ctx.api.sendMessage(ctx.chat!.id, i18n.messages.actions.images_to_pdf.errors.images_too_large, {parse_mode: 'HTML'});

                }else{

                    await handleWorkerTechnicalError(ctx, handler, 'ImagesToPdf', 'images');

                }

                for(const p of filePaths) await handler.fileService.deleteFile(p).catch(() => {});
                Object.assign(ctx.session, initialSession());

            }

        });

    }

}
