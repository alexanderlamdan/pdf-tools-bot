import type {BotContext} from '../../types/BotContext.js';
import {InputFile} from 'grammy';
import {initialSession} from '../../types/SessionData.js';
import {BaseHandler} from '../base/BaseHandler.js';
import {RepairAction} from './actions/RepairAction.js';
import {MergeAction} from './actions/MergeAction.js';
import {UnlockAction} from './actions/UnlockAction.js';
import {MetadataAction} from './actions/MetadataAction.js';
import { AdminLogService } from '../../services/AdminLogService.js';
import {getPaymentLink} from '../../utils/SubscriptionUtils.js';
import { notifyTrafficAfterResult } from '../../utils/TrafficNotifier.js';
import { FileNameUtils } from '../../utils/FileNameUtils.js';
import fs from 'fs';
import {OutgoingMessage} from 'http';

export class ButtonHandler extends BaseHandler{
    
    private readonly adminLogService:AdminLogService;
    
    constructor(...args:ConstructorParameters<typeof BaseHandler>){
        
        super(...args);
        this.adminLogService = new AdminLogService(this.config);
        
    }
    
    async handle(ctx:BotContext):Promise<void>{
        
        const text = ctx.message?.text;
        if(!text) return;
        
        const lang = this.getLang(ctx);
        const i18n = this.getI18n(ctx);
        const isAdmin = this.isAdmin(ctx);
        
        await this.registerUser(ctx);
        
        const plan = this.localization.getSubscriptionPlanByButton(text);
        
        if(plan){
            
            await this.handleSubscriptionInfo(ctx,lang,plan);
            return;
            
        }
        
        if(text === i18n.buttons.common.btn_cancel || text === '/cancel'){
            
            await this.handleCancel(ctx,lang,i18n);
            return;
        }
        
        if(Object.values(i18n.buttons.admin || {}).includes(text as any)){
            
            if(!isAdmin) return;
            await this.handleAdminButton(ctx,lang,i18n,text);
            return;
            
        }
        
        if(text === i18n.buttons.main.btn_status){
            
            await this.logger.logAction('ButtonHandler', ctx.from!, 'Status','');
            await this.handleStatus(ctx,lang);
            return;
            
        }
        
        if(text === i18n.buttons.main.btn_help){
            
            await ctx.reply(i18n.messages.help,{parse_mode:'HTML'});
            return;
            
        }
        
        const hasFile = ctx.session.filePaths.length > 0;
        const isFileBtn = Object.values(i18n.buttons.files || {}).includes(text as any);
        
        if(isFileBtn && !hasFile){
            
            await ctx.reply(i18n.messages.actions.file_lost);
            return;
            
        }
        
        await this.dispatch(ctx,lang,i18n,text, isAdmin);
        
    }
    
    private async dispatch(ctx:BotContext,lang:string,i18n:any,text:string,isAdmin:boolean):Promise<void>{
        
        const btn = i18n.buttons.files;
        const merge = new MergeAction(ctx,this);
        
        switch(true){
            
            case text === btn.btn_compress:
                await this.handleCompress(ctx, lang, i18n);
                break;

            case text === btn.btn_unlock:
                await new UnlockAction(ctx,this).execute();
                break;
            
            case text === btn.btn_protect:
                await this.logger.logAction('ButtonHandler', ctx.from!, 'Protect', 'Waiting for password');
                ctx.session.currentAction = 'protect';
                ctx.session.step = 'waiting_for_password';
                await ctx.reply(i18n.messages.actions.ask_protect,{
                    parse_mode:'HTML',
                    reply_markup:{force_reply:true}
                });
                break;
            
            case text ===  btn.btn_repair:
                await new RepairAction(ctx,this).execute();
                break;
            
            case text === btn.btn_split:
                await this.logger.logAction('ButtonHandler', ctx.from!, 'Split', 'Waiting for pages');
                ctx.session.currentAction = 'split';
                ctx.session.step = 'waiting_for_split_pages';
                await ctx.reply(i18n.messages.actions.ask_split_pages,{
                    
                    parse_mode:'HTML',
                    reply_markup:{force_reply:true}
                    
                });
                break;
                
            case text === btn.btn_merge:
                await merge.showModeMenu();
                break;
            
            case text === btn.btn_merge_one_by_one:
                await merge.startOneByOne();
                break;
            
            case text === btn.btn_merge_archive:
                await merge.startArchiveMode();
                break;
            
            case text === btn.btn_merge_bulk:
                await merge.startBulkMode();
                break;
            
            case text === btn.btn_execute_merge:
                await merge.execute();
                break;
            case text === btn.btn_metadata_wiper:
                await new MetadataAction(ctx,this).showAndAskConfirm();
                break;
            default:
                await this.logger.logAction('ButtonHandler', ctx.from!, 'Unhandled button', text, 'In development');
                await ctx.reply(i18n.messages.common.in_development, { parse_mode: 'HTML' });
            
        }
        
    }
    
