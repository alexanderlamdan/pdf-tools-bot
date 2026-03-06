import type {BotContext} from '../../../types/BotContext.js';
import {InputFile} from 'grammy';
import {initialSession} from '../../../types/SessionData.js';
import {FileNameUtils} from '../../../utils/FileNameUtils.js';
import { notifyTrafficAfterResult } from '../../../utils/TrafficNotifier.js';
import fs from 'fs';

export class RepairAction{
    
    constructor(private readonly ctx:BotContext,private readonly handler:any){}
    
    async execute():Promise<void>{
        
        const {ctx,handler} = this;
        const lang = handler.getLang(ctx);
        const i18n = handler.getI18n(ctx);
        const localPath = ctx.session.filePaths[0];
        const originalName = ctx.session.tempParams?.originalName || 'document.pdf';
        
        await handler.logger.logAction('RepairAction:execute',ctx.from!,'Repair',`File: ${originalName}`);
        
        const statusMsg = await ctx.reply(i18n.messages.actions.repair_warning,{parse_mode:'HTML'});
        const sizeBytes = fs.statSync(localPath).size;
        
        try{
            
            const resultPath = await handler.worker.repair(ctx,localPath,sizeBytes);
            const stats = await fs.promises.stat(resultPath);
            
            await handler.db.logAction(ctx.from!.id,'repair',stats.size);
            await handler.fileService.deleteFile(localPath);
            
            ctx.session.filePaths = [resultPath];
            ctx.session.currentAction = 'ready';
            
            await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
            
            const safeName = FileNameUtils.getSafeName(originalName,i18n.messages.actions.suffix_repair);
            
            await handler.logger.logAction('RepairAction:execute',ctx.from!,'Repair result',`File: ${originalName}`,'Success');
            
            await ctx.replyWithDocument(new InputFile(resultPath,safeName));
            await ctx.reply(i18n.messages.actions.repair_success,{
                
                parse_mode:'HTML',
                reply_markup:handler.keyboards.getFileActionsMenu(lang)
                
            });
            
            await notifyTrafficAfterResult(ctx,lang,handler.localization,handler.keyboards,handler.logger);
            
        }catch(e:any){
            
            await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
            await handler.logger.error('RepairAction:execute',e,{user:ctx.from!,message:ctx.message!});
            
            await ctx.reply(`${i18n.messages.action.repair_fail}\n\n<i>${i18n.messages.common.technical_problem}</i>`,{
                parse_mode:'HTML'
            });
            
            await handler.fileService.deleteFile(localPath);
            ctx.session = initialSession();
            
        }
        
    }
    
}
