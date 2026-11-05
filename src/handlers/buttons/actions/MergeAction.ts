import type {BotContext} from '../../../types/BotContext.js';
import {InputFile} from 'grammy';
import {initialSession} from '../../../types/SessionData.js';
import {FileNameUtils} from '../../../utils/FileNameUtils.js';
import { notifyTrafficAfterResult } from '../../../utils/TrafficNotifier.js';
import type { MergeResult } from '../../../services/PdfWorkerService.js';
import { isDuplicateCall } from '../../../utils/BusyGuard.js';
import { handleProcessingTimeout, handleServerBusy, handleUserCancelled, handleWorkerTechnicalError } from '../../../utils/ProcessingTimeoutHelper.js';
import { sendPreActionInfo, sendTrafficUsedSummary } from '../../../utils/PreActionInfo.js';
import path from 'path';
import fs from 'fs';

export const MERGE_CONFIRM_WORDS = new Set([
    'yes', 'yeah', 'yeap', 'yep', 'yup', 'sure', 'ok', 'okay',
    'да', 'ага', 'конечно', 'ок',
    'כן',
]);

export class MergeAction{
    
    constructor(private readonly ctx:BotContext,private readonly handler:any){}
    
    async showModeMenu():Promise<void>{
        
        const {ctx,handler} = this;
        const i18n = handler.getI18n();
        const isAdmin = handler.isAdmin(ctx);
        
        await handler.logger.logAction('MergeAction:showModeMenu',ctx.from!,'Merge','Showing mode menu');
        
        ctx.session.currentAction = 'merge';
        
        await sendPreActionInfo(
            ctx, handler,
            i18n.messages.actions.merge.rule,
            i18n.messages.actions.merge.availability,
            {
                keyboard:[
                    [{text:i18n.messages.actions.merge.buttons.btn_merge_one_by_one}],
                    [{text:i18n.messages.actions.merge.buttons.btn_merge_archive}],
                    [{text:i18n.messages.actions.merge.buttons.btn_merge_bulk}],
                    [{text:i18n.messages.user.buttons.common.btn_back}]
                ],
                resize_keyboard:true
            },
        );
        
    }
    
    async startOneByOne():Promise<void>{
        
        const {ctx,handler} = this;
        const i18n = handler.getI18n();
        
        await handler.logger.logAction('MergeAction:startOneByOne',ctx.from!,'Merge mode','One-by-one selected');
        
        ctx.session.currentAction = 'merge';
        ctx.session.step = 'waiting_for_merge_files';
        
        await ctx.reply(i18n.messages.actions.merge.ask_merge_files,{
            
            parse_mode:'HTML',
            reply_markup:{
                
                keyboard:[
                    [{text:i18n.messages.actions.merge.buttons.btn_execute_merge}],
                    [{text:i18n.messages.user.buttons.common.btn_cancel}],
                ],
                resize_keyboard:true
                
            }
            
        });
        
    }
    
    async startArchiveMode():Promise<void>{
        
        const { ctx, handler } = this;
        const i18n = handler.getI18n();
        
        await handler.logger.logAction('MergeAction:startArchiveMode',ctx.from!,'Merge mode', 'Archive selected');
        ctx.session.currentAction = 'merge';
        ctx.session.step = 'waiting_for_merge_archive';
        
        await ctx.reply(i18n.messages.actions.merge.ask_merge_archive,{
            
            parse_mode:'HTML',
            reply_markup:{
                
                keyboard:[[{text:i18n.messages.user.buttons.common.btn_cancel}]],
                resize_keyboard:true
                
            }
            
        });
        
    }
    
    async startBulkMode():Promise<void>{
        
        const { ctx, handler } = this;
        const i18n = handler.getI18n();

        await handler.logger.logAction('MergeAction:startBulkMode', ctx.from!, 'Merge mode', 'Bulk selected');
        
        ctx.session.currentAction = 'merge';
        ctx.session.step = 'waiting_for_merge_bulk';
        ctx.session.filePaths = [];
        
        await ctx.reply(i18n.messages.actions.merge.ask_merge_bulk,{
            
            parse_mode:'HTML',
            reply_markup:{
                
                keyboard:[[{text:i18n.messages.user.buttons.common.btn_cancel}]],
                resize_keyboard:true
                
            }
            
        });
        
    }
    
    async handleBulkConfirm(text:string):Promise<void>{
        
        const { ctx, handler } = this;
        const i18n = handler.getI18n();
        
        const normalized = text.trim().toLowerCase();
        
        if(MERGE_CONFIRM_WORDS.has(normalized)){
            
            await ctx.reply(`✅ ${ctx.session.filePaths.length} ${i18n.messages.actions.merge.merge_confirm_words}`,{
                parse_mode:'HTML',
                reply_markup:{
                    
                    keyboard:[
                        
                        [{text:i18n.messages.actions.merge.buttons.btn_execute_merge}],
                        [{text:i18n.messages.user.buttons.common.btn_cancel}]
                        
                    ],
                    resize_keyboard:true
                    
                }
            });
            
            ctx.session.step = 'waiting_for_merge_files';
            
        }else{
            
            ctx.session.step = 'waiting_for_merge_bulk';
            await ctx.reply(i18n.messages.actions.merge.merge_bulk_received.replace('{{count}}', String(ctx.session.filePaths.length)),{
                parse_mode:'HTML'
            });
            
        }
        
    }
    
