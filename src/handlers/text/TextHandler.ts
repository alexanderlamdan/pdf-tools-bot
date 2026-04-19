import type { BotContext } from '../../types/BotContext.js';
import { InputFile } from 'grammy';
import { initialSession } from '../../types/SessionData.js';
import { BaseHandler } from '../base/BaseHandler.js';
import { MergeAction, MERGE_CONFIRM_WORDS } from '../buttons/actions/MergeAction.js';
import {MetadataAction} from '../buttons/actions/MetadataAction.js';
import { FileNameUtils } from '../../utils/FileNameUtils.js';
import { notifyTrafficAfterResult } from '../../utils/TrafficNotifier.js';
import fs from 'fs';
import path from 'path';

export class TextHandler extends BaseHandler{
    
    async handle(ctx:BotContext):Promise<void>{
        
        const text = ctx.message?.text;
        if(!text) return;
        
        const i18n = this.getI18n();
        const isAdmin = this.isAdmin(ctx);
        
        await this.registerUser(ctx);
        
        if(text.startsWith('/')) return;
        
        const {currentAction:action,step} = ctx.session;
        
       if(step !== 'waiting_for_merge_confirm' && step !== 'waiting_for_metadata_mode' && step !== 'waiting_for_metadata_confirm' && this.localization.getActionKeyByText(text)) return;
        
        const route = `${action}:${step}`;
        
        switch(route){
            
            case 'protect:waiting_for_password':
                await this.handleProtectPassword(ctx,i18n,isAdmin,text);
                break;
            
            case 'unlock:waiting_for_password':
                await this.handleUnlockPassword(ctx,i18n,isAdmin,text);
                break;
                
            case 'split:waiting_for_split_pages':
                await this.handleSplitPages(ctx,i18n,isAdmin,text);
                break;
            case 'analyze:waiting_for_metadata_mode':
                await this.handleMetadataMode(ctx,i18n,text);
                break;
            case 'analyze:waiting_for_metadata_confirm':
                await this.handleMetadataConfirm(ctx,i18n,text);
                break;
            default:
                if(step === 'waiting_for_merge_confirm' || step === 'waiting_for_merge_bulk'){
                    await new MergeAction(ctx, this).handleBulkConfirm(text);
                } else {
                    await this.handleRejected(ctx, i18n, isAdmin, text);
                }
        }
        
    }
    
    private async handleProtectPassword(ctx:BotContext,i18n:any,isAdmin:boolean,text:string):Promise<void>{
        
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
                reply_markup:this.keyboards.getMainMenu(isAdmin)
                
            });
            
            await this.fileService.deleteFile(filePath);
            await this.fileService.deleteFile(resultPath);
            await notifyTrafficAfterResult(ctx,this.localization,this.keyboards,this.logger);
            ctx.session = initialSession();
            
        }catch(e:any){
            
            const msg = (e.message || '').length > 2000 ? e.message.substring(0,2000) + '...' : e.message;
            await this.logger.error('TextHandler:protect',{...e,message:msg},{user:ctx.from!,message:ctx.message!});
            
            ctx.session = initialSession();
            
        }finally{
            
            await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
            
        }
        
    }
    
    private async handleUnlockPassword(ctx:BotContext,i18n:any,isAdmin:boolean,text:string):Promise<void>{
        
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
                reply_markup:this.keyboards.getMainMenu(isAdmin)
                
            });
            
            await this.fileService.deleteFile(resultPath);
            await this.fileService.deleteFile(filePath);
            
            await notifyTrafficAfterResult(ctx,this.localization, this.keyboards,this.logger);
            ctx.session = initialSession();
            
        }catch(e:any){
            
            await this.logger.logAction('TextHandler:handleUnlockPassword',ctx.from!,'Unlock result','','Failed - wrong password');
            
            await ctx.reply(i18n.messages.actions.fail_crack);
            
        }finally{
            
            await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
            
        }
        
    }
    
    private async handleSplitPages(ctx:BotContext,i18n:any,isAdmin:boolean,text:string):Promise<void>{
        
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
            const result = await this.worker.split(ctx, filePath, pages, sizeBytes);
    
            const originalName = ctx.session.tempParams?.originalName || 'Document.pdf';
    
            await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
    
            if(result.paths && result.paths.length > 0){
                for(const pagePath of result.paths){
                    const safeName = FileNameUtils.getSafeName(path.basename(pagePath), '');
                    await ctx.replyWithDocument(new InputFile(pagePath, safeName), {
                        parse_mode: 'HTML'
                    });
                    await new Promise(r => setTimeout(r, 1200)); // задержка 1.2с
                    await this.fileService.deleteFile(pagePath);
                }
            }
    
            if(result.zipPath){
                const safeNameZip = FileNameUtils.getSafeName(originalName, 'splitted').replace('.pdf', '.zip');
                await ctx.replyWithDocument(new InputFile(result.zipPath, safeNameZip), {
                    caption: i18n.messages.actions.split_caption_success_zip + `<b>${pages}</b>`,
                    parse_mode: 'HTML',
                    reply_markup: this.keyboards.getMainMenu(isAdmin)
                });
                await this.fileService.deleteFile(result.zipPath);
            }
    
            const totalSize = fs.statSync(filePath).size;
            await this.db.logAction(ctx.from!.id, 'split', totalSize);
            await this.logger.logAction('TextHandler:handleSplitPages', ctx.from!, 'Split result', `Pages: ${pages}`, result.paths ? `${result.paths.length} files + ZIP` : 'ZIP only');
    
            await this.fileService.deleteFile(filePath);
            await notifyTrafficAfterResult(ctx, this.localization, this.keyboards, this.logger);
            ctx.session = initialSession();
    
        } catch(e: any){
            await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
            await this.logger.error('TextHandler:handleSplitPages', e, {user: ctx.from!, message: ctx.message!});
            await ctx.reply(`Error: ${e.message}`, {reply_markup: this.keyboards.getMainMenu(isAdmin)});
            ctx.session = initialSession();
        }
        
    }
    
    private async handleRejected(ctx:BotContext,i18n:any,isAdmin:boolean,text:string):Promise<void>{
        
        await this.logger.logAction('TextHandler', ctx.from!, 'Rejected text', text.length > 50 ? text.substring(0, 50) + '...' : text);
        await ctx.reply(i18n.errors.text_rejected, {
            parse_mode:   'HTML',
            reply_markup: this.keyboards.getMainMenu(isAdmin),
        });
        
    }
    
    private async handleMetadataConfirm(ctx:BotContext,i18n:any,text:string):Promise<void>{
        
        const confirmWords = ['yes','yeah','yep','sure','ok'];
        
        if(!confirmWords.includes(text.trim().toLowerCase())){
            
            const hasSignature = ctx.session.tempParams?.metadataHasSignature;
            const mode = (ctx.session.tempParams as any)?.password;
            
            let confirmMsg = i18n.messages.actions.metadata_confirm_ask;
            
            if(hasSignature && mode === 'keep_signature') confirmMsg = i18n.messages.actions.metadata_confirm_keep_sig;
            if(hasSignature && mode === 'full_wipe') confirmMsg = i18n.messages.actions.metadata_confirm_full_wipe;
            
            await ctx.reply(confirmMsg,{
                
                parse_mode:'HTML',
                reply_markup:{force_reply:true}
                
            });
            
            return;
            
        }
        
        await new MetadataAction(ctx,this).execute();
        
    }
    
    private async handleMetadataMode(ctx:BotContext,i18n:any,text:string):Promise<void>{
        
        await new MetadataAction(ctx,this).handleModeChoise(text);
        
    }
    
}