    private async handleCancel(ctx:BotContext,lang:string,i18n:any):Promise<void>{
        
        await this.logger.logAction('ButtonHandler', ctx.from!, 'Cancel', 'Session cleared');
        
        for(const p of ctx.session.filePaths) await this.fileService.deleteFile(p);
        ctx.session = initialSession();
        
        await ctx.reply('❌',{reply_markup:{remove_keyboard:true}});
        await ctx.reply(i18n.messages.start,{
            
            reply_markup:this.keyboards.getMainMenu(lang,this.isAdmin(ctx))
            
        });
        
    }
    
    private async handleAdminButton(ctx:BotContext,lang:string,i18n:any,text:string):Promise<void>{
        
        const btn = i18n.buttons.admin;
        if(text === btn.adm_btn_stats){
            
            await this.logger.logAction('ButtonHandler', ctx.from!, 'Admin', 'Stats');
            await this.handleAdminStats(ctx,lang);
            
        }else if(text === btn.adm_btn_logs){
            
            await this.logger.logAction('ButtonHandler', ctx.from!, 'Admin', 'Logs');
            await this.handleAdminLogs(ctx);
            
        }else{
            
            await ctx.reply('Unknown admin command');
            
        }
        
    }
    
    private async handleSubscriptionInfo(ctx:BotContext,lang:string,plan:'pro'|'premium'|'enterprise'):Promise<void>{
        
        const i18n = this.getI18n(ctx);
        const paymentLink = getPaymentLink(lang,plan);
        const planText = (i18n.messages.subscription.plans as any)[plan] as string;
        const buyText = i18n.buttons.subscription.buy.replace('{{name}}',this.capitalize(plan));
        
        await this.logger.logAction('ButtonHandler', ctx.from!, 'Subscription viewed', `Plan: ${plan}`);
        
        await ctx.reply(planText, {
            parse_mode:   'HTML',
            reply_markup: {
                inline_keyboard: [[{ text: `💳 ${buyText}`, url: paymentLink }]],
            },
        });
        
    }
    
    private async handleStatus(ctx:BotContext,lang:string):Promise<void>{
        
        const i18n = this.getI18n(ctx);
        const userId = ctx.from!.id;
        const user = await this.db.getUser(userId);
        
        if(!user){
            
            await ctx.reply(i18n.messages.status.error);
            return;
            
        }
        
        const usedMB = (user.totalTrafficBytes / 1024 / 1024).toFixed(2);
        const isAdmin = this.isAdmin(ctx);
        const subs = i18n.messages.status.subscriptions;
        
        const roleMap: Record<string, [string, string]> = {
            vip: [subs.vip_role, subs.unlimited],
            pro: [subs.pro_role, subs.pro_storage],
            premium: [subs.premium_role, subs.premium_storage],
            enterprise: [subs.enterprise_role, subs.enterprise_storage],
            sovereign_protocol:[subs.sovereign_protocol_role, subs.sovereign_protocol_storage],
        };
        
        const subKey = user.isVip ? 'vip' : (user.subType || '');
        const [role, maxStorage] = roleMap[subKey] ?? [subs.no_sub,subs.free_storage];
        const displayRole = isAdmin ? subs.free_admin_role : role;
        
        const userActions = Object.entries(user.stats || {}).sort((a,b)=>(b[1] as number) - (a[1] as number));
        
        let myStats = userActions.length === 0 ? i18n.messages.status.empty : userActions.map(([action,count])=>{
            
            const label = (i18n.messages.status as any).actions?.[action] || this.capitalize(action);
            return `${label}: <b>${count}</b>`;
            
        }).join('\n');
        
        const subEnd = user.subExpiresAt > 0 ? new Date(user.subExpiresAt).toLocaleDateString() : subs.no_sub;
        
        const msg = i18n.messages.status.user.title
            + `📛 <b>${i18n.messages.status.user.name}:</b> ${user.firstName}\n`
            + `🏷 <b>${i18n.messages.status.user.role}:</b> ${displayRole}\n`
            + `💾 <b>${i18n.messages.status.user.usage}:</b> ${usedMB} MB / ${maxStorage}\n`
            + `📊 <b>${i18n.messages.status.user.stats}:</b>\n`
            + myStats + `\n`
            + `💳 <b>${i18n.messages.status.user.plan}:</b> ${user.subPeriod || subEnd}`;
        
        await ctx.reply(msg,{parse_mode:'HTML'});
    }
    