    async execute():Promise<void>{
 
        const { ctx, handler } = this;
        const i18n        = handler.getI18n();
        const isAdmin      = handler.isAdmin(ctx);
 
        if(isDuplicateCall(ctx, handler)) return;
 
        if(ctx.session.filePaths.length < 2){
 
            await ctx.reply(i18n.messages.actions.merge.errors.merge_not_enough_files);
            return;
 
        }
 
        await handler.logger.logAction('MergeAction:execute',ctx.from!,'Merge execute',`Files: ${ctx.session.filePaths.length}`);
 
        const statusMsg = await ctx.reply(i18n.messages.common.wait,{parse_mode:'HTML', reply_markup: handler.keyboards.getCancelOnlyMenu()});
 
        const originalName = ctx.session.tempParams?.originalName || 'Document.pdf';
        const filePaths     = [...ctx.session.filePaths];
 
        setImmediate(async () => {
 
            try{
 
                let totalSize = 0;
                for(const p of filePaths) totalSize += fs.statSync(p).size;
 
                const result = await handler.worker.merge(ctx, filePaths, totalSize);
                await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
 
                const fileCount = filePaths.length;
                Object.assign(ctx.session, initialSession());
 
                if(result.isFallback){
 
                    await this.deliverFallback(result, isAdmin, i18n);
 
                }else{
 
                    await this.deliverSuccess(result.path!, originalName, isAdmin, i18n, totalSize, fileCount);
 
                }
 
                for(const p of filePaths) await handler.fileService.deleteFile(p);
 
            }catch(e: any){
 
                await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
 
                if(e.message === 'PROCESSING_TIMEOUT'){
 
                    await handleProcessingTimeout(ctx, handler, 'Merge', originalName);
 
                }else if(e.message === 'SERVER_BUSY'){
 
                    await handleServerBusy(ctx, handler, 'Merge', originalName);
 
                }else if(e.message === 'USER_CANCELLED'){
 
                    await handleUserCancelled(ctx, handler, 'Merge', originalName);
 
                }else{
 
                    await handleWorkerTechnicalError(ctx, handler, 'Merge', originalName);
 
                }
 
                for(const p of filePaths) await handler.fileService.deleteFile(p);
                Object.assign(ctx.session, initialSession());
 
            }
 
        });
 
    }
    
    private async deliverSuccess(resultPath:string,originalName:string,isAdmin:boolean,i18n:any,totalSize:number,fileCount:number):Promise<void>{
        
        const { ctx, handler } = this;
        const safeName = FileNameUtils.getSafeName(originalName, 'merged');

        await handler.logger.logAction('MergeAction:deliverySuccess', ctx.from!, 'Merge result', `Files: ${fileCount}`, 'Success');
        
        await handler.sendDocumentWithWatermark(ctx, resultPath, safeName, {
            reply_markup: handler.keyboards.getMainMenu(isAdmin),
        });
        
        await handler.db.logAction(ctx.from!.id,'merge',totalSize);
        await handler.fileService.deleteFile(resultPath);

        await sendTrafficUsedSummary(ctx, handler, totalSize);

        await notifyTrafficAfterResult(ctx,handler.localization,handler.keyboards,handler.logger);
        
    }
    
    public async deliverFallback(result:MergeResult,isAdmin:boolean,i18n:any):Promise<void>{
        
        const { ctx, handler } = this;

        await handler.logger.logAction('MergeAction:deliverFallback', ctx.from!, 'Merge fallback', `Chunks: ${result.paths?.length || 0}`);
        await ctx.reply(i18n.messages.actions.merge.merge_fallback, { parse_mode: 'HTML' });
        
        if(result.paths?.length){
            
            for(const chunkPath of result.paths){
                
                try{
                    
                    await ctx.replyWithDocument(new InputFile(chunkPath,path.basename(chunkPath)));
                    await handler.fileService.deleteFile(chunkPath);
                    
                }catch{}
                
            }
            
        }
        
        if(result.zipPath){
            
            await ctx.replyWithDocument(new InputFile(result.zipPath, path.basename(result.zipPath)), {
                caption:      i18n.messages.actions.merge.merge_zip_success,
                parse_mode:   'HTML',
                reply_markup: handler.keyboards.getMainMenu(isAdmin),
            });
            await handler.fileService.deleteFile(result.zipPath);
            
        }
        
    }
    
}
