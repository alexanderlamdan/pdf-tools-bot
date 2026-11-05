import type {BotContext} from '../../types/BotContext.js';
import {InputFile} from 'grammy';
import {initialSession} from '../../types/SessionData.js';
import {BaseHandler} from '../base/BaseHandler.js';
import {MergeAction} from './actions/MergeAction.js';
import {UnlockAction} from './actions/UnlockAction.js';
import {MetadataAction} from './actions/MetadataAction.js';
import { AdminLogService } from '../../services/AdminLogService.js';
import { LongImageAction } from './actions/LongImageAction.js';
import { ExtractAction } from './actions/ExtractAction.js';
import { RenameAction } from './actions/RenameAction.js';
import { notifyTrafficAfterResult } from '../../utils/TrafficNotifier.js';
import { handleProcessingTimeout, handleServerBusy, handleUserCancelled, handleWorkerTechnicalError } from '../../utils/ProcessingTimeoutHelper.js';
import { FileNameUtils } from '../../utils/FileNameUtils.js';
import { SUBSCRIPTION_LIMITS, calcNextWeeklyReset } from '../../utils/SubscriptionUtils.js';
import { computeBucketTable, computePersonalEstimate } from '../../utils/TrafficBucketAnalysis.js';
import { getEffectiveUser } from '../../utils/AdminCheck.js';
import { getImagesWeeklyLimit, getAllowedOfficeExtensions, getOfficeWeeklyLimit } from '../../utils/SubscriptionPlans.js';
import { buildFormatLabel, getImageExtensionsForLabel } from '../../utils/FormatLabelBuilder.js';
import { formatDate, formatDateTime } from '../../utils/LocalizedTime.js';
import { sendPreActionInfo, sendTrafficUsedSummary } from '../../utils/PreActionInfo.js';
import { formatBytes, formatBytesPair } from '../../utils/LocalizedUnits.js';
import { isDuplicateCall } from '../../utils/BusyGuard.js';
import { InlineKeyboard } from 'grammy';
import fs from 'fs';
import {ImagesToPdfAction} from './actions/ImagesToPdfAction.js';

