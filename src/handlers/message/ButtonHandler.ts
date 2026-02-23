import type{ BotContext } from "../../types/BotContext.js";
import { LocalizationService } from "../../services/LocalizationService.js";
import { initialSession } from "../../types/SessionData.js";
import { PdfWorkerService } from "../../services/PdfWorkerService.js";
import { FileService } from "../../services/FileService.js";
import { InputFile } from "grammy";
import { FileNameUtils } from "../../utils/FileNameUtils.js";
import { Keyboards } from "../../services/Keyboards.js";
import type { IBotConfig } from "../../config/interfaces/IBotConfig.js";
import type { LocalApi } from "../../types/LocalApi.js";
import { LoggerService } from "../../services/LoggerService.js";
import { DatabaseService } from "../../services/DatabaseService.js";
import fs from 'fs';
import { SmartQueueService } from '../../services/SmartQueueService.js';
import { AdminLogService } from '../../services/AdminLogService.js';

export class ButtonHandler{
    
    private workerService:PdfWorkerService;
    private fileService:FileService;
    private keyboards:Keyboards;
    private logger:LoggerService;
    private db:DatabaseService;
    private adminLogService:AdminLogService;
    
    constructor(private readonly config:IBotConfig,private readonly localApi:LocalApi,private readonly localization:LocalizationService){
        
        this.keyboards = new Keyboards(this.localization);
        this.logger = new LoggerService(this.config);
        this.db = new DatabaseService(this.logger);
        this.workerService = new PdfWorkerService(this.config,SmartQueueService.getInstance(this.localization,this.db));
        this.fileService = new FileService(this.config,this.localApi);
        this.adminLogService = new AdminLogService(this.config);
        
    }
    
