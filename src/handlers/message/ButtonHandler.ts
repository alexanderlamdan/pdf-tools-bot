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

export class ButtonHandler{
    
    private workerService:PdfWorkerService;
    private fileService:FileService;
    private keyboards:Keyboards;
    private logger:LoggerService;
    private db:DatabaseService;
    
    constructor(private readonly config:IBotConfig,private readonly localApi:LocalApi,private readonly localization:LocalizationService){
        
        this.workerService = new PdfWorkerService(this.config);
        this.fileService = new FileService(this.config,this.localApi);
        this.keyboards = new Keyboards(this.localization);
        this.logger = new LoggerService(this.config);
        this.db = new DatabaseService();
        
    }
    
    async handle(ctx:BotContext){
        
        const text = ctx.message?.text;
        if(!text) return;
        
        const actionKey = this.localization.getActionKeyByText(text);
        if(!actionKey) return;
        
        const {lang} = this.localization.getUserLanguage(ctx.from?.language_code);
        this.db.registerUser(ctx.from!.id, ctx.from!.username, ctx.from!.first_name);
        
        this.logger.logToFile('system/buttons.log', `BUTTON CLICK | User: ${ctx.from?.id} | Key: ${actionKey}`);
        
        await this.logger.logToTelegram(
                `❌ <b>BUTTON CLICK|User</b>\n${ctx.from?.id}`,
                `Key: ${actionKey}`,
                { user: ctx.from!, message: ctx.message!,botName: this.config.botName}
      );
      
      if(actionKey === 'btn_status'){
        
        const userId = ctx.from!.id;
        const user = this.db.getUser(userId);
        
        if(!user){
            
            await ctx.reply(this.localization.t(lang,'status_show_error'));
            return;
            
        }
        
        const usedMB = (user.totalTrafficBytes / 1024 / 1024).toFixed(2);
        
        if(userId === this.config.adminId){
            
            const global = this.db.getGlobalStats();
            const counts = this.db.getUserCounts();
            const totalGB = (global.traffic / 1024 / 1024 / 1024).toFixed(2);
            
            let actionStats = '';
            const sortedActions = Object.entries(global.actions).sort((a, b) => (b[1] as number) - (a[1] as number));
                
                if (sortedActions.length === 0) {
                    actionStats = this.localization.t(lang, 'no_activity');
                } else {
                    for (const [action, count] of sortedActions) {

                        const translationKey = `status_${action}`;
                        let actionLabel = this.localization.t(lang, translationKey);
                        
                        if (actionLabel === translationKey) {
                            actionLabel = this.capitalize(action) + ":";
                        }

                        actionStats += `${actionLabel} <b>${count}</b>\n`;
                    }
                }
            
            const msg = this.localization.t(lang, 'msg_admin_status') +
                            `👥 <b>Users:</b> ${counts.total} (🟢 ${counts.active})\n\n` +
                            `📊 <b>${this.localization.t(lang, 'msg_global_stats')}:</b>\n` +
                            actionStats + 
                            `\n💾 <b>${this.localization.t(lang, 'msg_traffic')}:</b> ${totalGB} GB\n\n` +
                            `💎 <b>${this.localization.t(lang, 'msg_subs')}:</b> VIP:${counts.subscribers.vip} | Pro:${counts.subscribers.pro} | Prem:${counts.subscribers.premium} | Ent:${counts.subscribers.enterprise}`;
            await ctx.reply(msg,{parse_mode:'HTML'});
            return;
            
        }
        
        let maxStorage = '1GB';
        let role = 'Free';
        
        if(user.isVip) {maxStorage = 'Unlimited';role = "💎 VIP";}
        
        else if(user.subType === 'pro'){maxStorage = '4GB'; role = 'Pro'}
        else if(user.subType === 'premium'){maxStorage = '8GB'; role = 'Premium'}
        else if(user.subType === 'enterprise'){maxStorage = '24GB'; role= 'Enterprise'};
        
        let myStats= '';
        const userActions = Object.entries(user.stats || {}).sort((a, b) => (b[1] as number) - (a[1] as number));

            if (userActions.length === 0) {
                myStats = this.localization.t(lang, 'no_activity');
            } else {
                for (const [action, count] of userActions) {
                    const translationKey = `status_${action}`;
                    let actionLabel = this.localization.t(lang, translationKey);
                    
                    if (actionLabel === translationKey) {
                        actionLabel = this.capitalize(action) + ":";
                    }
                    myStats += `${actionLabel} <b>${count}</b>\n`;
                }
            }
        let planInfo = '';
        
        if(user.subExpiresAt > 0){
            
            const subEnd= new Date(user.subExpiresAt).toLocaleDateString();
            planInfo = `${user.subPeriod} (${this.localization.t(lang, 'msg_end')}: ${subEnd})`;
            
        }else{
            
            planInfo = this.localization.t(lang,'no_active_sub');
            
        }
        
        const subEnd = user.subExpiresAt > 0 ? new Date(user.subExpiresAt).toLocaleDateString() : this.localization.t(lang,'no_active_sub');
        
        const msg = this.localization.t(lang, 'msg_status') +
                        `📛 <b>${this.localization.t(lang, 'msg_name')}:</b> ${user.firstName}\n` +
                        `🏷 <b>${this.localization.t(lang, 'msg_role')}:</b> ${role}\n` +
                        `💾 <b>${this.localization.t(lang, 'msg_usage')}:</b> ${usedMB} MB / ${maxStorage}\n\n` +
                        `📊 <b>${this.localization.t(lang, 'msg_stats')}:</b>\n` +
                        myStats + 
                        `\n💳 <b>${this.localization.t(lang, 'msg_plan')}:</b>${planInfo}`;
        await ctx.reply(msg,{parse_mode:'HTML'});
        return;
        
      }
      
      if(actionKey === 'btn_cancel' || text === '/cancel'){
        
        if(ctx.session.filePaths){
            
            for(const path of ctx.session.filePaths){
                
                await this.fileService.deleteFile(path);
                
            }
            
        }
        
        ctx.session = initialSession();
        await ctx.reply("❌",{reply_markup:{remove_keyboard:true}});
        await ctx.reply(this.localization.t(lang,'start_message'),{
            
            reply_markup:this.keyboards.getMainMenu(lang)
            
        });
        
        return;
        
      }
      
      const hasFile = ctx.session.filePaths && ctx.session.filePaths.length > 0;
      const localPath = hasFile ? ctx.session.filePaths[0] : null;
      const originalName = ctx.session.tempParams?.originalName || 'document.pdf';
      
      if (['btn_unlock', 'btn_compress', 'btn_protect'].includes(actionKey) && !hasFile) {
            await ctx.reply(this.localization.t(lang, 'file_lost'));
            return;
      }
      
      if(actionKey === 'btn_unlock'){
        
        if(!hasFile){
            
            await ctx.reply(this.localization.t(lang,'file_lost'));
            return;
            
        }
        
        const statusMsg = await ctx.reply(this.localization.t(lang,'cracking_proccess'),{
        
        parse_mode:'HTML'
        
        });
        
        try{
            
            const crackResult = await this.workerService.crack(localPath!);
            
            this.db.logAction(ctx.from!.id, 'unlock', 0);
            
            const safeName = FileNameUtils.getSafeName(originalName,'');
            
            await ctx.reply(this.localization.t(lang,'crack_success').replace('{{password}}',crackResult.password),{
                
                parse_mode:'HTML'
                
            });
            
            await ctx.replyWithDocument(new InputFile(crackResult.path,safeName),{
                
                reply_markup:this.keyboards.getMainMenu(lang)
                
            });
            
            await this.fileService.deleteFile(crackResult.path);
            await this.fileService.deleteFile(localPath!);
            ctx.session = initialSession();
            
        }catch(e){
            
            await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id);
            await ctx.reply(this.localization.t(lang,'manual_pass_req'),{
                
                parse_mode:'HTML',
                reply_markup:{
                    force_reply:true
                }
                
            });
            ctx.session.currentAction = 'unlock';
            ctx.session.step = 'waiting_for_password';
            
        }
        return;
        
      }
        
