import type {BotContext}          from '../../../types/BotContext.js';
import {InputFile}                from 'grammy';
import {initialSession}           from '../../../types/SessionData.js';
import {FileNameUtils}            from '../../../utils/FileNameUtils.js';
import {notifyTrafficAfterResult} from '../../../utils/TrafficNotifier.js';
import {isDuplicateCall}          from '../../../utils/BusyGuard.js';
import {handleProcessingTimeout, handleServerBusy, handleUserCancelled, handleWorkerTechnicalError} from '../../../utils/ProcessingTimeoutHelper.js';
import {sendPreActionInfo, sendTrafficUsedSummary} from '../../../utils/PreActionInfo.js';
import fs                         from 'fs';

export class AsymmetricProtectAction{
    
    constructor(
        private readonly ctx:     BotContext,
        private readonly handler: any,
    ){}
    
    async execute():Promise<void>{
        
        const {ctx,handler} = this;
        const i18n = handler.getI18n();
        const isAdmin = handler.isAdmin(ctx);
        
        if(isDuplicateCall(ctx, handler)) return;
        
        const filePath = ctx.session.filePaths[0];
        const originalName = ctx.session.tempParams?.originalName || 'document.pdf';
        
        if(!filePath){
            
            await ctx.reply(i18n.errors.file_lost);
            ctx.session = initialSession();
            return;
            
        }
        
        await handler.logger.logAction(
            'AsymmetricProtectAction',
            ctx.from!,
            'Asymmetric encrypt started',
            `File: ${originalName}`,
        );
        
        await sendPreActionInfo(
            ctx, handler,
            i18n.messages.actions.asymmetric.rule,
            i18n.messages.actions.asymmetric.availability,
        );
        
        const statusMsg = await ctx.reply(i18n.messages.actions.asymmetric.asymmetric_processing,{parse_mode:'HTML', reply_markup: handler.keyboards.getCancelOnlyMenu()});
        const sizeBytes = fs.statSync(filePath).size;
        
        setImmediate(async () => {
            
            try{
                
                const result = await handler.worker.asymmetricEncrypt(ctx,filePath,sizeBytes);
                await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
                
                const safeName = FileNameUtils.getSafeName(originalName,'_PROTECTED') + '.zip';
                
                await ctx.replyWithDocument(new InputFile(result.zipPath,safeName),
                
                {
                    caption:i18n.messages.actions.asymmetric.asymmetric_success,
                    parse_mode:'HTML',
                    reply_markup:handler.keyboards.getMainMenu(isAdmin)
                }
                
                );
                
                await handler.logger.logAction(
                    'AsymmetricProtectAction',
                    ctx.from!,
                    'Asymmetric encrypt result',
                    `File: ${originalName} | ZIP: ${safeName}`,
                );
                
                const stats = await fs.promises.stat(result.zipPath);
                
                await handler.db.logAction(ctx.from!.id,'asymmetric',stats.size);
                
                await handler.fileService.deleteFile(filePath).catch(()=>{});
                await handler.fileService.deleteFile(result.zipPath).catch(()=>{});
                
                await sendTrafficUsedSummary(ctx, handler, stats.size);
                
                await notifyTrafficAfterResult(ctx,handler.localization,handler.keyboards,handler.logger);
                Object.assign(ctx.session, initialSession());
                
            }catch(e:any){
                
                await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
                
                if(e.message === 'PROCESSING_TIMEOUT'){
                    
                    await handleProcessingTimeout(ctx, handler, 'AsymmetricEncrypt', originalName);
                    
                }else if(e.message === 'SERVER_BUSY'){
                    
                    await handleServerBusy(ctx, handler, 'AsymmetricEncrypt', originalName);
                    
                }else if(e.message === 'USER_CANCELLED'){
                    
                    await handleUserCancelled(ctx, handler, 'AsymmetricEncrypt', originalName);
                    
                }else{
                    
                    await handleWorkerTechnicalError(ctx, handler, 'AsymmetricEncrypt', originalName);
                    
                }
                
                await handler.fileService.deleteFile(filePath).catch(()=>{});
                Object.assign(ctx.session, initialSession());
                
            }
            
        });
        
    }
    
}