    async handle(ctx:BotContext){
        
        const text = ctx.message?.text;
        if(!text) return;
        
        const fullActionKey = this.localization.getActionKeyByText(text);
        if(!fullActionKey) return;
        
        const {lang} = this.localization.getUserLanguage(ctx.from?.language_code);
        await this.db.registerUser(ctx.from!.id, ctx.from!.username, ctx.from!.first_name,lang);
        
        await this.logger.logAction(ctx.from!, 'Button click',`Key: ${fullActionKey} | Text: ${text}`);
        
        if(fullActionKey.includes('adm_btn_')){
            
            if(ctx.from!.id !== this.config.adminId) return;
            
            if(fullActionKey.endsWith('adm_btn_stats')){
                
                await this.handleAdminStats(ctx,lang);
                
            }else if(fullActionKey.endsWith('adm_btn_logs')){
                
                await this.handleAdminLogs(ctx);
                
            }else if(fullActionKey.endsWith('adm_btn_reload')){
                
                await ctx.reply('Reload button coming soon');
                
            }
            
            return;
            
        }
        
        if(fullActionKey.endsWith('btn_status')){
            
            await this.handleStatus(ctx,lang);
            return;
            
        }
        
        if(fullActionKey.endsWith('btn_cancel') || text === '/cancel'){
            
            if(ctx.session.filePaths){
                
                for(const path of ctx.session.filePaths){
                    
                    await this.fileService.deleteFile(path);
                    
                }
                
            }
            
            ctx.session = initialSession();
            await ctx.reply("❌",{reply_markup:{remove_keyboard:true}});
            await ctx.reply(this.localization.t(lang,'messages.start'),{
                
                reply_markup:this.keyboards.getMainMenu(lang,ctx.from!.id === this.config.adminId)
                
            });
            return;
            
        }
        
        if(fullActionKey.endsWith('btn_help')){
            
            await ctx.reply(this.localization.t(lang,'messages.help'),{parse_mode:'HTML'});
            return;
            
        }
        
        const hasFile = ctx.session.filePaths && ctx.session.filePaths.length > 0;
        const localPath = hasFile ? ctx.session.filePaths[0] : null;
        const originalName = ctx.session.tempParams?.originalName || 'document.pdf';
        
        const fileRequiredButtons = [
            'btn_protect','btn_unlock','btn_split',
            'btn_convert','btn_extract','btn_watermark','btn_repair',
            'btn_to_long_image','btn_metadata_wiper','btn_merge'
        ];
        const isFileActions = fileRequiredButtons.some(k=>fullActionKey.endsWith(k));
        
        if(isFileActions && !hasFile){
            
            await ctx.reply(this.localization.t(lang,'messages.actions.file_lost'));
            return;
            
        }
        
        if(fullActionKey.endsWith('btn_unlock')){
            
            const statusMsg = await ctx.reply(this.localization.t(lang,'messages.actions.cracking'),{parse_mode:'HTML'});
            const sizeBytes = fs.statSync(localPath!).size;
            
            try{
                
                const crackResult = await this.workerService.crack(ctx,localPath!,sizeBytes);
                const stats = await fs.promises.stat(crackResult.path);
                await this.db.logAction(ctx.from!.id,'unlock',stats.size);
                
                const safeName = FileNameUtils.getSafeName(originalName,this.localization.t(lang,'messages.actions.suffix_unlocked'));
                
                await ctx.reply(this.localization.t(lang,'messages.actions.success_crack').replace('{{password}}',crackResult.password),{
                    parse_mode:'HTML'
                });
                
                await ctx.replyWithDocument(new InputFile(crackResult.path,safeName),{
                    reply_markup:this.keyboards.getMainMenu(lang,ctx.from!.id === this.config.adminId)
                });
                
                await this.fileService.deleteFile(crackResult.path);
                await this.fileService.deleteFile(localPath!);
                ctx.session = initialSession();
                
            }catch(e){
                
                await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
                
                await ctx.reply(this.localization.t(lang,'messages.actions.fail_manual'),{
                    
                    parse_mode:'HTML',
                    reply_markup:{force_reply:true}
                    
                });
                
                ctx.session.currentAction = 'unlock';
                ctx.session.step = 'waiting_for_password';
                
            }
            
            return;
            
        }
        
        // if(fullActionKey.endsWith('btn_compress')){
            
        //     if(!hasFile){
                
        //         ctx.session.currentAction = 'compress';
        //         await ctx.reply(this.localization.t(lang,'messages.actions.ask_compress'));
        //         return;
                
        //     }
            
        //     const statusMsg = await ctx.reply(this.localization.t(lang,'messages.actions.compressing'),{parse_mode:'HTML'});
            
        //     try{
                
        //         const resultPath = await this.workerService.compress(localPath!);
        //         await this.db.logAction(ctx.from!.id,'compress',0);
                
        //         const safeName = FileNameUtils.getSafeName(originalName,this.localization.t(lang,'suffix_compressed'));
                
        //         await ctx.replyWithDocument(new InputFile(resultPath,safeName),{
                    
        //             reply_markup:this.keyboards.getMainMenu(lang,ctx.from!.id === this.config.adminId)
                    
        //         });
                
        //         await this.fileService.deleteFile(resultPath);
        //         await this.fileService.deleteFile(localPath!);
        //         ctx.session = initialSession();
                
        //     }catch(e:any){
                
        //         await ctx.reply(`Error: ${e.message}`);
        //         await this.logger.error('Compress',e,{user:ctx.from!,message:ctx.message!});
                
        //     }finally{
                
        //         await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
                
        //     }
            
        //     return;
            
        // }
        
        if(fullActionKey.endsWith('btn_protect')){
            
            ctx.session.currentAction = 'protect';
            ctx.session.step = 'waiting_for_password';
            
            await ctx.reply(this.localization.t(lang,'messages.actions.ask_protect'),{
                parse_mode:'HTML',
                reply_markup:{force_reply:true}
            });
            
            return;
            
        }
        
        if(fullActionKey.endsWith('btn_repair')){
            
            if(!hasFile){
                
                await ctx.reply(this.localization.t(lang,'messages.actions.file_lost'));
                return;
                
            }
            
            const warningText = this.localization.t(lang,'messages.actions.repair_warning');
            const statusMsg = await ctx.reply(warningText,{parse_mode:'HTML'});
            const sizeBytes = fs.statSync(localPath!).size;
            try{
                
                const resultPath = await this.workerService.repair(ctx,localPath!,sizeBytes);
                const stats = await fs.promises.stat(resultPath);
                
                await this.db.logAction(ctx.from!.id,'repair',stats.size);
                await this.fileService.deleteFile(localPath!);
                
                ctx.session.filePaths = [resultPath];
                ctx.session.currentAction = 'ready';
                
                await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
                
                const originalName = ctx.session.tempParams?.originalName || 'document.pdf';
                const safeName = FileNameUtils.getSafeName(originalName, this.localization.t(lang,'messages.actions.suffix_repair'));
                
                const successText = this.localization.t(lang,'messages.actions.repair_success');
                
                await ctx.replyWithDocument(new InputFile(resultPath,safeName));
                
                await ctx.reply(successText,{
                    parse_mode:'HTML',
                    reply_markup:this.keyboards.getFileActionsMenu(lang)
                });
                
            }catch(e:any){
                
                await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
                const failText = this.localization.t(lang,'messages.actions.repair_fail');
                
                await ctx.reply(`${failText}\n\n<i>${this.localization.t(lang,'messages.common.technical_problem')} ${e.message}</i>`,{parse_mode:'HTML'});
                
                await this.logger.error('Repair',e,{user:ctx.from!,message:ctx.message!});
                
                await this.fileService.deleteFile(localPath!);
                ctx.session = initialSession();
                
            }
            
            return;
            
        }
        
         if(fullActionKey.endsWith('btn_split')){
            
            if(!hasFile){
                
                await ctx.reply(this.localization.t(lang,'messages.actions.file_lost'),{parse_mode:'HTML'});
                return;
                
            }
            
            ctx.session.currentAction = 'split';
            ctx.session.step = 'waiting_for_split_pages';
            
            await ctx.reply(this.localization.t(lang,'messages.actions.ask_split_pages'),{
                parse_mode:'HTML',
                reply_markup:{force_reply:true}
            });
            
            return;
            
         }
         
         if(fullActionKey.endsWith('btn_merge')){
            
            if(!hasFile){
                
                await ctx.reply(this.localization.t(lang,'messages.actions.file_lost'));
                return;
                
            }
            
            ctx.session.currentAction = 'merge';
            ctx.session.step = 'waiting_for_merge_files';
            
            await ctx.reply(this.localization.t(lang,'messages.actions.ask_merge_files'),{
                parse_mode:'HTML',
                reply_markup:{
                    
                    keyboard:[[{text:this.localization.t(lang,'buttons.files.btn_execute_merge')}]],
                    resize_keyboard:true
                    
                }
            });
            
            return;
            
         }
         
         if(fullActionKey.endsWith('btn_execute_merge') || text === this.localization.t(lang,'buttons.files.btn_execute_merge')){
            
            if(ctx.session.filePaths.length < 2){
                
                await ctx.reply(this.localization.t(lang,'messages.actions.merge_not_enough_files'));
                return;
                
            }
            
            const statusMsg = await ctx.reply(this.localization.t(lang,'messages.common.wait'),{parse_mode:'HTML'});
            
            try{
                
                let totalSize = 0;
                for(const p of ctx.session.filePaths) totalSize += fs.statSync(p).size;
                
                const resultPath = await this.workerService.merge(ctx, ctx.session.filePaths, totalSize);
                await this.db.logAction(ctx.from!.id, 'merge',totalSize);
                
                const originalName = ctx.session.tempParams?.originalName || 'Document.pdf';
                const safeName = FileNameUtils.getSafeName(originalName,'merged');
                
                await ctx.replyWithDocument(new InputFile(resultPath,safeName),{
                    reply_markup:this.keyboards.getMainMenu(lang,ctx.from!.id === this.config.adminId)
                });
                
                for(const p of ctx.session.filePaths) await this.fileService.deleteFile(p);
                await this.fileService.deleteFile(resultPath);
                ctx.session = initialSession();
                
            }catch(e:any){
                
                await this.logger.error('Merge',e,{user:ctx.from!});
                await ctx.reply(`Error: ${e.message}`);
                ctx.session = initialSession();
                
            }finally{
                
                await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
                
            }
            
            return;
            
         }
        
        await ctx.reply(this.localization.t(lang,'messages.common.in_development'),{parse_mode:'HTML'});
        await this.logger.logAction(ctx.from!,'Feature request',`Clicked dev feature: ${fullActionKey}`);
        
    }
    
