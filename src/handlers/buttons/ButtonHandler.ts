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
import { InlineKeyboard } from 'grammy';
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
        
        const i18n = this.getI18n();
        const isAdmin = this.isAdmin(ctx);
        
        await this.registerUser(ctx);
        
        const plan = this.localization.getSubscriptionPlanByButton(text);
        
        if(plan){
            
            await this.handleSubscriptionInfo(ctx,plan);
            return;
            
        }
        
        if(text === i18n.buttons.common.btn_cancel || text === '/cancel'){
            
            await this.handleCancel(ctx,i18n);
            return;
        }
        
        if(Object.values(i18n.buttons.admin || {}).includes(text as any)){
            
            if(!isAdmin) return;
            await this.handleAdminButton(ctx,i18n,text);
            return;
            
        }
        
        if(text === i18n.buttons.main.btn_status){
            
            await this.logger.logAction('ButtonHandler', ctx.from!, 'Status','');
            await this.handleStatus(ctx);
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
        
        await this.dispatch(ctx,i18n,text, isAdmin);
        
    }
    
    private async dispatch(ctx:BotContext,i18n:any,text:string,isAdmin:boolean):Promise<void>{
        
        const btn = i18n.buttons.files;
        const merge = new MergeAction(ctx,this);
        
        switch(true){
            
            case text === btn.btn_compress:
                await this.handleCompress(ctx,i18n);
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
    
    private async handleCancel(ctx:BotContext,i18n:any):Promise<void>{
        
        await this.logger.logAction('ButtonHandler', ctx.from!, 'Cancel', 'Session cleared');
        
        for(const p of ctx.session.filePaths) await this.fileService.deleteFile(p);
        ctx.session = initialSession();
        
        await ctx.reply('❌',{reply_markup:{remove_keyboard:true}});
        await ctx.reply(i18n.messages.start,{
            
            reply_markup:this.keyboards.getMainMenu(this.isAdmin(ctx))
            
        });
        
    }
    
    private async handleAdminButton(ctx:BotContext,i18n:any,text:string):Promise<void>{
        
        const btn = i18n.buttons.admin;
        if(text === btn.adm_btn_stats){
            
            await this.logger.logAction('ButtonHandler', ctx.from!, 'Admin', 'Stats');
            await this.handleAdminStats(ctx);
            
        }else if(text === btn.adm_btn_logs){
            
            await this.logger.logAction('ButtonHandler', ctx.from!, 'Admin', 'Logs');
            await this.handleAdminLogs(ctx);
            
        }else{
            
            await ctx.reply('Unknown admin command');
            
        }
        
    }
    
    private async handleSubscriptionInfo(ctx:BotContext,plan:'pro'|'premium'|'enterprise'):Promise<void>{
        
        const i18n = this.getI18n();
        const planText = (i18n.messages.subscriptions.plans as any)[plan] as string;
        
        const kb = new InlineKeyboard().url(`🌐 View all plans`,`${this.config.marketplaceUrl}`).row();
        
        await this.logger.logAction('ButtonHandler:handleSubscriptionInfo',ctx.from!,'Subscription viewed',`Plan:${plan}`);
        
        await ctx.reply(planText,{
            
            parse_mode:'HTML',
            reply_markup:kb
            
        });
        
    }
    
    private async handleStatus(ctx:BotContext):Promise<void>{
        
        const i18n = this.getI18n();
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
        
        const joinedDate = user.joinedAt ? new Date(Number(user.joinedAt)).toLocaleDateString('en-US',{
            
            timeZone:'UTC',
            year:'numeric',
            month:'long',
            day:'numeric'
            
        }) : '-';
        
        const resetInfo = this.calcNextReset(user.joinedAt);
        
        
        const msg =  i18n.messages.status.user.title
            + `📛 <b>${i18n.messages.status.user.name}:</b> ${user.firstName}\n`
            + `🏷 <b>${i18n.messages.status.user.role}:</b> ${displayRole}\n`
            + `📅 <b>${i18n.messages.status.user.joined}:</b> ${joinedDate}\n`
            + `💾 <b>${i18n.messages.status.user.usage}:</b>\n`
            + `${usedMB} MB / ${maxStorage}\n`
            + `♻️ <b>${i18n.messages.status.user.reset}:</b> ${resetInfo}\n`
            + `📊 <b>${i18n.messages.status.user.stats}:</b>\n`
            + myStats + `\n`
            + `💳 <b>${i18n.messages.status.user.plan}:</b> ${user.subPeriod || subEnd}`;
            
        const isFree = !user.isVip && (!user.subType || user.subType === 'free');
        
        const kb = new InlineKeyboard();
        
        if(isFree){
            
            kb.text('⚡️ Pro — $10/mo',   `sub_info:pro`).row().text('💎 Premium — $25/mo', `sub_info:premium`).row().text('🏢 Enterprise — $75/mo', `sub_info:enterprise`).row();
            
        }
        
        await ctx.reply(msg,{parse_mode:'HTML',reply_markup:isFree ? kb : undefined});
    }
    
    private calcNextReset(joinedAt:number):string{
        
        if(!joinedAt) return '-';
        
        const joinDay = new Date(Number(joinedAt)).getUTCDate();
        const now = new Date();
        const nowDay = now.getUTCDate();
        
        let resetYear = now.getUTCFullYear();
        let resetMonth = now.getUTCMonth();
        
        if(nowDay >= joinDay){
            
            resetMonth += 1;
            if(resetMonth > 11){resetMonth = 0;resetYear += 1;}
            
        }
        
        const resetDate = new Date(Date.UTC(resetYear,resetMonth,joinDay,0,0,0));
        const diffMs = resetDate.getTime() - Date.now();
        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        
        const dateStr  = resetDate.toLocaleDateString('en-US',{
            
            timeZone:'UTC',
            month:'long',
            day:'numeric'
            
        });
        
        if(diffDays > 0) return `${dateStr} (in ${diffDays}d ${diffHours % 24}h UTC)`;
        return `${dateStr} (in ${diffHours}h UTC)`;
        
    }
    
    private async handleAdminStats(ctx:BotContext):Promise<void>{
        
        const i18n = this.getI18n();
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
            + `👥 <b>Users:</b> ${counts.total} (🟢 ${counts.active} active 24h)\n\n`
            + `📊 <b>${i18n.messages.status.admin.global_stats}:</b>\n${actionStats}\n\n`
            + `💾 <b>${i18n.messages.status.admin.traffic}:</b> ${totalGB} GB\n\n`
            + `💎 <b>${i18n.messages.status.admin.subs}:</b>\n`
            + `  VIP: ${counts.subscribers.vip} | Pro: ${counts.subscribers.pro} | Premium: ${counts.subscribers.premium}\n`
            + `  Enterprise: ${counts.subscribers.enterprise} | Sovereign: ${counts.subscribers.sovereign}\n\n`
            + `📋 Full report → /admin_report\n`
            + `👤 User details → /admin_user 123456789`;
        
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
    
    private async handleCompress(ctx:BotContext,i18n:any):Promise<void>{

        const localPath    = ctx.session.filePaths[0];
        const originalName = ctx.session.tempParams?.originalName || 'document.pdf';

        await this.logger.logAction('ButtonHandler:handleCompress', ctx.from!, 'Compress', `File: ${originalName}`);

        await ctx.reply(i18n.messages.queue.compress_exclusive_start, {parse_mode:'HTML'});

        const chatId  = ctx.chat!.id;
        const userId  = ctx.from!.id;
        const sizeBytes = fs.statSync(localPath).size;

        setImmediate(async()=>{

            try{

                const result = await this.worker.compress(ctx, localPath, sizeBytes);

                await this.db.logAction(userId, 'compress', result.compressedSize || sizeBytes);

                if(result.alreadyOptimal){
                    await ctx.api.sendMessage(chatId, i18n.messages.queue.compress_already_optimal, {parse_mode:'HTML'});
                    return;
                }

                const safeName = FileNameUtils.getSafeName(originalName, i18n.messages.actions.suffix_compressed);
                const beforeMB = (result.originalSize   / 1024 / 1024).toFixed(2);
                const afterMB  = (result.compressedSize / 1024 / 1024).toFixed(2);
                const savedMB  = (result.savedBytes     / 1024 / 1024).toFixed(2);

                await this.fileService.deleteFile(localPath);
                ctx.session.filePaths     = [result.path];
                ctx.session.currentAction = 'ready';

                await ctx.api.sendDocument(chatId, new InputFile(result.path, safeName));
                await ctx.api.sendMessage(chatId,
                                          i18n.messages.actions.success_compress
                                          .replace('{{before}}', `${beforeMB} MB`)
                                          .replace('{{after}}',  `${afterMB} MB`)
                                          .replace('{{saved}}',  `${savedMB} MB`),
                                          { parse_mode: 'HTML', reply_markup: this.keyboards.getFileActionsMenu() }
                );

                await notifyTrafficAfterResult(ctx,this.localization, this.keyboards, this.logger);

            }catch(e:any){

                if(e.message === 'COMPRESS_TIMEOUT'){
                    await ctx.api.sendMessage(chatId, i18n.messages.queue.compress_timeout, {parse_mode:'HTML'});
                }else{
                    await this.logger.error('ButtonHandler:handleCompress', e, {user:ctx.from!, message:ctx.message!});
                    await ctx.api.sendMessage(chatId, `❌ ${i18n.messages.common.technical_problem} ${e.message}`, {parse_mode:'HTML'});
                }

                ctx.session = initialSession();

            }

        });

    }
    
}
