import type { BotContext } from '../../types/BotContext.js';
import { InputFile } from 'grammy';
import { initialSession } from '../../types/SessionData.js';
import { BaseHandler } from '../base/BaseHandler.js';
import { MergeAction, MERGE_CONFIRM_WORDS } from '../buttons/actions/MergeAction.js';
import { MetadataAction } from '../buttons/actions/MetadataAction.js';
import { FileNameUtils } from '../../utils/FileNameUtils.js';
import { notifyTrafficAfterResult } from '../../utils/TrafficNotifier.js';
import { sendTrafficUsedSummary } from '../../utils/PreActionInfo.js';
import { LongImageAction } from '../buttons/actions/LongImageAction.js';
import { ExtractAction } from '../buttons/actions/ExtractAction.js';
import { RenameAction } from '../buttons/actions/RenameAction.js';
import { isDuplicateCall } from '../../utils/BusyGuard.js';
import { handleProcessingTimeout, handleServerBusy, handleUserCancelled, handleWorkerTechnicalError, handlePageOutOfRange } from '../../utils/ProcessingTimeoutHelper.js';
import fs from 'fs';
import path from 'path';

export class TextHandler extends BaseHandler{

    async handle(ctx: BotContext): Promise<void>{

        const text = ctx.message?.text;
        if(!text) return;

        const i18n    = this.getI18n();
        const isAdmin = this.isAdmin(ctx);

        await this.registerUser(ctx);

        if(text.startsWith('/')) return;

        const { currentAction: action, step } = ctx.session;

        if(
            step !== 'waiting_for_merge_confirm' &&
            step !== 'waiting_for_metadata_mode' &&
            step !== 'waiting_for_metadata_confirm' &&
            this.localization.getActionKeyByText(text)
        ) return;

        const route = `${action}:${step}`;

        switch(route){

            case 'protect:waiting_for_password':
                await this.handleProtectPassword(ctx, i18n, isAdmin, text);
                break;

            case 'unlock:waiting_for_password':
                await this.handleUnlockPassword(ctx, i18n, isAdmin, text);
                break;

            case 'split:waiting_for_split_pages':
                await this.handleSplitPages(ctx, i18n, isAdmin, text);
                break;
            case 'extract:waiting_for_search_query':
                await new ExtractAction(ctx, this).performSearch(text);
                break;
            case 'rename:waiting_for_rename':
                await new RenameAction(ctx, this).performRename(text);
                break;
            case 'long_image:waiting_for_long_image_pages':
                await this.handleLongImagePages(ctx, i18n, isAdmin, text);
                break;    
            case 'analyze:waiting_for_metadata_mode':
                await this.handleMetadataMode(ctx, i18n, text);
                break;

            case 'analyze:waiting_for_metadata_confirm':
                await this.handleMetadataConfirm(ctx, i18n, text);
                break;
            case 'long_image:waiting_for_long_image_pages':
                await this.handleLongImagePages(ctx, i18n, isAdmin, text);
                break;
     
            case 'long_image:waiting_for_long_image_bulk':
                await new LongImageAction(ctx, this).handleBulkConfirm(text);
                break;    
            default:
                if(step === 'waiting_for_merge_confirm' || step === 'waiting_for_merge_bulk'){
                    await new MergeAction(ctx, this).handleBulkConfirm(text);
                }else{
                    await this.handleRejected(ctx, i18n, isAdmin, text);
                }

        }

    }