    private async handleStatus(ctx:BotContext,lang:string){
        
        const userId = ctx.from!.id;
        const user = await this.db.getUser(userId);
        
        if(!user){
            
            await ctx.reply(this.localization.t(lang,'messages.status.error'));
            return;
            
        }
        
        const usedMB = (user.totalTrafficBytes / 1024 / 1024).toFixed(2);
        
        let maxStorage = this.localization.t(lang,'messages.status.subscriptions.free_storage');
        let role = this.localization.t(lang,'messages.status.subscriptions.no_sub');
        if(user.isVip){
            
            maxStorage = this.localization.t(lang,'messages.status.subscriptions.unlimited'); 
            role = this.localization.t(lang,'messages.status.subscriptions.vip_role');
        
        }else if(user.subType === 'pro'){
            
            maxStorage = this.localization.t(lang,'messages.status.subscriptions.pro_storage');
            role = this.localization.t(lang,'messages.status.subscriptions.pro_role');
        }else if(user.subType === 'premium'){
            
            maxStorage = this.localization.t(lang,'messages.status.subscriptions.premium_storage');
            role = this.localization.t(lang,'messages.status.subscriptions.premium_role');
            
        }else if(user.subType === 'enterprise'){
            
            maxStorage = this.localization.t(lang,'messages.status.subscriptions.enterprise_storage');
            role = this.localization.t(lang,'messages.status.subscription.premium_role');
        }else if(user.subType === 'sovereign_protocol'){
            
            maxStorage = this.localization.t(lang,'messages.status.subscriptions.sovereign_protocol_storage');
            role = this.localization.t(lang,'messages.status.subscription.sovereign_protocol_role');
            
        }
        
        let myStats = '';
        const userActions = Object.entries(user.stats || {}).sort((a,b)=>(b[1] as number) - (a[1] as number));
        
        if(userActions.length === 0){
            
            myStats = this.localization.t(lang,'messages.status.empty');
            
        }else{
            
            for(const [ action,count] of userActions){
                
                const translationKey = `messages.status.actions.${action}`;
                let actionLabel = this.localization.t(lang,translationKey);
                
                if(actionLabel.includes('MISSING')){
                    
                    actionLabel = this.capitalize(action);
                    
                }
                
                myStats += `${actionLabel}: <b>${count}</b>\n`;
                
            }
            
        }
        
        const subEnd = user.subExpiresAt > 0 ? new Date(user.subExpiresAt).toLocaleDateString() : this.localization.t(lang,'messages.status.subscriptions.no_sub');
        
        const msg = this.localization.t(lang, 'messages.status.user.title') +
                    `📛 <b>${this.localization.t(lang, 'messages.status.user.name')}:</b> ${user.firstName}\n` +
                    `🏷 <b>${this.localization.t(lang, 'messages.status.user.role')}:</b> ${role}\n` +
                    `💾 <b>${this.localization.t(lang, 'messages.status.user.usage')}:</b> ${usedMB} MB / ${maxStorage}\n\n` +
                    `📊 <b>${this.localization.t(lang, 'messages.status.user.stats')}:</b>\n` +
                    myStats + 
                    `\n💳 <b>${this.localization.t(lang, 'messages.status.user.plan')}:</b> ${user.subPeriod || subEnd}`;
        await ctx.reply(msg,{parse_mode:'HTML'});
        
    }
    
