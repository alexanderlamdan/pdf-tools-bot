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
import type { Locale } from '../../locales/index.js';
import {locales} from '../../locales/index.js';
import { notifyTrafficAfterResult } from '../../utils/TrafficNotifier.js';
import { getPaymentLink } from '../../utils/SubscriptionUtils.js';

export class ButtonHandler{
    
    private workerService:PdfWorkerService;
    private fileService:FileService;
    private keyboards:Keyboards;
    private logger:LoggerService;
    private db:DatabaseService;
    private adminLogService:AdminLogService;
    private readonly locale:Locale;
    
    constructor(private readonly config:IBotConfig,private readonly localApi:LocalApi,private readonly localization:LocalizationService){
        
        this.keyboards = new Keyboards(this.localization);
        this.logger = new LoggerService(this.config);
        this.db = new DatabaseService(this.logger);
        this.workerService = new PdfWorkerService(this.config,SmartQueueService.getInstance(this.localization,this.db));
        this.fileService = new FileService(this.config,this.localApi);
        this.adminLogService = new AdminLogService(this.config);
        this.locale = locales;
        
    }
    
    async handle(ctx:BotContext){
        
        const text = ctx.message?.text;
        if(!text) return;
        
        const {lang} = this.localization.getUserLanguage(ctx.from?.language_code);
        const i18n = this.localization.get(lang);
        await this.db.registerUser(ctx.from!.id, ctx.from!.username, ctx.from!.first_name,lang);
        
        const subscriptionPlan = this.localization.getSubscriptionPlanByButton(text);
        if(subscriptionPlan){
            
            await this.handleSubscriptionInfo(ctx,lang,subscriptionPlan);
            return;
            
        }
        
        
        if(text === i18n.buttons.common.btn_cancel || text === '/cancel'){
            
            await this.logger.logAction('ButtonHandler', ctx.from!, 'Cancel', 'Session cleared');
            
            if(ctx.session.filePaths){
                
                for(const path of ctx.session.filePaths){
                    
                    await this.fileService.deleteFile(path);
                    
                }
                
            }
            
            ctx.session = initialSession();
            await ctx.reply("❌",{reply_markup:{remove_keyboard:true}});
            await ctx.reply(i18n.messages.start,{
                
                reply_markup:this.keyboards.getMainMenu(lang,ctx.from!.id === this.config.adminId)
                
            });
            return;
            
        }
        
        const isAdminAction = Object.values(i18n.buttons.admin || {}).includes(text as any);
        
        if(isAdminAction){
            
            if(ctx.from!.id !== this.config.adminId) return;
            
            if(text === i18n.buttons.admin.adm_btn_stats){
                
                await this.logger.logAction('ButtonHandler', ctx.from!, 'Admin action', 'Stats requested');
                await this.handleAdminStats(ctx,lang);
                
            }else if(text === i18n.buttons.admin.adm_btn_logs){
                
                await this.logger.logAction('ButtonHandler', ctx.from!, 'Admin action', 'Logs requested');
                await this.handleAdminLogs(ctx);
                
            }else if(text === i18n.buttons.admin.adm_btn_reload){
                
                
                await this.logger.logAction('ButtonHandler', ctx.from!, 'Admin action', 'Reload (not implemented)');
                await ctx.reply('Reload button coming soon');
                
            }
            
            return;
            
        }
        
        if(text === i18n.buttons.main.btn_status){
            
            await this.logger.logAction('ButtonHandler', ctx.from!, 'Status check', 'User requested status');
            await this.handleStatus(ctx,lang);
            return;
            
        }
        
        if(text === i18n.buttons.main.btn_help){
            
            await this.logger.logAction('ButtonHandler', ctx.from!, 'Help', 'Help message shown');
            await ctx.reply(i18n.messages.help,{parse_mode:'HTML'});
            return;
            
        }
        
        const hasFile = ctx.session.filePaths && ctx.session.filePaths.length > 0;
        const localPath = hasFile ? ctx.session.filePaths[0] : null;
        const originalName = ctx.session.tempParams?.originalName || 'document.pdf';
        
        const isFileAction = Object.values(i18n.buttons.files || {}).includes(text as any);
        
        if(isFileAction && !hasFile){
            
            await ctx.reply(i18n.messages.actions.file_lost);
            return;
            
        }
        
        if(text === i18n.buttons.files.btn_unlock){
            
            await this.logger.logAction('ButtonHandler', ctx.from!, 'Unlock (auto-crack)', `File: ${originalName}`);

            const statusMsg = await ctx.reply(i18n.messages.actions.cracking,{parse_mode:'HTML'});
            const sizeBytes = fs.statSync(localPath!).size;
            
            try{
                
                const crackResult = await this.workerService.crack(ctx,localPath!,sizeBytes);
                const stats = await fs.promises.stat(crackResult.path);
                await this.db.logAction(ctx.from!.id,'unlock',stats.size);
                
                const safeName = FileNameUtils.getSafeName(originalName,i18n.messages.actions.suffix_unlocked);
                
                
                await this.logger.logAction('ButtonHandler', ctx.from!, 'Unlock result', `File: ${originalName}`, 'Success — password found');
                
                await ctx.reply(i18n.messages.actions.success_crack.replace('{{password}}',crackResult.password),{
                    parse_mode:'HTML'
                });
                
                await ctx.replyWithDocument(new InputFile(crackResult.path,safeName),{
                    reply_markup:this.keyboards.getMainMenu(lang,ctx.from!.id === this.config.adminId)
                });
                
                await this.fileService.deleteFile(crackResult.path);
                await this.fileService.deleteFile(localPath!);
                
                await notifyTrafficAfterResult(ctx, lang, this.localization, this.keyboards, this.logger);
                
                ctx.session = initialSession();
                
            }catch(e){
                
                
                await this.logger.logAction('ButtonHandler', ctx.from!, 'Unlock result', `File: ${originalName}`, 'Failed — asking manual password');

                await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
                
                await ctx.reply(i18n.messages.actions.fail_manual,{
                    
                    parse_mode:'HTML',
                    reply_markup:{force_reply:true}
                    
                });
                
                ctx.session.currentAction = 'unlock';
                ctx.session.step = 'waiting_for_password';
                
            }
            
            return;
            
        }
        
        // if(text === i18n.buttons.files.btn_compress){
            
        //     if(!hasFile){
                
        //         ctx.session.currentAction = 'compress';
        //         await ctx.reply(i18n.messages.actions.ask_compress);
        //         return;
                
        //     }
            
        //     const statusMsg = await ctx.reply(i18n.messages.actions.compressing,{parse_mode:'HTML'});
            
        //     try{
                
        //         const resultPath = await this.workerService.compress(localPath!);
        //         await this.db.logAction(ctx.from!.id,'compress',0);
                
        //         const safeName = FileNameUtils.getSafeName(originalName,i18n.messages.actions.suffix_compressed);
                
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
        
        if(text === i18n.buttons.files.btn_protect){
            
            await this.logger.logAction('ButtonHandler', ctx.from!, 'Protect', `File: ${originalName} — waiting for password`);
            
            ctx.session.currentAction = 'protect';
            ctx.session.step = 'waiting_for_password';
            
            await ctx.reply(i18n.messages.actions.ask_protect,{
                parse_mode:'HTML',
                reply_markup:{force_reply:true}
            });
            
            return;
            
        }
        
        if(text === i18n.buttons.files.btn_repair){
            
            if(!hasFile){
                
                await ctx.reply(i18n.messages.actions.file_lost);
                return;
                
            }
            await this.logger.logAction('ButtonHandler', ctx.from!, 'Repair', `File: ${originalName}`);
            const warningText = i18n.messages.actions.repair_warning;
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
                const safeName = FileNameUtils.getSafeName(originalName, i18n.messages.actions.suffix_repair);
                
                await this.logger.logAction('ButtonHandler', ctx.from!, 'Repair result', `File: ${originalName}`, 'Success');
                const successText = i18n.messages.actions.repair_success;
                
                await ctx.replyWithDocument(new InputFile(resultPath,safeName));
                
                await ctx.reply(successText,{
                    parse_mode:'HTML',
                    reply_markup:this.keyboards.getFileActionsMenu(lang)
                });
                
                await notifyTrafficAfterResult(ctx, lang, this.localization, this.keyboards, this.logger);
                
            }catch(e:any){
                
                await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
                const failText = i18n.messages.actions.repair_fail;
                
                await ctx.reply(`${failText}\n\n<i>${i18n.messages.common.technical_problem} ${e.message}</i>`,{parse_mode:'HTML'});
                
                await this.logger.error('Repair',e,{user:ctx.from!,message:ctx.message!});
                
                await this.fileService.deleteFile(localPath!);
                ctx.session = initialSession();
                
            }
            
            return;
            
        }
        
