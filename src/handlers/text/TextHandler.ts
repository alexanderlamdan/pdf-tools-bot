import type { BotContext } from '../../types/BotContext.js';
import { InputFile } from 'grammy';
import { initialSession } from '../../types/SessionData.js';
import { BaseHandler } from '../base/BaseHandler.js';
import { MergeAction, MERGE_CONFIRM_WORDS } from '../buttons/actions/MergeAction.js';
import { FileNameUtils } from '../../utils/FileNameUtils.js';
import { notifyTrafficAfterResult } from '../../utils/TrafficNotifier.js';
import fs from 'fs';

export class TextHandler extends BaseHandler{
    
    async handle(ctx:BotContext):Promise<void>{
        
        const text = ctx.message?.text;
        if(!text) return;
        
        const lang = this.getLang(ctx);
        const i18n = this.getI18n(ctx);
        const isAdmin = this.isAdmin(ctx);
        
        await this.registerUser(ctx);
        
        if(text.startsWith('/')) return;
        
        const {currentAction:action,step} = ctx.session;
        
        if(step !== 'waiting_for_merge_confirm' && this.localization.getActionKeyByText(text)) return;
        
        const route = `${action}:${step}`;
        
        switch(route){
            
            case 'protect:waiting_for_password':
                await this.handleProtectPassword(ctx,lang,i18n,isAdmin,text);
                break;
            
            case 'unlock:waiting_for_password':
                await this.handleUnlockPassword(ctx,lang,i18n,isAdmin,text);
                break;
                
            case 'split:waiting_for_split_pages':
                await this.handleSplitPages(ctx,lang,i18n,isAdmin,text);
                break;
            
            default:
                if(step === 'waiting_for_merge_confirm'){
                    
                    await new MergeAction(ctx,this).handleBulkConfirm(text);
                    
                }else{
                    
                    await this.handleRejected(ctx,lang,i18n,isAdmin,text);
                    
                }
        }
        
    }
    
    private async handleProtectPassword(ctx:BotContext,lang:string,i18n:any,isAdmin:boolean,text:string):Promise<void>{
        
        await this.logger.logAction('TextHandler:handleProtectPassword', ctx.from!, 'Password input', 'protect — ***HIDDEN***');
        
        const password = text.trim();
        if(password.length < 1){
            
            await ctx.reply(i18n.errors.password_empty);
            return;
            
        }
        
        const filePath = ctx.session.filePaths[0];
        if(!filePath){
            
            await ctx.reply(i18n.messages.actions.file_lost);
            ctx.session = initialSession();
            return;
            
        }
        
        const statusMsg = await ctx.reply(i18n.messages.actions.encrypting);
        const sizeBytes = fs.statSync(filePath).size;
        
        try{
            
            const resultPath = await this.worker.encrypt(ctx, filePath, password, sizeBytes);
            const stats = await fs.promises.stat(resultPath);
            await this.db.logAction(ctx.from!.id,'protect',stats.size);
            
            const safeName = FileNameUtils.getSafeName(ctx.session.tempParams?.originalName || 'Document.pdf',i18n.messages.actions.suffix_protected);
            
            const safePassword = FileNameUtils.escapeHtml(password);
            
            await this.logger.logAction('TextHandler', ctx.from!, 'Protect result', '', 'Success');
            
            await ctx.replyWithDocument(new InputFile(resultPath,safeName),{
                
                caption:i18n.messages.actions.success_protect,
                parse_mode:'HTML',
                reply_markup:this.keyboards.getMainMenu(lang,isAdmin)
                
            });
            
            await this.fileService.deleteFile(filePath);
            await this.fileService.deleteFile(resultPath);
            await notifyTrafficAfterResult(ctx,lang,this.localization,this.keyboards,this.logger);
            ctx.session = initialSession();
            
        }catch(e:any){
            
            const msg = (e.message || '').length > 2000 ? e.message.substring(0,2000) + '...' : e.message;
            await this.logger.error('TextHandler:protect',{...e,message:msg},{user:ctx.from!,message:ctx.message!});
            
            ctx.session = initialSession();
            
        }finally{
            
            await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
            
        }
        
    }
    
