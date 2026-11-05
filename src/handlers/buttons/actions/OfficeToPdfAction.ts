import type { BotContext }          from '../../../types/BotContext.js';
import { initialSession }           from '../../../types/SessionData.js';
import { isDuplicateCall }          from '../../../utils/BusyGuard.js';
import { handleProcessingTimeout, handleServerBusy, handleUserCancelled, handleWorkerTechnicalError } from '../../../utils/ProcessingTimeoutHelper.js';
import { getOfficeWeeklyLimit, getAllowedOfficeExtensions } from '../../../utils/SubscriptionPlans.js';
import { calcNextWeeklyReset }      from '../../../utils/SubscriptionUtils.js';
import { sendPreActionInfo, sendTrafficUsedSummary } from '../../../utils/PreActionInfo.js';
import fs                           from 'fs';
import path                         from 'path';

export class OfficeToPdfAction{

    constructor(
        private readonly ctx:     BotContext,
        private readonly handler: any,
    ){}

    async handleDocument(): Promise<void>{

        const { ctx, handler } = this;
        const i18n = handler.getI18n();

        if(handler.worker.isUserBusy(ctx.from!.id)){

            await ctx.reply(i18n.messages.actions.shared.please_wait ?? '⏳ Please wait for the current operation to finish.');
            return;

        }

        const user  = await handler.db.getUser(ctx.from!.id);
        const isVip = user?.isVip === 1;
        const plan  = user?.subType || 'free';

        const fileName = ctx.message?.document?.file_name || '';
        const ext = fileName.includes('.') ? fileName.split('.').pop()!.toLowerCase() : '';

        const allowed = getAllowedOfficeExtensions(plan, isVip);

        if(!ext || !allowed.includes(ext)){

            const formatsLabel = allowed.map(e => e.toUpperCase()).join(', ');

            const msg = i18n.messages.actions.office_to_pdf.errors.office_format_not_available
                .replaceAll('{{formats}}', formatsLabel);

            await ctx.reply(msg, {parse_mode: 'HTML'});
            return;

        }

        const limit = getOfficeWeeklyLimit(plan, isVip);
        const used  = Number((user as any)?.officeUsedThisWeek || 0);

        if(!isVip && used >= limit){

            const resetInfo = calcNextWeeklyReset(user?.joinedAt, handler.localization.getLang(), i18n.messages.user.reset_countdown);

            const msg = i18n.messages.actions.office_to_pdf.errors.office_quota_exhausted
                .replaceAll('{{limit}}', String(limit))
                .replaceAll('{{reset}}', resetInfo);

            await ctx.reply(msg, {parse_mode: 'HTML'});
            return;

        }

        const formatsLabel = allowed.map(e => e.toUpperCase()).join(', ');

        const rules = i18n.messages.actions.office_to_pdf.office_rule
            .replaceAll('{{formats}}', formatsLabel)
            .replaceAll('{{limit}}', String(isVip ? '∞' : limit))
            .replaceAll('{{used}}', String(used));

        await sendPreActionInfo(ctx, handler, rules, i18n.messages.actions.office_to_pdf.availability);

        const doc = ctx.message?.document;
        if(!doc) return;

        await this.convert(doc.file_id, fileName);

    }

    private async convert(fileId: string, originalName: string): Promise<void>{

        const { ctx, handler } = this;
        const i18n    = handler.getI18n();

        if(isDuplicateCall(ctx, handler)) return;

        const localPath = await handler.fileService.downloadFile(ctx, fileId);
        const sizeBytes = fs.statSync(localPath).size;

        await handler.logger.logAction('OfficeToPdfAction:convert', ctx.from!, 'Office to PDF started', `File: ${originalName} | Size: ${sizeBytes}`);

        const statusMsg = await ctx.reply(i18n.messages.actions.office_to_pdf.converting, {parse_mode: 'HTML', reply_markup: handler.keyboards.getCancelOnlyMenu()});

        setImmediate(async () => {

            try{

                const resultPath = await handler.worker.officeToPdf(ctx, localPath, sizeBytes);

                Object.assign(ctx.session, initialSession());

                await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});

                const baseName = path.basename(originalName, path.extname(originalName));
                const safeName = `${baseName}.pdf`;
                const isPaidResult = await handler.isPaidUser(ctx);

                await handler.sendDocumentWithWatermarkAndMetadata(ctx, resultPath, safeName, {
                    caption:      i18n.messages.actions.office_to_pdf.success_office_to_pdf,
                    parse_mode:   'HTML',
                    reply_markup: handler.keyboards.getFileActionsMenu([], isPaidResult),
                });

                await handler.db.incrementOfficeQuota(ctx.from!.id, 1);

                await handler.db.logAction(ctx.from!.id, 'office_to_pdf', sizeBytes);

                await sendTrafficUsedSummary(ctx, handler, sizeBytes);

                await handler.logger.logAction('OfficeToPdfAction:convert', ctx.from!, 'Office to PDF result', `File: ${originalName}`, 'Success');

                await handler.fileService.deleteFile(resultPath).catch(() => {});
                await handler.fileService.deleteFile(localPath).catch(() => {});

            }catch(e: any){

                await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});

                if(e.message === 'PROCESSING_TIMEOUT'){

                    await handleProcessingTimeout(ctx, handler, 'OfficeToPdf', 'office');

                }else if(e.message === 'SERVER_BUSY'){

                    await handleServerBusy(ctx, handler, 'OfficeToPdf', 'office');

                }else if(e.message === 'USER_CANCELLED'){

                    await handleUserCancelled(ctx, handler, 'OfficeToPdf', 'office');

                }else if(e.message === 'OFFICE_TOO_LARGE'){

                    await ctx.api.sendMessage(ctx.chat!.id, i18n.messages.actions.office_to_pdf.errors.office_too_large, {parse_mode: 'HTML'});

                }else if(e.message === 'OFFICE_OUTPUT_TOO_LARGE'){

                    await ctx.api.sendMessage(ctx.chat!.id, i18n.messages.actions.office_to_pdf.errors.office_output_too_large, {parse_mode: 'HTML'});

                }else if(e.message === 'CONVERSION_FAILED'){

                    await ctx.api.sendMessage(ctx.chat!.id, i18n.messages.actions.office_to_pdf.errors.office_conversion_failed, {parse_mode: 'HTML'});

                }else{

                    await handleWorkerTechnicalError(ctx, handler, 'OfficeToPdf', 'office');

                }

                await handler.fileService.deleteFile(localPath).catch(() => {});
                Object.assign(ctx.session, initialSession());

            }

        });

    }

}