      if(actionKey === 'btn_compress'){
        
        if(!hasFile){
            
            ctx.session.currentAction = 'compress';
            await ctx.reply(this.localization.t(lang,'btn_compress_reply'));
            return;
            
        }
        
        const statusMsg = await ctx.reply(this.localization.t(lang,'compress_info_proccess'),{
            parse_mode:'HTML'
        });
        
        try{
            
            const resultPath = await this.workerService.compress(localPath!);
            
            this.db.logAction(ctx.from!.id, 'compress', 0);
            
            const safeName = FileNameUtils.getSafeName(originalName,this.localization.t(lang,'suffix_compressed'));
            
            await ctx.replyWithDocument(new InputFile(resultPath,safeName),{
                
                reply_markup:this.keyboards.getMainMenu(lang)
                
            });
            
            
            await this.fileService.deleteFile(resultPath);
            await this.fileService.deleteFile(localPath!);
            ctx.session = initialSession();
            
        }catch(e:any){
            
            await ctx.reply(`Error: ${e.message}`);
            await this.logger.logToTelegram(`Compress Error: ${e.message}`, 'ButtonHandler', {user: ctx.from!, message: ctx.message!, errorText: e.message, botName: this.config.botName});
            
        }finally{
            
            await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
            
        }
        
        return;
        
      }
      
      if(actionKey === 'btn_protect'){
        
        if(!hasFile){
            
            await ctx.reply(this.localization.t(lang,'file_lost'));
            return;
            
        }
        
        ctx.session.currentAction = 'protect';
        ctx.session.step = 'waiting_for_password';
        await ctx.reply(this.localization.t(lang,'set_password'),{
            
            parse_mode:'HTML',
            reply_markup:{force_reply:true}
            
        });
        
        return;
        
      }
      
      if(actionKey === 'btn_help'){
        
        await ctx.reply(this.localization.t(lang,'help_message'),{parse_mode:'HTML'});
        
      }
      
    }
    
    private getActionIcon(action: string): string {
        switch(action) {
            case 'upload': return '📂';
            case 'compress': return '🗜';
            case 'unlock': return '🔓';
            case 'protect': return '🔐';
            default: return '🔹';
        }
    }

    private capitalize(s: string) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }
    
}