    private async handleProtectPassword(ctx: BotContext, i18n: any, isAdmin: boolean, text: string): Promise<void>{

        await this.logger.logAction('TextHandler:handleProtectPassword', ctx.from!, 'Password input', 'protect — ***HIDDEN***');

        const password = text.trim();
        await ctx.api.deleteMessage(ctx.chat!.id, ctx.message!.message_id).catch(() => {});

        if(password.length < 1){
            await ctx.reply(i18n.errors.password_empty);
            return;
        }

        const filePath = ctx.session.filePaths[0];
        if(!filePath){
            await ctx.reply(i18n.errors.file_lost);
            ctx.session = initialSession();
            return;
        }

        const sizeBytes = fs.statSync(filePath).size;
        const statusMsg = await ctx.reply(i18n.messages.actions.protect.encrypting, {reply_markup: this.keyboards.getCancelOnlyMenu()});

        try{

            const resultPath = await this.worker.encrypt(ctx, filePath, password, sizeBytes);
            const stats      = await fs.promises.stat(resultPath);

            await this.db.logAction(ctx.from!.id, 'protect', stats.size);

            const safeName = FileNameUtils.getSafeName(
                ctx.session.tempParams?.originalName || 'Document.pdf',
                i18n.messages.actions.protect.suffix_protected,
            );

            await this.logger.logAction('TextHandler', ctx.from!, 'Protect result', '', 'Success');

            await this.sendDocumentWithMetadata(ctx, resultPath, safeName, {
                caption:      i18n.messages.actions.protect.success_protect,
                parse_mode:   'HTML',
                reply_markup: this.keyboards.getMainMenu(isAdmin),
            });

            await this.fileService.deleteFile(filePath);
            await this.fileService.deleteFile(resultPath);

            await sendTrafficUsedSummary(ctx, this, stats.size);

            await notifyTrafficAfterResult(ctx, this.localization, this.keyboards, this.logger);
            ctx.session = initialSession();

        }catch(e: any){

            const msg = (e.message || '').length > 2000
                ? e.message.substring(0, 2000) + '...'
                : e.message;

            await this.logger.error('TextHandler:protect', { ...e, message: msg }, { user: ctx.from!, message: ctx.message! });
            ctx.session = initialSession();

        }finally{

            await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});

        }

    }

    private async handleUnlockPassword(ctx: BotContext, i18n: any, isAdmin: boolean, text: string): Promise<void>{

        await this.logger.logAction('TextHandler:handleUnlockPassword', ctx.from!, 'Password input', 'unlock - ***HIDDEN***');

        const password = text.trim();
        const filePath = ctx.session.filePaths[0];

        if(!filePath){
            await ctx.reply(i18n.errors.file_lost);
            return;
        }

        const sizeBytes = fs.statSync(filePath).size;
        const statusMsg = await ctx.reply(i18n.messages.actions.unlock.decrypting, {reply_markup: this.keyboards.getCancelOnlyMenu()});

        try{

            const resultPath = await this.worker.decrypt(ctx, filePath, password, sizeBytes);
            const stats      = await fs.promises.stat(resultPath);

            await this.db.logAction(ctx.from!.id, 'unlock', stats.size);

            const safeName = FileNameUtils.getSafeName(
                ctx.session.tempParams?.originalName || 'doc.pdf',
                i18n.messages.actions.unlock.suffix_unlocked,
            );

            await this.logger.logAction('TextHandler:handleUnlockPassword', ctx.from!, 'Unlock result', '', 'Success');

            await this.sendDocumentWithMetadata(ctx, resultPath, safeName, {
                caption:      i18n.messages.actions.unlock.success_unlock,
                parse_mode:   'HTML',
                reply_markup: this.keyboards.getMainMenu(isAdmin),
            });

            await this.fileService.deleteFile(resultPath);
            await this.fileService.deleteFile(filePath);

            await sendTrafficUsedSummary(ctx, this, stats.size);

            await notifyTrafficAfterResult(ctx, this.localization, this.keyboards, this.logger);
            ctx.session = initialSession();

        }catch(e: any){

            await this.logger.logAction('TextHandler:handleUnlockPassword', ctx.from!, 'Unlock result', '', 'Failed - wrong password');
            await ctx.reply(i18n.messages.actions.unlock.errors.fail_unlock);

        }finally{

            await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});

        }

    }

    private async handleSplitPages(ctx: BotContext, i18n: any, isAdmin: boolean, text: string): Promise<void>{

        if(isDuplicateCall(ctx, this)) return;

        const pages    = text.trim();
        const filePath = ctx.session.filePaths[0];

        if(!filePath){
            await ctx.reply(i18n.errors.file_lost, { parse_mode: 'HTML' });
            ctx.session = initialSession();
            return;
        }

        const sizeBytes    = fs.statSync(filePath).size;
        const originalName = ctx.session.tempParams?.originalName || 'Document.pdf';

        ctx.session.step = 'processing';

        await this.logger.logAction('TextHandler:handleSplitPages', ctx.from!, 'Split pages', `Pages: ${pages}`);
        const statusMsg = await ctx.reply(i18n.messages.common.wait, { parse_mode: 'HTML', reply_markup: this.keyboards.getCancelOnlyMenu() });

        setImmediate(async () => {

            try{

                const result = await this.worker.split(ctx, filePath, pages, sizeBytes);

                await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});

                if(result.paths && result.paths.length > 0){
                    for(const pagePath of result.paths){
                        const safeName = FileNameUtils.getSafeName(path.basename(pagePath), '');
                        await this.sendDocumentWithMetadata(ctx, pagePath, safeName);
                        await new Promise(r => setTimeout(r, 1200));
                        await this.fileService.deleteFile(pagePath);
                    }
                }

                if(result.zipPath){
                    const safeNameZip = FileNameUtils.getSafeName(originalName, 'splitted').replace('.pdf', '.zip');
                    await ctx.replyWithDocument(new InputFile(result.zipPath, safeNameZip), {
                        caption:      i18n.messages.actions.split.split_caption_success_zip + `<b>${pages}</b>`,
                        parse_mode:   'HTML',
                        reply_markup: this.keyboards.getMainMenu(isAdmin),
                    });
                    await this.fileService.deleteFile(result.zipPath);
                }

                await this.db.logAction(ctx.from!.id, 'split', sizeBytes);
                await this.logger.logAction(
                    'TextHandler:handleSplitPages',
                    ctx.from!,
                    'Split result',
                    `Pages: ${pages}`,
                    result.paths ? `${result.paths.length} files + ZIP` : 'ZIP only',
                );

                await this.fileService.deleteFile(filePath);

                await sendTrafficUsedSummary(ctx, this, sizeBytes);

                await notifyTrafficAfterResult(ctx, this.localization, this.keyboards, this.logger);
                Object.assign(ctx.session, initialSession());

            }catch(e: any){

                await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});

                if(e.message === 'PROCESSING_TIMEOUT'){

                    await handleProcessingTimeout(ctx, this, 'Split', originalName);

                }else if(e.message === 'SERVER_BUSY'){

                    await handleServerBusy(ctx, this, 'Split', originalName);

                }else if(e.message === 'USER_CANCELLED'){

                    await handleUserCancelled(ctx, this, 'Split', originalName);

                }else if(typeof e.message === 'string' && e.message.startsWith('PAGE_OUT_OF_RANGE')){

                    await handlePageOutOfRange(ctx, this, 'Split', originalName, e.message);

                }else{

                    await handleWorkerTechnicalError(ctx, this, 'Split', originalName);

                }

                await this.fileService.deleteFile(filePath);
                Object.assign(ctx.session, initialSession());

            }

        });

    }
    
    private async handleLongImagePages(ctx: BotContext, i18n: any, isAdmin: boolean, text: string): Promise<void>{
 
        if(isDuplicateCall(ctx, this)) return;

        const pages    = text.trim();
        const filePath = ctx.session.filePaths[0];
 
        if(!filePath){
            await ctx.reply(i18n.errors.file_lost, {parse_mode: 'HTML'});
            ctx.session = initialSession();
            return;
        }
 
        const sizeBytes    = fs.statSync(filePath).size;
        const originalName = ctx.session.tempParams?.originalName || 'Document.pdf';
 
        const user   = await this.db.getUser(ctx.from!.id);
        const plan   = user?.isVip ? 'vip' : (user?.subType || 'free');
        const isFree = plan === 'free';
 
        ctx.session.step = 'processing';
 
        await this.logger.logAction('TextHandler:handleLongImagePages', ctx.from!, 'Long image pages', `Pages: ${pages} | Plan: ${plan}`);
        const statusMsg = await ctx.reply(i18n.messages.actions.long_image.long_image_processing, {parse_mode: 'HTML', reply_markup: this.keyboards.getCancelOnlyMenu()});
 
        setImmediate(async () => {

            try{
 
                const resultPath = await this.worker.toLongImage(ctx, filePath, pages, sizeBytes, isFree, plan);
 
                await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
 
                const safeName = FileNameUtils.getSafeName(originalName, '_LONG').replace(/\.pdf$/i, '.jpg');
 
                const isPaidResult = await this.isPaidUser(ctx);
                await ctx.replyWithDocument(new InputFile(resultPath, safeName), {
                    caption:      i18n.messages.actions.long_image.success_long_image,
                    parse_mode:   'HTML',
                    reply_markup: this.keyboards.getFileActionsMenu([], isPaidResult),
                });
 
                await this.db.logAction(ctx.from!.id, 'long_image', sizeBytes);
                await this.fileService.deleteFile(resultPath);
                await this.fileService.deleteFile(filePath);
                await notifyTrafficAfterResult(ctx, this.localization, this.keyboards, this.logger);
 
                await this.logger.logAction(
                    'TextHandler:handleLongImagePages',
                    ctx.from!,
                    'Long image result',
                    `File: ${originalName} | Pages: ${pages} | Success`,
                );
 
                Object.assign(ctx.session, initialSession());
 
            }catch(e: any){
 
                await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});

                if(typeof e.message === 'string' && e.message.startsWith('PAGE_LIMIT_EXCEEDED')){
 
                    const [, actual, limit] = e.message.split('|');
 
                    await this.logger.logAction(
                        'TextHandler:handleLongImagePages',
                        ctx.from!,
                        'Long image page limit exceeded',
                        `Plan: ${plan} | Selected: ${actual} | Limit: ${limit}`,
                    );
 
                    const msg = i18n.messages.actions.long_image.errors.long_image_limit_exceeded
                        .replace('{{pages}}', actual)
                        .replace('{{limit}}', limit)
                        .replace('{{plan}}', plan);
 
                    await ctx.reply(msg, {parse_mode: 'HTML'});
 
                }else if(e.message === 'PROCESSING_TIMEOUT'){

                    await handleProcessingTimeout(ctx, this, 'LongImage', originalName);

                }else if(e.message === 'SERVER_BUSY'){

                    await handleServerBusy(ctx, this, 'LongImage', originalName);

                }else if(e.message === 'USER_CANCELLED'){

                    await handleUserCancelled(ctx, this, 'LongImage', originalName);

                }else if(typeof e.message === 'string' && e.message.startsWith('PAGE_OUT_OF_RANGE')){

                    await handlePageOutOfRange(ctx, this, 'LongImage', originalName, e.message);

                }else{
 
                    await handleWorkerTechnicalError(ctx, this, 'LongImage', originalName);
 
                }
 
                await this.fileService.deleteFile(filePath);
                Object.assign(ctx.session, initialSession());
 
            }

        });
 
    }
    
    private async handleRejected(ctx: BotContext, i18n: any, isAdmin: boolean, text: string): Promise<void>{

        await this.logger.logAction(
            'TextHandler',
            ctx.from!,
            'Rejected text',
            text.length > 50 ? text.substring(0, 50) + '...' : text,
        );

        await ctx.reply(i18n.errors.text_rejected, {
            parse_mode:   'HTML',
            reply_markup: this.keyboards.getMainMenu(isAdmin),
        });

    }

    private async handleMetadataConfirm(ctx: BotContext, i18n: any, text: string): Promise<void>{

        const confirmWords = ['yes', 'yeah', 'yeap', 'yep', 'yup', 'sure', 'ok', 'okay', 'да', 'ага', 'конечно', 'ок', 'כן'];

        if(!confirmWords.includes(text.trim().toLowerCase())){

            const hasSignature = ctx.session.tempParams?.metadataHasSignature;
            const mode         = (ctx.session.tempParams as any)?.password;

            let confirmMsg = i18n.messages.actions.metadata.metadata_confirm_ask;

            if(hasSignature && mode === 'keep_signature') confirmMsg = i18n.messages.actions.metadata.metadata_confirm_keep_sig;
            if(hasSignature && mode === 'full_wipe')      confirmMsg = i18n.messages.actions.metadata.metadata_confirm_full_wipe;

            await ctx.reply(confirmMsg, {
                parse_mode:   'HTML',
                reply_markup: this.keyboards.getBackOnlyMenu(),
            });

            return;

        }

        await new MetadataAction(ctx, this).execute();

    }

    private async handleMetadataMode(ctx: BotContext, i18n: any, text: string): Promise<void>{

        await new MetadataAction(ctx, this).handleModeChoise(text);

    }

}