         if(text === i18n.buttons.files.btn_split){
            
            if(!hasFile){
                
                await ctx.reply(i18n.messages.actions.file_lost,{parse_mode:'HTML'});
                return;
                
            }
            
            await this.logger.logAction('ButtonHandler', ctx.from!, 'Split', `File: ${originalName} — waiting for pages`);
            
            ctx.session.currentAction = 'split';
            ctx.session.step = 'waiting_for_split_pages';
            
            await ctx.reply(i18n.messages.actions.ask_split_pages,{
                parse_mode:'HTML',
                reply_markup:{force_reply:true}
            });
            
            return;
            
         }
         
         if(text === i18n.buttons.files.btn_merge){
            
            if(!hasFile){
                
                await ctx.reply(i18n.messages.actions.file_lost);
                return;
                
            }
            
            await this.logger.logAction('ButtonHandler', ctx.from!, 'Merge', `File: ${originalName} — waiting for more files`);
            ctx.session.currentAction = 'merge';
            ctx.session.step = 'waiting_for_merge_files';
            
            await ctx.reply(i18n.messages.actions.ask_merge_files,{
                parse_mode:'HTML',
                reply_markup:{
                    
                    keyboard:[[{text:i18n.buttons.files.btn_execute_merge}]],
                    resize_keyboard:true
                    
                }
            });
            
            return;
            
         }
         