    private async handleAdminStats(ctx:BotContext,lang:string){
        
        const global = await this.db.getGlobalStats(this.config.adminId);
        const counts = await this.db.getUserCounts();
        const totalGB = (global.traffic / 1024 / 1024 / 1024).toFixed(2);
        
        let actionStats = '';
        const sortedActions = Object.entries(global.actions).sort((a,b)=>(b[1] as number) - (a[1] as number));
        
        if(sortedActions.length === 0){
            
            actionStats = this.localization.t(lang,'messages.status.empty');
            
        }else{
            
            for(const [action,count] of sortedActions){
                
                const translationKey = `messages.status.actions.${action}`;
                let actionLabel = this.localization.t(lang,translationKey);
                
                if(actionLabel.includes('MISSING')){
                    
                    actionLabel = this.capitalize(action);
                    
                }
                
                actionStats += `${actionLabel}: <b>${count}</b>`;
                
            }
            
        }
        
        const msg = this.localization.t(lang, 'messages.status.admin.title') +
                    `👥 <b>Users:</b> ${counts.total} (🟢 ${counts.active})\n\n` +
                    `📊 <b>${this.localization.t(lang, 'messages.status.admin.global_stats')}:</b>\n` +
                    actionStats + 
                    `\n💾 <b>${this.localization.t(lang, 'messages.status.admin.traffic')}:</b> ${totalGB} GB\n\n` +
                    `💎 <b>${this.localization.t(lang, 'messages.status.admin.subs')}:</b> VIP:${counts.subscribers.vip} | Pro:${counts.subscribers.pro} | Premium:${counts.subscribers.premium} | Enterprise:${counts.subscribers.enterprise} | Sovereign Protocol: ${counts.subscribers.sovereign}`;
        await ctx.reply(msg,{parse_mode:'HTML'});
        
    }
    
    private async handleAdminLogs(ctx:BotContext){
        
        const statusMsg = await ctx.reply('📦 <b>Collecting logs from server...</b>',{parse_mode:'HTML'});
        
        let archivePath:string | null = null;
        
        try{
            
            const {archivePath:ap,report} = await this.adminLogService.collectAndArchive();
            archivePath = ap;
            
            await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
            
            await ctx.reply(report,{parse_mode:'HTML'});
            
            const archiveName = `server_logs_${new Date().toISOString().slice(0,10)}.zip`;
            await ctx.replyWithDocument(
                new InputFile(archivePath,archiveName),{
                    caption: `🗂 <b>Server logs</b> | ${new Date().toLocaleString('en-US',{timeZone:'Asia/Jerusalem'})}`,
                    parse_mode:'HTML'
                }
            );
            
        }catch(e:any){
            
            await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
            await ctx.reply(`❌ <b>Error collecting logs:</b>\n<code>${e.message}</code>`,{parse_mode:'HTML'});
            await this.logger.error('AdminLogs',e as Error);
            
        }finally{
            
            if(archivePath){
                
                try{fs.unlinkSync(archivePath);}catch{}
                
            }
            
        }
        
    }
    
    private capitalize(s:string){
        
        return s.charAt(0).toUpperCase() + s.slice(1);
        
    }
    
}
