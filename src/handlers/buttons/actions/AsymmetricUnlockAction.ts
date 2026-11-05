import type {BotContext}          from '../../../types/BotContext.js';
import {initialSession}           from '../../../types/SessionData.js';
import {FileNameUtils}            from '../../../utils/FileNameUtils.js';
import {notifyTrafficAfterResult} from '../../../utils/TrafficNotifier.js';
import {isDuplicateCall}          from '../../../utils/BusyGuard.js';
import {handleProcessingTimeout, handleServerBusy, handleUserCancelled, handleWorkerTechnicalError} from '../../../utils/ProcessingTimeoutHelper.js';
import {sendTrafficUsedSummary} from '../../../utils/PreActionInfo.js';
import fs                         from 'fs';

export class AsymmetricUnlockAction{

    constructor(
        private readonly ctx:     BotContext,
        private readonly handler: any,
    ){}

    async askForPrivateKey(): Promise<void>{

        const {ctx, handler} = this;
        const i18n = handler.getI18n();

        await handler.logger.logAction('AsymmetricUnlockAction:askForPrivateKey', ctx.from!, 'Asymmetric unlock started', 'Waiting for private_key.pem');

        ctx.session.currentAction = 'unlock';
        ctx.session.step          = 'waiting_for_private_key';

        await ctx.reply(i18n.messages.actions.asymmetric.ask_private_key, {
            parse_mode:   'HTML',
            reply_markup: handler.keyboards.getBackOnlyMenu(),
        });

    }

    async handlePrivateKeyUpload(): Promise<void>{

        const {ctx, handler} = this;
        const i18n = handler.getI18n();
        const doc  = ctx.message?.document;

        if(!doc){
            await ctx.reply(i18n.errors.not_pdf, {parse_mode: 'HTML'});
            return;
        }

        try{

            const keyPath = await handler.fileService.downloadFile(ctx, doc.file_id);

            ctx.session.tempParams = {...ctx.session.tempParams, privateKeyPath: keyPath};
            ctx.session.step       = 'waiting_for_encrypted_key';

            await handler.logger.logAction('AsymmetricUnlockAction:handlePrivateKeyUpload', ctx.from!, 'Private key received', `File: ${doc.file_name}`);

            await ctx.reply(i18n.messages.actions.asymmetric.ask_encrypted_key, {
                parse_mode:   'HTML',
                reply_markup: handler.keyboards.getBackOnlyMenu(),
            });

        }catch(e: any){

            await handler.logger.error('AsymmetricUnlockAction:handlePrivateKeyUpload', e, {user: ctx.from!, message: ctx.message!});
            await handleWorkerTechnicalError(ctx, handler, 'AsymmetricDecrypt', doc.file_name || 'private_key.pem');
            ctx.session = initialSession();

        }

    }

    async handleEncryptedKeyUpload(): Promise<void>{

        const {ctx, handler} = this;
        const i18n = handler.getI18n();
        const doc  = ctx.message?.document;

        if(isDuplicateCall(ctx, handler)) return;

        if(!doc){
            await ctx.reply(i18n.errors.not_pdf, {parse_mode: 'HTML'});
            return;
        }

        const encryptedPdfPath = ctx.session.filePaths[0];
        const privateKeyPath   = ctx.session.tempParams?.privateKeyPath;
        const originalName     = ctx.session.tempParams?.originalName || 'document.pdf';

        if(!encryptedPdfPath || !privateKeyPath){

            await ctx.reply(i18n.errors.file_lost);
            ctx.session = initialSession();
            return;

        }

        let encryptedKeyPath: string;

        try{

            encryptedKeyPath = await handler.fileService.downloadFile(ctx, doc.file_id);

        }catch(e: any){

            await handler.logger.error('AsymmetricUnlockAction:handleEncryptedKeyUpload', e, {user: ctx.from!, message: ctx.message!});
            await handleWorkerTechnicalError(ctx, handler, 'AsymmetricDecrypt', doc.file_name || 'encrypted_key.bin');
            await handler.fileService.deleteFile(encryptedPdfPath).catch(() => {});
            await handler.fileService.deleteFile(privateKeyPath).catch(() => {});
            ctx.session = initialSession();
            return;

        }

        await handler.logger.logAction(
            'AsymmetricUnlockAction:handleEncryptedKeyUpload',
            ctx.from!,
            'Asymmetric decrypt started',
            `File: ${originalName}`,
        );

        const sizeBytes = fs.statSync(encryptedPdfPath).size;
        const statusMsg = await ctx.reply(i18n.messages.actions.asymmetric.asymmetric_decrypting, {
            parse_mode:   'HTML',
            reply_markup: handler.keyboards.getCancelOnlyMenu(),
        });

        setImmediate(async () => {

            try{

                const resultPath = await handler.worker.asymmetricDecrypt(ctx, encryptedPdfPath, privateKeyPath, encryptedKeyPath, sizeBytes);

                await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});

                const stats    = await fs.promises.stat(resultPath);
                const safeName = FileNameUtils.getSafeName(originalName, i18n.messages.actions.unlock.suffix_unlocked);

                const isPaidResult = await handler.isPaidUser(ctx);
                await handler.sendDocumentWithWatermark(ctx, resultPath, safeName, {
                    caption:      i18n.messages.actions.unlock.success_unlock,
                    parse_mode:   'HTML',
                    reply_markup: handler.keyboards.getFileActionsMenu([], isPaidResult),
                });

                await handler.logger.logAction('AsymmetricUnlockAction:handleEncryptedKeyUpload', ctx.from!, 'Asymmetric decrypt result', `File: ${originalName}`, 'Success');

                await handler.db.logAction(ctx.from!.id, 'unlock', stats.size);

                await handler.fileService.deleteFile(encryptedPdfPath).catch(() => {});
                await handler.fileService.deleteFile(privateKeyPath).catch(() => {});
                await handler.fileService.deleteFile(encryptedKeyPath).catch(() => {});
                await handler.fileService.deleteFile(resultPath).catch(() => {});

                await sendTrafficUsedSummary(ctx, handler, stats.size);

                await notifyTrafficAfterResult(ctx, handler.localization, handler.keyboards, handler.logger);
                Object.assign(ctx.session, initialSession());

            }catch(e: any){

                await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});

                if(e.message === 'PROCESSING_TIMEOUT'){

                    await handleProcessingTimeout(ctx, handler, 'AsymmetricDecrypt', originalName);

                }else if(e.message === 'SERVER_BUSY'){

                    await handleServerBusy(ctx, handler, 'AsymmetricDecrypt', originalName);

                }else if(e.message === 'USER_CANCELLED'){

                    await handleUserCancelled(ctx, handler, 'AsymmetricDecrypt', originalName);

                }else{

                    await handleWorkerTechnicalError(ctx, handler, 'AsymmetricDecrypt', originalName);

                }

                await handler.fileService.deleteFile(encryptedPdfPath).catch(() => {});
                await handler.fileService.deleteFile(privateKeyPath).catch(() => {});
                await handler.fileService.deleteFile(encryptedKeyPath).catch(() => {});

                Object.assign(ctx.session, initialSession());

            }

        });

    }

}