         if(text === i18n.buttons.files.btn_execute_merge){
            
            if(ctx.session.filePaths.length < 2){
                
                await ctx.reply(i18n.messages.actions.merge_not_enough_files);
                return;
                
            }
            await this.logger.logAction('ButtonHandler', ctx.from!, 'Merge execute', `Files: ${ctx.session.filePaths.length}`);
            const statusMsg = await ctx.reply(i18n.messages.common.wait,{parse_mode:'HTML'});
            
            try{
                
                let totalSize = 0;
                for(const p of ctx.session.filePaths) totalSize += fs.statSync(p).size;
                
                const resultPath = await this.workerService.merge(ctx, ctx.session.filePaths, totalSize);
                await this.db.logAction(ctx.from!.id, 'merge',totalSize);
                
                const originalName = ctx.session.tempParams?.originalName || 'Document.pdf';
                const safeName = FileNameUtils.getSafeName(originalName,'merged');
                
                await this.logger.logAction('ButtonHandler', ctx.from!, 'Merge result', `Files merged: ${ctx.session.filePaths.length}`, 'Success');
                
                await ctx.replyWithDocument(new InputFile(resultPath,safeName),{
                    reply_markup:this.keyboards.getMainMenu(lang,ctx.from!.id === this.config.adminId)
                });
                
                for(const p of ctx.session.filePaths) await this.fileService.deleteFile(p);
                await this.fileService.deleteFile(resultPath);
                
                await notifyTrafficAfterResult(ctx, lang, this.localization, this.keyboards, this.logger);
                
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
        
         await this.logger.logAction('ButtonHandler', ctx.from!, 'Unhandled button', `Text: ${text}`, 'Feature in development');
         await ctx.reply(i18n.messages.common.in_development,{parse_mode:'HTML'});
        
    }
    
    private async handleSubscriptionInfo(ctx:BotContext,lang:string,plan:'pro'|'premium'|'enterprise'){
        
        const i18n = this.localization.get(lang);
        const paymentLink = getPaymentLink(lang,plan);
        
        const planText = (i18n.messages.subscription.plans as any)[plan] as string;
        const buyText = i18n.buttons.subscription.buy.replace('{{name}}',this.capitalize(plan));
        
        await this.logger.logAction(
            'ButtonHandler',
            ctx.from!,
            'Subscription info viewed',
            `Plan: ${plan} | Lang: ${lang}`
        );
        
        await ctx.reply(planText,{
            
            parse_mode:'HTML',
            reply_markup:{
                inline_keyboard:[[
                    {
                        text:`💳 ${buyText}`,
                        url:paymentLink
                    }
                ]]
            }
            
        });
        
    }
    
    private async handleStatus(ctx:BotContext,lang:string){
        
        const userId = ctx.from!.id;
        const user = await this.db.getUser(userId);
        const i18n = this.localization.get(lang);
        if(!user){
            
            await ctx.reply(i18n.messages.status.error);
            return;
            
        }
        
        const usedMB = (user.totalTrafficBytes / 1024 / 1024).toFixed(2);
        
        let maxStorage = i18n.messages.status.subscriptions.free_storage;
        let role = i18n.messages.status.subscriptions.no_sub;
        if(user.isVip){
            
            maxStorage = i18n.messages.status.subscriptions.unlimited; 
            role = i18n.messages.status.subscriptions.vip_role;
        
        }else if(user.subType === 'pro'){
            
            maxStorage = i18n.messages.status.subscriptions.pro_storage;
            role = i18n.messages.status.subscriptions.pro_role;
        }else if(user.subType === 'premium'){
            
            maxStorage = i18n.messages.status.subscriptions.premium_storage;
            role = i18n.messages.status.subscriptions.premium_role;
            
        }else if(user.subType === 'enterprise'){
            
            maxStorage = i18n.messages.status.subscriptions.enterprise_storage;
            role = i18n.messages.status.subscriptions.premium_role;
        }else if(user.subType === 'sovereign_protocol'){
            
            maxStorage = i18n.messages.status.subscriptions.sovereign_protocol_storage;
            role = i18n.messages.status.subscriptions.sovereign_protocol_role;
            
        }
        
        let myStats = '';
        const userActions = Object.entries(user.stats || {}).sort((a,b)=>(b[1] as number) - (a[1] as number));
        
        if(userActions.length === 0){
            
            myStats = i18n.messages.status.empty;
            
        }else{
            
            for(const [ action,count] of userActions){
                
                
                const actionLabel = (i18n.messages.status as any).actions?.[action] || this.capitalize(action);
                myStats += `${actionLabel}: <b>${count}</b>\n`;
                
            }
            
        }
        
        const subEnd = user.subExpiresAt > 0 ? new Date(user.subExpiresAt).toLocaleDateString() : i18n.messages.status.subscriptions.no_sub;
        
        const msg = i18n.messages.status.user.title +
                    `📛 <b>${i18n.messages.status.user.name}:</b> ${user.firstName}\n` +
                    `🏷 <b>${i18n.messages.status.user.role}:</b> ${role}\n` +
                    `💾 <b>${i18n.messages.status.user.usage}:</b> ${usedMB} MB / ${maxStorage}\n` +
                    `📊 <b>${i18n.messages.status.user.stats}:</b>\n` +
                    myStats + 
                    `\n💳 <b>${i18n.messages.status.user.plan}:</b> ${user.subPeriod || subEnd}`;
        await ctx.reply(msg,{parse_mode:'HTML'});
        
    }
    
    private async handleAdminStats(ctx:BotContext,lang:string){
        
        const global = await this.db.getGlobalStats(this.config.adminId);
        const counts = await this.db.getUserCounts();
        const totalGB = (global.traffic / 1024 / 1024 / 1024).toFixed(2);
        const i18n = this.localization.get(lang);
        let actionStats = '';
        const sortedActions = Object.entries(global.actions).sort((a,b)=>(b[1] as number) - (a[1] as number));
        
        if(sortedActions.length === 0){
            
            actionStats = i18n.messages.status.empty;
            
        }else{
            
            for(const [action,count] of sortedActions){
                
                let actionLabel = (i18n.messages.status as any).action?.[action] || this.capitalize(action);
                
                actionStats += `${actionLabel}: <b>${count}</b>`;
                
            }
            
        }
        
        const msg = i18n.messages.status.admin.title +
                    `👥 <b>Users:</b> ${counts.total} (🟢 ${counts.active})\n\n` +
                    `📊 <b>${i18n.messages.status.admin.global_stats}:</b>\n` +
                    actionStats + 
                    `\n💾 <b>${i18n.messages.status.admin.traffic}:</b> ${totalGB} GB\n\n` +
                    `💎 <b>${i18n.messages.status.admin.subs}:</b> VIP:${counts.subscribers.vip} | Pro:${counts.subscribers.pro} | Premium:${counts.subscribers.premium} | Enterprise:${counts.subscribers.enterprise} | Sovereign Protocol: ${counts.subscribers.sovereign}`;
        await ctx.reply(msg,{parse_mode:'HTML'});
        
    }
    
    private async handleAdminLogs(ctx:BotContext){
        
        const statusMsg = await ctx.reply('📦 Collecting logs from server...');
        
        let archivePath:string | null = null;
        
        try{
            
            const {archivePath:ap,report} = await this.adminLogService.collectAndArchive();
            archivePath = ap;
            
            await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
            
            await ctx.reply(report);
            
            const archiveName = `server_logs_${new Date().toISOString().slice(0,10)}.zip`;
            await ctx.replyWithDocument(
                new InputFile(archivePath,archiveName),{
                    caption: `🗂 Server logs | ${new Date().toLocaleString('en-US',{timeZone:'Asia/Jerusalem'})}`
                }
            );
            
        }catch(e:any){
            
            await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
            const safeMsg = String(e.message || e).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
            await ctx.reply(`❌ Error collecting logs:\n${safeMsg}`);
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