const MULTI_FILE_COLLECTION_STEPS = new Set([
    'waiting_for_merge_files',
    'waiting_for_merge_archive',
    'waiting_for_merge_bulk',
    'waiting_for_long_image_bulk',
    'waiting_for_long_image_files',
    'waiting_for_images_bulk',
]);


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
        
        if(this.localization.isCancelFamilyButton(text) || text === '/cancel'){
            
            await this.handleCancel(ctx,i18n);
            return;
        }
        
        if(Object.values(i18n.messages.admin.buttons || {}).includes(text as any)){
            
            if(!isAdmin) return;
            await this.handleAdminButton(ctx,i18n,text);
            return;
            
        }
        
        if(text === i18n.messages.user.buttons.main.btn_status){
            
            await this.logger.logAction('ButtonHandler', ctx.from!, 'Status','');
            await this.handleStatus(ctx);
            return;
            
        }
        
        if(text === i18n.messages.user.buttons.main.btn_help){
            
            await ctx.reply(i18n.messages.commands.help,{parse_mode:'HTML'});
            return;
            
        }
        
        const hasFile = ctx.session.filePaths.length > 0;
        
        const a = i18n.messages.actions;
        const allFileButtonTexts = [
            ...Object.values(a.compress.buttons || {}),
            ...Object.values(a.unlock.buttons || {}),
            ...Object.values(a.protect.buttons || {}),
            ...Object.values(a.split.buttons || {}),
            ...Object.values(a.extract.buttons || {}),
            ...Object.values(a.rename.buttons || {}),
            ...Object.values(a.images_to_pdf.buttons || {}),
            ...Object.values(a.long_image.buttons || {}),
            ...Object.values(a.merge.buttons || {}),
            ...Object.values(a.metadata.buttons || {}),
        ];
        const isFileBtn = allFileButtonTexts.includes(text as any);
        
        if(isFileBtn && !hasFile){
            
            await ctx.reply(i18n.errors.file_lost);
            return;
            
        }
        
        await this.dispatch(ctx,i18n,text, isAdmin);
        
    }
    
    private async dispatch(ctx:BotContext,i18n:any,text:string,isAdmin:boolean):Promise<void>{
        
        const a = i18n.messages.actions;
        const merge = new MergeAction(ctx,this);
        
        switch(true){
            
            case text === a.compress.buttons.btn_compress:
                await this.handleCompress(ctx,i18n);
                break;

            case text === a.unlock.buttons.btn_unlock:
                await this.logger.logAction('ButtonHandler', ctx.from!, 'Unlock', 'Choosing method');
                ctx.session.currentAction = 'unlock';
                ctx.session.step = 'waiting_for_unlock_method';
                await ctx.reply('⬅️', {reply_markup: this.keyboards.getBackOnlyMenu()});
                await sendPreActionInfo(
                    ctx, this,
                    a.unlock.rule,
                    a.unlock.availability,
                    new InlineKeyboard().text(a.unlock.buttons.method_password,   'unlock:password').row().text(a.unlock.buttons.method_asymmetric, 'unlock:asymmetric').row(),
                );
                break;
            
                case text === a.protect.buttons.btn_protect:
                    await this.logger.logAction('ButtonHandler', ctx.from!, 'Protect', 'Choosing method');
                    ctx.session.currentAction = 'protect';
                    ctx.session.step = 'waiting_for_protect_method';
                    await ctx.reply('⬅️', {reply_markup: this.keyboards.getBackOnlyMenu()});
                    await sendPreActionInfo(
                        ctx, this,
                        a.protect.rule,
                        a.protect.availability,
                        new InlineKeyboard()
                            .text(a.protect.buttons.method_password,   'protect:password').row()
                            .text(a.protect.buttons.method_asymmetric, 'protect:asymmetric').row(),
                    );
                    break;
            case text === a.split.buttons.btn_split:
                await this.logger.logAction('ButtonHandler', ctx.from!, 'Split', 'Waiting for pages');
                ctx.session.currentAction = 'split';
                ctx.session.step = 'waiting_for_split_pages';
                await sendPreActionInfo(
                    ctx, this,
                    a.split.rule,
                    a.split.availability,
                    this.keyboards.getBackOnlyMenu(),
                );
                break;
                
            case text === a.extract.buttons.btn_extract:
                await new ExtractAction(ctx, this).showModeMenu();
                break;
                
            case text === a.extract.buttons.btn_extract_text:
                await new ExtractAction(ctx, this).extractText();
                break;
                
            case text === a.extract.buttons.btn_extract_images:
                await new ExtractAction(ctx, this).extractImages();
                break;
                
            case text === a.extract.buttons.btn_extract_search:
                await new ExtractAction(ctx, this).askSearchQuery();
                break;
                
            case text === a.extract.buttons.btn_extract_wordcount:
                await new ExtractAction(ctx, this).countWords();
                break;
                
            case text === a.rename.buttons.btn_rename:
                await new RenameAction(ctx, this).askForName();
                break;
                
            case text === a.images_to_pdf.buttons.btn_images_execute:
                await new ImagesToPdfAction(ctx, this).execute();
                break;
                
            case text === a.long_image.buttons.btn_to_long_image:
                await new LongImageAction(ctx, this).showModeMenu();
                break;
     
            case text === a.long_image.buttons.btn_long_image_pages:
                await new LongImageAction(ctx, this).startPagesMode();
                break;
     
            case text.startsWith(a.long_image.buttons.btn_long_image_bulk.split('{{limit}}')[0]):
                await new LongImageAction(ctx, this).startBulkMode();
                break;
     
            case text === a.long_image.buttons.btn_long_image_execute:
                await new LongImageAction(ctx, this).execute();
                break;    
            case text === a.merge.buttons.btn_merge:
                await merge.showModeMenu();
                break;
            
            case text === a.merge.buttons.btn_merge_one_by_one:
                await merge.startOneByOne();
                break;
            
            case text === a.merge.buttons.btn_merge_archive:
                await merge.startArchiveMode();
                break;
            
            case text === a.merge.buttons.btn_merge_bulk:
                await merge.startBulkMode();
                break;
            
            case text === a.merge.buttons.btn_execute_merge:
                await merge.execute();
                break;
            case text === a.metadata.buttons.btn_metadata_wiper:
                await new MetadataAction(ctx,this).showAndAskConfirm();
                break;
            case text === i18n.messages.convert_menu.btn_to_pdf:
                await this.handleConvertMenu(ctx);
                break;
            default:
                await this.logger.logAction('ButtonHandler', ctx.from!, 'Unhandled button', text, 'In development');
                await ctx.reply(i18n.messages.common.in_development, { parse_mode: 'HTML' });
            
        }
        
    }
    
    private async handleCancel(ctx:BotContext,i18n:any):Promise<void>{
        
        if(this.worker.isUserBusy(ctx.from!.id)){
            
            await this.logger.logAction('ButtonHandler', ctx.from!, 'Cancel requested', 'Busy — asking for confirmation');
            
            await ctx.reply('❌', {reply_markup: {remove_keyboard: true}});
            
            await ctx.reply(i18n.messages.actions.shared.cancel_confirm_ask, {
                
                parse_mode: 'HTML',
                reply_markup: new InlineKeyboard()
                    .text(i18n.messages.actions.shared.buttons.cancel_confirm_yes, 'cancel_confirm:yes').row()
                    .text(i18n.messages.actions.shared.buttons.cancel_confirm_no,  'cancel_confirm:no').row(),
                
            });
            
            return;
            
        }
        
        if(ctx.session.filePaths.length > 0 && !MULTI_FILE_COLLECTION_STEPS.has(ctx.session.step)){
            
            await this.logger.logAction('ButtonHandler', ctx.from!, 'Back to menu', `File kept | was: ${ctx.session.currentAction}:${ctx.session.step}`);
            
            const isPaid = await this.isPaidUser(ctx);
            
            ctx.session.step          = 'idle';
            ctx.session.currentAction = 'ready';
            ctx.session.tempParams    = {originalName: ctx.session.tempParams?.originalName};
            
            await ctx.reply('⬅️', {reply_markup: this.keyboards.getFileActionsMenu([], isPaid)});
            
            return;
            
        }
        
        await this.logger.logAction('ButtonHandler', ctx.from!, 'Cancel', 'Session cleared');
        
        for(const p of ctx.session.filePaths) await this.fileService.deleteFile(p);
        ctx.session = initialSession();
        
        await ctx.reply('❌',{reply_markup:{remove_keyboard:true}});
        await ctx.reply(i18n.messages.commands.start,{
            
            reply_markup:this.keyboards.getMainMenu(this.isAdmin(ctx))
            
        });
        
    }
    
    async handleCancelConfirmed(ctx:BotContext):Promise<void>{
        
        const i18n   = this.getI18n();
        const userId = ctx.from!.id;
        
        await ctx.answerCallbackQuery();
        await ctx.deleteMessage().catch(()=>{});
        
        let totalBytes = 0;
        for(const p of ctx.session.filePaths){
            
            try{ totalBytes += fs.statSync(p).size; }catch{}
            
        }
        
        const {wasQueued} = await this.worker.cancelActiveJob(userId);
        
        for(const p of ctx.session.filePaths) await this.fileService.deleteFile(p);
        
        const chargedBytes = Math.round(totalBytes / 2);
        if(chargedBytes > 0){
            
            await this.db.logAction(userId, 'cancelled', chargedBytes);
            
        }
        
        await this.logger.logAction(
            'ButtonHandler:handleCancelConfirmed',
            ctx.from!,
            'Cancel confirmed',
            `Action: ${ctx.session.currentAction} | Was queued: ${wasQueued} | Traffic charged: ${(chargedBytes / 1024 / 1024).toFixed(2)} MB`,
        );
        
        ctx.session = initialSession();
        
        await ctx.reply(i18n.messages.actions.shared.cancelled, {parse_mode:'HTML'});
        
        await this.handleStatus(ctx);
        
    }
    
    async handleCancelDeclined(ctx:BotContext):Promise<void>{
        
        await ctx.answerCallbackQuery();
        await ctx.deleteMessage().catch(()=>{});
        
        await ctx.reply('↩️', {reply_markup: this.keyboards.getCancelOnlyMenu()});
        
    }
    
    private async handleAdminButton(ctx:BotContext,i18n:any,text:string):Promise<void>{
        
        const btn = i18n.messages.admin.buttons;
        if(text === btn.adm_btn_stats){
            
            await this.logger.logAction('ButtonHandler', ctx.from!, 'Admin', 'Stats');
            await this.handleAdminStats(ctx);
            
        }else if(text === btn.adm_btn_logs){
            
            await this.logger.logAction('ButtonHandler', ctx.from!, 'Admin', 'Logs menu');
            
            const kb = new InlineKeyboard()
                .text('🤖 Bot Logs','admin_logs:bot').row()
                .text('⚙️ Worker Logs','admin_logs:worker').row();
            
            await ctx.reply('📋 Which logs do you need?',{reply_markup:kb});
            
        }else{
            
            await ctx.reply('Unknown admin command');
            
        }
        
    }
    
    private async handleSubscriptionInfo(ctx:BotContext,plan:'starter'|'pro'|'ultra'|'business'):Promise<void>{
        
        const i18n = this.getI18n();
        const planText = (i18n.messages.subscriptions_desc.plans as any)[plan] as string;
        
        const kb = new InlineKeyboard().url(`🌐 View all plans`,`${this.config.marketplaceUrl}`).row();
        
        await this.logger.logAction('ButtonHandler:handleSubscriptionInfo',ctx.from!,'Subscription viewed',`Plan:${plan}`);
        
        await ctx.reply(planText,{
            
            parse_mode:'HTML',
            reply_markup:kb
            
        });
        
    }
    
    private async handleStatus(ctx: BotContext): Promise<void> {
 
        const i18n    = this.getI18n();
        const userId  = ctx.from!.id;
        const realUser = await this.db.getUser(userId);
 
        if (!realUser) { await ctx.reply(i18n.messages.user.status.error); return; }
        const user = getEffectiveUser(ctx, realUser);
 
        const isAdmin = this.isAdmin(ctx);
        const subs    = i18n.messages.user.subscriptions;
        const isFree  = !user.isVip && (!user.subType || user.subType === 'free');
        const plan    = user.isVip ? 'vip' : (user.subType || 'free');
 
        const limitBytes = user.isVip ? Infinity : (SUBSCRIPTION_LIMITS[plan] ?? SUBSCRIPTION_LIMITS['free']);
        const usageStr = limitBytes === Infinity
            ? `${formatBytes(user.totalTrafficBytes, i18n.messages.actions.shared.units)} / ${subs.unlimited}`
            : (() => {
                const pair = formatBytesPair(user.totalTrafficBytes, limitBytes, i18n.messages.actions.shared.units);
                return `${pair.used} / ${pair.limit}`;
            })();
 
        const roleMap: Record<string, string> = {
            vip:               subs.vip_role,
            starter:           subs.starter_role,
            pro:               subs.pro_role,
            ultra:             subs.ultra_role,
            business:          subs.business_role,
        };
 
        const role        = roleMap[plan] ?? (subs.no_sub as string);
        const displayRole = isAdmin ? (subs.free_admin_role as string) : role;
 
        const userActions = Object.entries(user.stats || {}).sort((a, b) => (b[1] as number) - (a[1] as number));
        const myStats     = userActions.length === 0
            ? i18n.messages.user.status.empty
            : userActions.map(([action, count]) => {
                const label = (i18n.messages.user as any).actions?.[action] || this.capitalize(action);
                return `${label}: <b>${count}</b>`;
              }).join('\n');
 
        const joinedDate = user.joinedAt
            ? formatDate(Number(user.joinedAt), this.localization.getLang())
            : '—';
 
        const resetInfo = this.calcNextReset(user.joinedAt, this.localization.getLang());
        
        const activePackages = await this.db.getActivePackages(userId);
        const packageLines = activePackages.map((p:any) => {
            
            const pkgPair = formatBytesPair(p.usedBytes, p.sizeBytes, i18n.messages.actions.shared.units);
            return `📦 <b>${subs.one_time_package ?? 'One time package traffic'}:</b> ${pkgPair.used}/${pkgPair.limit}`;
            
        }).join('\n');
 
        const imagesLimit = getImagesWeeklyLimit(user.subType || 'free', user.isVip === 1);
        const imagesUsed  = Number((user as any).imagesUsedThisWeek || 0);
        const imagesLine  = user.isVip === 1
            ? `🖼 <b>${i18n.messages.user.status.images_to_pdf ?? 'Images to PDF'}:</b> ∞`
            : `🖼 <b>${i18n.messages.user.status.images_to_pdf ?? 'Images to PDF'}:</b> ${imagesUsed}/${imagesLimit}` +
              (imagesUsed >= imagesLimit ? ` (${calcNextWeeklyReset(user.joinedAt, this.localization.getLang(), i18n.messages.user.reset_countdown)})` : '');
 
        const officeLimit = getOfficeWeeklyLimit(user.subType || 'free', user.isVip === 1);
        const officeUsed  = Number((user as any).officeUsedThisWeek || 0);
        const officeLine  = user.isVip === 1
            ? `📄 <b>${i18n.messages.user.status.office_to_pdf ?? 'Office to PDF'}:</b> ∞`
            : `📄 <b>${i18n.messages.user.status.office_to_pdf ?? 'Office to PDF'}:</b> ${officeUsed}/${officeLimit}` +
              (officeUsed >= officeLimit ? ` (${calcNextWeeklyReset(user.joinedAt, this.localization.getLang(), i18n.messages.user.reset_countdown)})` : '');
 
        let msg =
            i18n.messages.user.status.title +
            `📛 <b>${i18n.messages.user.status.name}:</b> ${user.firstName}\n` +
            `🏷 <b>${i18n.messages.user.status.role}:</b> ${displayRole}\n` +
            `📅 <b>${i18n.messages.user.status.joined}:</b> ${joinedDate}\n` +
            `💾 <b>${i18n.messages.user.status.usage}:</b>\n` +
            `${usageStr}\n` +
            `♻️ <b>${i18n.messages.user.status.reset}:</b> ${resetInfo}\n` +
            `${imagesLine}\n` +
            `${officeLine}\n` +
            (packageLines ? `${packageLines}\n` : '');
 
        const packageHistory = await this.db.getPackageHistory(userId);
        const packageHistoryLines = packageHistory.map((p:any) => {
            
            const sizeLabel = formatBytes(p.sizeBytes, i18n.messages.actions.shared.units);
            const spent = (p.totalCents / 100).toFixed(2);
            return `${sizeLabel} package - ${p.count} time${p.count === 1 ? '' : 's'} = $${spent} spent`;
            
        }).join('\n');
        
        const packagesBlock = packageHistoryLines
            ? `\n\n📦 <b>${subs.packages_used ?? 'Packages used'}:</b>\n${packageHistoryLines}`
            : '';
 
        if (!isFree && user.subType) {
 
            const subStartedAt = (user as any).subStartedAt;
            const subExpiresAt = user.subExpiresAt;
            const periodStr    = (i18n.messages.user.period_labels as any)[user.subPeriod] ?? user.subPeriod ?? '—';
 
            if (subStartedAt && Number(subStartedAt) > 0) {
                const startedStr = formatDate(Number(subStartedAt), this.localization.getLang());
                msg += `📅 <b>${i18n.messages.user.status.sub_started}:</b> ${startedStr}\n`;
            }
 
            if (subExpiresAt && Number(subExpiresAt) > 0) {
                const expiresStr = formatDate(Number(subExpiresAt), this.localization.getLang());
                msg += `📅 <b>${i18n.messages.user.status.sub_expires}:</b> ${expiresStr}\n`;
            }
 
            msg +=
                `\n📊 <b>${i18n.messages.user.status.stats}:</b>\n${myStats}\n` +
                `💳 <b>${i18n.messages.user.status.plan}:</b> ${role} (${periodStr})` +
                packagesBlock;
 
        } else {
 
            msg +=
                `\n📊 <b>${i18n.messages.user.status.stats}:</b>\n${myStats}\n` +
                `💳 <b>${i18n.messages.user.status.plan}:</b> ${subs.no_sub}` +
                packagesBlock;
 
        }
 
        const kb        = new InlineKeyboard();
        const planBtns  = i18n.messages.user.buttons.plan_buttons as any;
 
        if (isFree) {
            kb.text(planBtns.starter, `sub_info:starter`).row()
              .text(planBtns.pro,     `sub_info:pro`).row()
              .text(planBtns.ultra,   `sub_info:ultra`).row()
              .text(planBtns.business,`sub_info:business`).row();
        }
        
        kb.text((i18n.messages.user.buttons.buy_traffic as string) ?? '📦 Buy More Traffic', 'buy_package_menu').row();
        kb.text(i18n.messages.user.buttons_extra.btn_my_stats,  'my_stats').row();
        kb.text(i18n.messages.user.buttons_extra.btn_pdf_stats, 'pdf_stats').row();
 
        await ctx.reply(msg, { parse_mode: 'HTML', reply_markup: kb });
 
    }
    
    public async handleMyStats(ctx: BotContext): Promise<void>{
        
        await ctx.answerCallbackQuery();
        
        const i18n = this.getI18n();
        const ms   = i18n.messages.user.my_stats;
        const userId = ctx.from!.id;
        
        const history = await this.db.getUserFileHistory(userId);
        
        if(!history || history.length === 0){
            
            await ctx.reply(ms.title + ms.empty, {parse_mode:'HTML'});
            return;
            
        }
        
        const firstActivity = await this.db.getUserFirstActivity(userId);
        const memberSinceStr = firstActivity ? formatDate(firstActivity, this.localization.getLang()) : '—';
        
        let totalBytes = 0;
        const perTool: Record<string, {count:number, bytes:number}> = {};
        
        for(const row of history){
            
            totalBytes += Number(row.file_size || 0);
            const type = row.action_type as string;
            if(!perTool[type]) perTool[type] = {count:0, bytes:0};
            perTool[type].count++;
            perTool[type].bytes += Number(row.file_size || 0);
            
        }
        
        const actionLabels = i18n.messages.user.actions as Record<string,string>;
        const breakdownLines = Object.entries(perTool)
            .sort((a,b) => b[1].count - a[1].count)
            .map(([type, stat]) => {
                
                const label = actionLabels[type] ?? this.capitalize(type);
                const sizeLabel = formatBytes(stat.bytes, i18n.messages.actions.shared.units);
                return `• ${label}: <b>${stat.count}</b> (${sizeLabel})`;
                
            });
        
        const mostUsedType = Object.entries(perTool).sort((a,b) => b[1].count - a[1].count)[0]?.[0];
        const mostUsedLabel = mostUsedType ? (actionLabels[mostUsedType] ?? this.capitalize(mostUsedType)) : '—';
        
        const totalSizeLabel = formatBytes(totalBytes, i18n.messages.actions.shared.units);
        
        const msg =
            ms.title +
            `📅 <b>${ms.member_since}:</b> ${memberSinceStr}\n` +
            `📄 <b>${ms.total_files}:</b> ${history.length}\n` +
            `💾 <b>${ms.total_data}:</b> ${totalSizeLabel}\n` +
            `⭐ <b>${ms.most_used}:</b> ${mostUsedLabel}\n\n` +
            `<b>${ms.breakdown}:</b>\n${breakdownLines.join('\n')}`;
        
        await ctx.reply(msg, {parse_mode:'HTML'});
        
    }
    
    public async handleConvertMenu(ctx: BotContext): Promise<void>{
        
        const i18n = this.getI18n();
        const realUser = await this.db.getUser(ctx.from!.id);
        
        if(!realUser){
            
            await ctx.reply(i18n.messages.user.status.error);
            return;
            
        }
        
        const user = getEffectiveUser(ctx, realUser);
        const isVip = user.isVip === 1;
        const plan  = user.subType || 'free';
        
        const cm = i18n.messages.convert_menu;
        const officeLabel = buildFormatLabel(getAllowedOfficeExtensions(plan, isVip), cm.format_label, cm.format_label_more);
        const imageLabel  = buildFormatLabel(getImageExtensionsForLabel(plan, isVip), cm.format_label, cm.format_label_more);
        
        const kb = new InlineKeyboard()
            .text(officeLabel, 'convert_to:office').row()
            .text(imageLabel,  'convert_to:images').row();
        
        await ctx.reply(i18n.messages.convert_menu.title, {parse_mode: 'HTML', reply_markup: kb});
        
    }
    
    public async handlePdfStats(ctx: BotContext): Promise<void>{
        
        await ctx.answerCallbackQuery();
        
        const i18n = this.getI18n();
        const ps   = i18n.messages.user.pdf_stats;
        const userId = ctx.from!.id;
        
        const realUser = await this.db.getUser(userId);
        if(!realUser){
            
            await ctx.reply(i18n.messages.user.status.error);
            return;
            
        }
        
        const user = getEffectiveUser(ctx, realUser);
        
        const limitBytes = user.isVip ? Infinity : (SUBSCRIPTION_LIMITS[user.subType || 'free'] ?? SUBSCRIPTION_LIMITS['free']);
        const remainingBytes = limitBytes === Infinity
            ? Infinity
            : Math.max(0, limitBytes - Number(user.totalTrafficBytes || 0));
        
        let personalLine: string;
        
        if(remainingBytes === Infinity){
            
            personalLine = ps.personal_line
                .replace('{{avg}}', '∞')
                .replace('{{count}}', '∞');
            
        }else{
            
            const history = await this.db.getUserFileHistory(userId);
            const sizes = history.map((r:any) => Number(r.file_size || 0)).filter((s:number) => s > 0);
            const estimate = computePersonalEstimate(remainingBytes, sizes);
            
            personalLine = estimate
                ? ps.personal_line.replace('{{avg}}', String(estimate.avgSizeMB)).replace('{{count}}', String(estimate.remainingCount))
                : ps.personal_empty;
            
        }
        
        let bucketLines = '';
        
        if(remainingBytes !== Infinity){
            
            const table = computeBucketTable(remainingBytes);
            bucketLines = ps.bucket_title + '\n' + table.map(row => {
                
                const sizeLabel = row.sizeMB >= 1000 ? `${(row.sizeMB/1000).toFixed(1)}GB` : `${row.sizeMB}MB`;
                return ps.bucket_row.replace('{{size}}', sizeLabel).replace('{{count}}', String(row.count));
                
            }).join('\n');
            
        }
        
        const msg = ps.title + personalLine + bucketLines + ps.reminder;
        
        await ctx.reply(msg, {parse_mode:'HTML'});
        
    }

    
    private calcNextReset(joinedAt:number,lang:string):string{
        
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
        
        const dateStr = formatDate(resetDate.getTime(), lang);
        const rc = this.getI18n().messages.user.reset_countdown;
        
        if(diffDays > 0) return `${dateStr} ${rc.days.replace('{{days}}', String(diffDays)).replace('{{hours}}', String(diffHours % 24))}`;
        return `${dateStr} ${rc.hours.replace('{{hours}}', String(diffHours))}`;
        
    }
    
    private async handleAdminStats(ctx: BotContext): Promise<void> {
 
        const i18n    = this.getI18n();
        const global  = await this.db.getGlobalStats(this.config.adminId);
        const counts  = await this.db.getUserCounts();
        const totalTraffic = formatBytes(global.traffic, i18n.messages.actions.shared.units);
 
        const sortedActions = Object.entries(global.actions).sort((a, b) => (b[1] as number) - (a[1] as number));
        const actionStats   = sortedActions.length === 0
            ? i18n.messages.user.status.empty
            : sortedActions.map(([action, count]) => {
                const label = (i18n.messages.user as any).actions?.[action] || this.capitalize(action);
                return `${label}: <b>${count}</b>`;
              }).join('');
 
        const msg =
            i18n.messages.admin.status.title +
            `👥 <b>Users:</b> ${counts.total} (🟢 ${counts.active} active 24h)\n\n` +
            `📊 <b>${i18n.messages.admin.status.global_stats}:</b>\n${actionStats}\n\n` +
            `💾 <b>${i18n.messages.admin.status.traffic}:</b> ${totalTraffic}\n\n` +
            `💎 <b>${i18n.messages.admin.status.subs}:</b>\n` +
            `  VIP: ${counts.subscribers.vip} | Starter: ${counts.subscribers.starter} | Pro: ${counts.subscribers.pro}\n` +
            `  Ultra: ${counts.subscribers.ultra}\n\n` +
            `📋 Full report → /admin_report\n` +
            `👤 User details → /admin_user 123456789`;
 
        await ctx.reply(msg, { parse_mode: 'HTML' });
 
    }

    
    public async handleAdminLogs(ctx:BotContext,target:'bot'|'worker'):Promise<void>{
        
        const statusMsg = await ctx.reply(`📦 Collecting ${target} logs from server...`);
        let archivePath:string|null = null;
        
        try{
            
            const {archivePath:ap,report} = await this.adminLogService.collectAndArchive(target);
            archivePath = ap;
            
            await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
            await ctx.reply(report);
            
            const archiveName = `${target}_logs_${new Date().toISOString().slice(0, 10)}.zip`;
            await ctx.replyWithDocument(new InputFile(archivePath,archiveName),{
                
                caption:`🗂 ${target === 'bot' ? 'Bot' : 'Worker'} logs | ${formatDateTime(Date.now(), this.localization.getLang())}`
                
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
 
        if(isDuplicateCall(ctx, this)) return;
 
        const localPath    = ctx.session.filePaths[0];
        const originalName = ctx.session.tempParams?.originalName || 'document.pdf';
        const chatId       = ctx.chat!.id;
        const userId       = ctx.from!.id;
        const sizeBytes    = fs.statSync(localPath).size;
        const sizeMB       = (sizeBytes / 1024 / 1024).toFixed(2);

        await this.logger.logAction(
            'ButtonHandler:handleCompress',
            ctx.from!,
            'Compress started',
            `File: ${originalName} | Size: ${sizeMB} MB`,
        );
 
        await sendPreActionInfo(
            ctx, this,
            i18n.messages.actions.compress.rule,
            i18n.messages.actions.compress.availability,
        );

        await ctx.reply(i18n.messages.actions.compress.compressing ?? '🗜 I\'m compressing your PDF...', {parse_mode:'HTML', reply_markup: this.keyboards.getCancelOnlyMenu()});
 
        setImmediate(async()=>{
 
            try{
 
                const result = await this.worker.compress(ctx, localPath, sizeBytes);
 
                await this.db.logAction(userId, 'compress', result.compressedSize || sizeBytes);
 
                if(result.alreadyOptimal){
 
                    await this.logger.logAction(
                        'ButtonHandler:handleCompress',
                        ctx.from!,
                        'Compress result',
                        `File: ${originalName} | Already optimal — no reduction possible`,
                    );
 
                    await ctx.api.sendMessage(chatId, i18n.messages.actions.compress.compress_already_optimal ?? '✅ Your PDF is already as small as it can get — sending it back unchanged.', {parse_mode:'HTML'});
                    return;
                }
 
                const safeName = FileNameUtils.getSafeName(originalName, i18n.messages.actions.compress.suffix_compressed ?? '_COMPRESSED');
                const units    = i18n.messages.actions.shared.units;
                const beforeStr = formatBytes(result.originalSize, units);
                const afterStr  = formatBytes(result.compressedSize, units);
                const savedStr  = formatBytes(result.savedBytes, units);
                const beforeMB = (result.originalSize   / 1024 / 1024).toFixed(2);
                const afterMB  = (result.compressedSize / 1024 / 1024).toFixed(2);
                const savedMB  = (result.savedBytes     / 1024 / 1024).toFixed(2);
                const savedPct = result.originalSize > 0
                    ? ((result.savedBytes / result.originalSize) * 100).toFixed(1)
                    : '0';
 
                await this.fileService.deleteFile(localPath);
                ctx.session.filePaths     = [result.path];
                ctx.session.currentAction = 'ready';
                
                await this.sendDocumentWithWatermark(ctx, result.path, safeName);
 
                await ctx.api.sendMessage(
                    chatId,
                    (i18n.messages.actions.compress.success_compress ?? `✅ Done — your PDF is smaller now.\n\nOld size: {{before}}\nNew size: {{after}}\nSaved: {{saved}}`)
                        .replace('{{before}}', beforeStr)
                        .replace('{{after}}',  afterStr)
                        .replace('{{saved}}',  savedStr),
                    { parse_mode: 'HTML', reply_markup: this.keyboards.getFileActionsMenu([], await this.isPaidUser(ctx)) },
                );
 
                await this.logger.logAction(
                    'ButtonHandler:handleCompress',
                    ctx.from!,
                    'Compress result',
                    `File: ${originalName} | ${beforeMB} MB → ${afterMB} MB | Saved: ${savedMB} MB (${savedPct}%)`,
                );
 
                await sendTrafficUsedSummary(ctx, this, result.compressedSize || sizeBytes);
 
                await notifyTrafficAfterResult(ctx, this.localization, this.keyboards, this.logger);
 
            }catch(e:any){
 
                if(e.message === 'PROCESSING_TIMEOUT'){
 
                    await handleProcessingTimeout(ctx, this, 'Compress', originalName);
 
                }else if(e.message === 'SERVER_BUSY'){
 
                    await handleServerBusy(ctx, this, 'Compress', originalName);
 
                }else if(e.message === 'USER_CANCELLED'){
 
                    await handleUserCancelled(ctx, this, 'Compress', originalName);
 
                }else{
 
                    await handleWorkerTechnicalError(ctx, this, 'Compress', originalName);
 
                }
 
                await this.fileService.deleteFile(localPath);
                Object.assign(ctx.session, initialSession());
 
            }
 
        });
    }
    
}
