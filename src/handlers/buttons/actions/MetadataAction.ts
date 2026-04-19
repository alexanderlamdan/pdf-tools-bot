import type {BotContext} from '../../../types/BotContext.js';
import {InputFile} from 'grammy';
import {initialSession} from '../../../types/SessionData.js';
import {FileNameUtils} from '../../../utils/FileNameUtils.js';
import {notifyTrafficAfterResult} from '../../../utils/TrafficNotifier.js';
import fs from 'fs';

export class MetadataAction{
    
    constructor(private readonly ctx:BotContext,private readonly handler:any){}
    
    async showAndAskConfirm():Promise<void>{
        
        const {ctx,handler} = this;
        const i18n = handler.getI18n();
        const localPath = ctx.session.filePaths[0];
        
        await handler.logger.logAction("MetadataAction:showAndAskConfirm",ctx.from!,'Read metadata',localPath);
        
        const statusMsg = await ctx.reply(i18n.messages.actions.metadata_reading,{parse_mode:'HTML'});
        
        try{
            
            const sizeBytes = fs.statSync(localPath).size;
            const info = await handler.worker.readMetadata(ctx,localPath,sizeBytes);
            
            await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
            
            const hasSignature:boolean = info?.HasDigitalSignature || info?.hasDigitalSignature || false;
            
            ctx.session.tempParams = {
                
                ...ctx.session.tempParams,
                metadataHasSignature:hasSignature
                
            };
            
            if(hasSignature){
                
                ctx.session.step = 'waiting_for_metadata_mode';
                ctx.session.currentAction = 'analyze';
                await ctx.reply(this.formMetadataReport(info, i18n, true),{
                    parse_mode:'HTML',
                    reply_markup:{force_reply:true}
                });
                
            }else{
                
                ctx.session.step = 'waiting_for_metadata_confirm';
                ctx.session.currentAction = 'analyze';
                await ctx.reply(this.formMetadataReport(info, i18n, false),{
                    parse_mode:'HTML',
                    reply_markup:{force_reply:true}
                });
                
            }
            
        }catch(e:any){
            
            await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
            await handler.logger.error('MetadataAction:showAndAskConfirm',e,{user:ctx.from!,message:ctx.message!});
            await ctx.reply(`❌ ${e.message}`);
            
        }
        
    }
    async handleModeChoise(text:string):Promise<void>{
        
        const {ctx,handler} = this;
        const i18n = handler.getI18n();
        const choise = text.trim();
        
        if(choise === '1'){
            
            ctx.session.step = 'waiting_for_metadata_confirm';
            ctx.session.tempParams = {...ctx.session.tempParams,password:'keep_signature'} as any;
            await ctx.reply(i18n.messages.actions.metadata_confirm_keep_sig,{
                parse_mode:'HTML',
                reply_markup:{force_reply:true}
            });
            
        }else if(choise === '2'){
            
            ctx.session.step = 'waiting_for_metadata_confirm';
            ctx.session.tempParams = {...ctx.session.tempParams,password:'full_wipe'} as any;
            await ctx.reply(i18n.messages.actions.metadata_confirm_full_wipe,{
                
                parse_mode:'HTML',
                reply_markup:{force_reply:true}
                
            });
            
        }else{
            
            await ctx.reply(i18n.messages.actions.metadata_mode_invalid, {
                parse_mode: 'HTML',
                reply_markup: {force_reply: true}
            });
            
        }
        
    }
    async execute():Promise<void>{
        
        const {ctx,handler} = this;
        const i18n = handler.getI18n();
        const localPath = ctx.session.filePaths[0];
        
        const originalName = ctx.session.tempParams?.originalName || 'document.pdf';
        const hasSignature = ctx.session.tempParams?.metadataHasSignature;
        const mode = hasSignature ? ((ctx.session.tempParams as any)?.password || 'full_wipe') as 'keep_signature'|'full_wipe' : 'full_wipe';
        
        await handler.logger.logAction('MetadataAction:execute',ctx.from!,'Wipe metadata',`File: ${originalName}`);
        
        const statusMsg = await ctx.reply(i18n.messages.actions.metadata_wiping,{parse_mode:'HTML'});
        
        try{
            
            const sizeBytes = fs.statSync(localPath).size;
            const resultPath = await handler.worker.wipeMetadata(ctx,localPath,sizeBytes);
            
            const stats = await fs.promises.stat(resultPath);
            await handler.db.logAction(ctx.from!.id,'metadata_wipe',stats.size);
            await handler.fileService.deleteFile(localPath);
            
            ctx.session.filePaths = [resultPath];
            ctx.session.currentAction = 'ready';
            ctx.session.step = 'idle';
            
            await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
            
            const safeName = FileNameUtils.getSafeName(originalName,i18n.messages.actions.suffix_metadata_clean);
            
            await handler.logger.logAction('MetadataAction:execute',ctx.from!,'Wipe metadata result',`File: ${originalName}`,'Success');
            
            await ctx.replyWithDocument(new InputFile(resultPath,safeName));
            await ctx.reply(i18n.messages.actions.metadata_wipe_success,{
                parse_mode:'HTML',
                reply_markup:handler.keyboards.getFileActionsMenu()
            });
            
            await notifyTrafficAfterResult(ctx,handler.localization,handler.keyboards,handler.logger);
            
        }catch(e:any){
            
            await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
            await handler.logger.error('MetadataAction:execute',e,{user:ctx.from!,message:ctx.message!});
            
            await ctx.reply(`❌ ${i18n.messages.common.technical_problem} ${e.message}`, {parse_mode:'HTML'});
            
            await handler.fileService.deleteFile(localPath);
            ctx.session = initialSession();
            
        }
        
    }
    
    private formMetadataReport(info:any,i18n:any,hasSignature:boolean):string{
        
        const fields:Record<string,string> = info?.fields || {};
        const hasWatermark:boolean = info?.HasWatermark || info?.hasWatermark || false;
        
        const entries = Object.entries(fields);
        let report = i18n.messages.actions.metadata_found_title + '\n';
        
        if(entries.length === 0){
            
            report += i18n.messages.actions.metadata_empty + '\n';
            
        }else{
            
            for(const [key,val] of entries){
                
                report += `• <b>${key}:</b> <code>${val}</code>\n`;
                
            }
            
        }
        
        if(hasWatermark){
            
            report += `\n⚠️ ${i18n.messages.actions.metadata_watermark_found}\n`;
            
        }
        
        if(hasSignature){
            
            report += `\n${i18n.messages.actions.metadata_signature_found}\n`;
            report += `\n${i18n.messages.actions.metadata_mode_ask}`;
            
        }else{
            
             report += `\n${i18n.messages.actions.metadata_confirm_ask}`;
            
        }
        
        return report;
        
    }
    
}