    private async handleAdminStats(ctx:BotContext,lang:string):Promise<void>{
        
        const i18n = this.getI18n(ctx);
        const global = await this.db.getGlobalStats(this.config.adminId);
        const counts = await this.db.getUserCounts();
        const totalGB = (global.traffic / 1024 / 1024 / 1024).toFixed(2);
        
        const sortedActions = Object.entries(global.actions).sort((a,b)=>(b[1] as number) - (a[1] as number));
        
        const actionStats = sortedActions.length === 0
            ? i18n.messages.status.empty
            : sortedActions.map(([action, count]) => {
                const label = (i18n.messages.status as any).action?.[action] || this.capitalize(action);
                return `${label}: <b>${count}</b>`;
              }).join('');

        const msg = i18n.messages.status.admin.title
            + `👥 <b>Users:</b> ${counts.total} (🟢 ${counts.active})\n\n`
            + `📊 <b>${i18n.messages.status.admin.global_stats}:</b>\n${actionStats}`
            + `\n💾 <b>${i18n.messages.status.admin.traffic}:</b> ${totalGB} GB\n\n`
            + `💎 <b>${i18n.messages.status.admin.subs}:</b> `
            + `VIP:${counts.subscribers.vip} | Pro:${counts.subscribers.pro} | Premium:${counts.subscribers.premium} | Enterprise:${counts.subscribers.enterprise} | Sovereign:${counts.subscribers.sovereign}`;
        
        await ctx.reply(msg,{parse_mode:'HTML'});
        
    }
    
    private async handleAdminLogs(ctx:BotContext):Promise<void>{
        
        const statusMsg = await ctx.reply('📦 Collecting logs from server...');
        let archivePath:string|null = null;
        
        try{
            
            const {archivePath:ap,report} = await this.adminLogService.collectAndArchive();
            archivePath = ap;
            
            await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
            await ctx.reply(report);
            
            const archiveName = `server_logs_${new Date().toISOString().slice(0, 10)}.zip`;
            await ctx.replyWithDocument(new InputFile(archivePath,archiveName),{
                
                caption:`🗂 Server logs | ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' })}`
                
            });
            
        }catch(e:any){
            
            await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
            const safeMsg = String(e.message || e).replace(/&/g,'&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            await ctx.reply(`❌ Error collecting logs:\n${safeMsg}`);
            await this.logger.error('AdminLogs', e as Error);
            
        }finally{
            
            if(archivePath)try{fs.unlinkSync(archivePath);}catch{}
            
        }
        
    }
    
    private capitalize(s:string):string{
        
        return s.charAt(0).toUpperCase() + s.slice(1);
        
    }
    
    private async handleCompress(ctx:BotContext, lang:string, i18n:any):Promise<void>{

        const localPath = ctx.session.filePaths[0];
        const originalName = ctx.session.tempParams?.originalName || 'document.pdf';

        await this.logger.logAction('ButtonHandler:handleCompress', ctx.from!, 'Compress', `File: ${originalName}`);

        const statusMsg = await ctx.reply(i18n.messages.actions.compressing, {parse_mode:'HTML'});

        try{

            const sizeBytes = fs.statSync(localPath).size;
            const result = await this.worker.compress(ctx, localPath, sizeBytes);

            await this.db.logAction(ctx.from!.id, 'compress', result.compressedSize || sizeBytes);
            await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(()=>{});

            // Файл уже оптимален — возвращаем оригинал
            if(result.alreadyOptimal){
                await ctx.reply(i18n.messages.queue.compress_already_optimal, {parse_mode:'HTML'});
                await ctx.reply(i18n.messages.actions.repair_success, {
                    parse_mode: 'HTML',
                    reply_markup: this.keyboards.getFileActionsMenu(lang)
                });
                return;
            }

            const safeName = FileNameUtils.getSafeName(originalName, i18n.messages.actions.suffix_compressed);
            const beforeMB = (result.originalSize / 1024 / 1024).toFixed(2);
            const afterMB  = (result.compressedSize / 1024 / 1024).toFixed(2);
            const savedMB  = (result.savedBytes / 1024 / 1024).toFixed(2);

            await this.fileService.deleteFile(localPath);
            ctx.session.filePaths     = [result.path];
            ctx.session.currentAction = 'ready';

            await ctx.replyWithDocument(new InputFile(result.path, safeName));
            await ctx.reply(
                i18n.messages.actions.success_compress
                    .replace('{{before}}', `${beforeMB} MB`)
                    .replace('{{after}}',  `${afterMB} MB`)
                    .replace('{{saved}}',  `${savedMB} MB`),
                {
                    parse_mode:   'HTML',
                    reply_markup: this.keyboards.getFileActionsMenu(lang)
                }
            );

            await notifyTrafficAfterResult(ctx, lang, this.localization, this.keyboards, this.logger);

        }catch(e:any){

            await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(()=>{});
            
            if(e.message === 'COMPRESS_TIMEOUT'){
                await ctx.reply(i18n.messages.queue.compress_timeout, {parse_mode:'HTML'});
                ctx.session = initialSession();
                return;
            }

            await this.logger.error('ButtonHandler:handleCompress', e, {user:ctx.from!, message:ctx.message!});
            await ctx.reply(`❌ ${i18n.messages.common.technical_problem} ${e.message}`, {parse_mode:'HTML'});
            ctx.session = initialSession();

        }

    }
    
}
