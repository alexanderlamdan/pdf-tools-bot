import type { BotContext }          from '../../../types/BotContext.js';
import { initialSession }           from '../../../types/SessionData.js';
import { FileNameUtils }            from '../../../utils/FileNameUtils.js';
import { notifyTrafficAfterResult } from '../../../utils/TrafficNotifier.js';
import { sendPreActionInfo, sendTrafficUsedSummary } from '../../../utils/PreActionInfo.js';

export class RenameAction{
    
    constructor(private readonly ctx:BotContext,private readonly handler:any){}
    
    async askForName():Promise<void>{
        
        const {ctx,handler} = this;
        const i18n = handler.getI18n();
        
        await handler.logger.logAction('RenameAction:askForName',ctx.from!,'Waiting for name');
        
        ctx.session.currentAction = 'rename';
        ctx.session.step = 'waiting_for_rename';
        
        await sendPreActionInfo(
            ctx, handler,
            i18n.messages.actions.rename.rule,
            i18n.messages.actions.rename.availability,
            handler.keyboards.getBackOnlyMenu(),
        );
        
    }
    
    async performRename(newName:string):Promise<void>{
        
        const {ctx,handler} = this;
        const i18n = handler.getI18n();
        
        const filePath = ctx.session.filePaths[0];
        
        if(!filePath){
            
            await ctx.reply(i18n.errors.file_lost);
            ctx.session = initialSession();
            return;
            
        }
        
        const safeName = FileNameUtils.sanitizeUserFileName(newName) + '.pdf';
        const isPaid = await handler.isPaidUser(ctx);
        
        try{
            
            await handler.sendDocumentWithMetadata(ctx, filePath, safeName,{
                
                caption:i18n.messages.actions.rename.success_rename,
                parse_mode:'HTML',
                reply_markup:handler.keyboards.getFileActionsMenu([],isPaid)
                
            });
            
            await handler.logger.logAction('RenameAction:performRename',ctx.from!,'Rename result',`New name: ${safeName}`,'Success');
            
            await handler.db.logAction(ctx.from!.id,'rename',0);
            
            await handler.fileService.deleteFile(filePath);

            await sendTrafficUsedSummary(ctx, handler, 0);

            await notifyTrafficAfterResult(ctx,handler.localization,handler.keyboards,handler.logger);
            
        }catch(e:any){
            
            await handler.logger.error('RenameAction:performRename',e,{user:ctx.from!,message:ctx.message!});
            await handler.fileService.deleteFile(filePath).catch(()=>{});
            await ctx.reply(i18n.errors.worker_technical_error,{parse_mode:'HTML'}).catch(()=>{});
            
        }
        
        ctx.session = initialSession();
        
    }
}