    private async handleUnlockPassword(ctx:BotContext,lang:string,i18n:any,isAdmin:boolean,text:string):Promise<void>{
        
        await this.logger.logAction('TextHandler:handleUnlockPassword',ctx.from!,'Password input','unlock - ***HIDDEN***');
        
        const password = text.trim();
        const filePath = ctx.session.filePaths[0];
        
        if(!filePath){
            
            await ctx.reply(i18n.messages.actions.file_lost);
            return;
            
        }
        
        const statusMsg = await ctx.reply(i18n.messages.actions.decrypting);
        const sizeBytes = fs.statSync(filePath).size;
        
        try{
            
            const resultPath = await this.worker.decrypt(ctx, filePath, password, sizeBytes);
            const stats = await fs.promises.stat(resultPath);
            
            this.db.logAction(ctx.from!.id,'unlock',stats.size);
            
            const safeName = FileNameUtils.getSafeName(ctx.session.tempParams?.originalName || 'doc.pdf',i18n.messages.actions.suffix_unlocked);
            
            await this.logger.logAction('TextHandler:handleUnlockPassword',ctx.from!,'Unlock result','','Success-Password accepted');
            
            await ctx.replyWithDocument(new InputFile(resultPath,safeName),{
                
                caption:i18n.messages.actions.success_crack.replace('{{password}}',password),
                parse_mode:'HTML',
                reply_markup:this.keyboards.getMainMenu(lang, isAdmin)
                
            });
            
            await this.fileService.deleteFile(resultPath);
            await this.fileService.deleteFile(filePath);
            
            await notifyTrafficAfterResult(ctx,lang, this.localization, this.keyboards,this.logger);
            ctx.session = initialSession();
            
        }catch(e:any){
            
            await this.logger.logAction('TextHandler:handleUnlockPassword',ctx.from!,'Unlock result','','Failed - wrong password');
            
            await ctx.reply(i18n.messages.actions.fail_crack);
            
        }finally{
            
            await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
            
        }
        
    }
    
    private async handleSplitPages(ctx:BotContext,lang:string,i18n:any,isAdmin:boolean,text:string):Promise<void>{
        
        const pages = text.trim();
        const filePath = ctx.session.filePaths[0];
        
        if(!filePath){
            
            await ctx.reply(i18n.messages.actions.file_lost,{parse_mode:'HTML'});
            ctx.session = initialSession();
            return;
            
        }
        
        await this.logger.logAction('TextHandler:handleSplitPages',ctx.from!,'Split pages',`Pages: ${pages}`);
        const statusMsg = await ctx.reply(i18n.messages.common.wait,{parse_mode:'HTML'});
        
        try{
            
            const sizeBytes = fs.statSync(filePath).size;
            const result = await this.worker.split(ctx,filePath,pages,sizeBytes);
            
            const originalName = ctx.session.tempParams?.originalName || 'Document.pdf';
            const safeNamePdf = FileNameUtils.getSafeName(originalName,'splitted');
            
            await ctx.replyWithDocument(new InputFile(result.path,safeNamePdf),{
                
                caption:  i18n.messages.actions.split_caption_success_file + `<b>${pages}</b>`,
                parse_mode:'HTML',
                reply_markup:result.zipPath ? undefined : this.keyboards.getMainMenu(lang,isAdmin)
                
            });
            
            const statsPdf = await fs.promises.stat(result.path);
            
            let totalLogSize = statsPdf.size;
            
            if(result.zipPath){
                
                const safeNameZip = safeNamePdf.replace('.pdf','.zip');
                await ctx.replyWithDocument(new InputFile(result.zipPath,safeNamePdf),{
                    
                    caption:i18n.messages.actions.split_caption_success_zip + `<b>${pages}</b>`,
                    parse_mode:'HTML',
                    reply_markup:this.keyboards.getMainMenu(lang,isAdmin)
                    
                });
                
                const statsZip = await fs.promises.stat(result.path);
                totalLogSize += statsZip.size;
                
                await this.fileService.deleteFile(result.zipPath);
                
            }
            
            await this.db.logAction(ctx.from!.id,'split',totalLogSize);
            await this.logger.logAction('TextHandler:handleSplitPages',ctx.from!,'Split result',`Pages: ${pages}`, result.zipPath ? 'PDF + ZIP' : 'PDF only');
            
            await this.fileService.deleteFile(filePath);
            await this.fileService.deleteFile(result.path);
            
            await notifyTrafficAfterResult(ctx,lang,this.localization,this.keyboards,this.logger);
            ctx.session = initialSession();
            
        }catch(e:any){
            
            await this.logger.error('TextHandler:handleSplitPages',e,{user:ctx.from!,message:ctx.message!});
            await ctx.reply(`Error:${e.message}`,{reply_markup:this.keyboards.getMainMenu(lang,isAdmin)});
            
            ctx.session = initialSession();
            
        }finally{
            
            await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
            
        }
        
    }
    
    private async handleRejected(ctx:BotContext,lang:string,i18n:any,isAdmin:boolean,text:string):Promise<void>{
        
        await this.logger.logAction('TextHandler', ctx.from!, 'Rejected text', text.length > 50 ? text.substring(0, 50) + '...' : text);
        await ctx.reply(i18n.errors.text_rejected, {
            parse_mode:   'HTML',
            reply_markup: this.keyboards.getMainMenu(lang, isAdmin),
        });
        
    }
    
}
