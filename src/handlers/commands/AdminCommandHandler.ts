import type { Context } from 'grammy';
import type { IBotConfig } from '../../config/interfaces/IBotConfig.js';
import { DatabaseService } from '../../services/DatabaseService.js';
import { LoggerService } from '../../services/LoggerService.js';
import { LocalizationService } from '../../services/LocalizationService.js';

export class AdminCommandHandler{
    
    private readonly logger:LoggerService;
    private readonly db:DatabaseService;
    
    constructor(private readonly config:IBotConfig,private readonly localization:LocalizationService){
        
        this.logger = new LoggerService(config);
        this.db = new DatabaseService(this.logger);
        
    }
    
    async handle(ctx:Context){
        
        if(ctx.from?.id !== this.config.adminId) return;
        
        const text = ctx.message?.text;
        if(!text)return;
        
        const command = text.split(' ')[0];
        const args = text.substring(command.length).trim();
        
        switch(command){
            
            case '/publish_message_to_russian_users':
                await this.broadcast(ctx,'ru',args);
                break;
            case '/publish_message_to_english_users':
                await this.broadcast(ctx,'en',args);
                break;
            case '/publish_message_to_hebrew_users':
                await this.broadcast(ctx,'he',args);
                break;
            case '/add_vip':
                await this.addVip(ctx,args);
                break;
            
        }
        
    }
    
    private async broadcast(ctx:Context,lang:string,message:string){
        
        if(!message){
            
            await ctx.reply(`⚠️ Insert text after the command.\nExample: <code>/publish_message_to_${lang}_users Hello everybody!</code>`,{parse_mode:'HTML'});
            return;
            
        }
        
        await ctx.reply(`⏳ Starting broadcast for language: <b>${lang.toUpperCase()}</b>...`,{parse_mode:'HTML'});
        
        const ids = await this.db.getUserIdsByLang(lang);
        let success = 0;
        let fail = 0;
        
        for(const userId of ids){
            
            try{
                
                await ctx.api.sendMessage(userId,message,{parse_mode:'HTML'});
                success++;
                await new Promise(resolve=>setTimeout(resolve,50));
                
            }catch(e){
                
                fail++;
                console.error(`Failed to send to ${userId}`,e);
                
            }
            
        }
        
        await ctx.reply(`✅ Newsletters send!\n\nGet it users: ${success}\nFailed to sent: ${fail}`,{parse_mode:'HTML'});
        
    }
    
    private async addVip(ctx:Context,args:string){
        
        const targetId = Number(args.trim());
        
        if(!targetId || isNaN(targetId)){
            
            await ctx.reply('⚠️ Set correct user id.\nExample: <code>/add_vip 123456789</code>',{parse_mode:'HTML'});
            return;
            
        }
        
        try{
            
            await this.db.setVip(targetId);
            const user = await this.db.getUser(targetId);
            const userLang = user?.langCode || 'en';
            
            let msg = '';
            if(userLang === 'ru'){
                
                msg = 'Добрый день, разработчик бота добавил вас в качестве важного пользователя. Вам даны безлимитное пользование. Спасибо за ваше доверие.';
                
            }else if(userLang === 'he'){
                
                msg = 'שלום רב, המפתח הוסיף אותך כמשתמש VIP. ניתנה לך גישה ללא הגבלה. תודה על האמון שלך.';
                
            }else{
                
                msg = 'Good afternoon, the bot developer has added you as a VIP user. You have been given unlimited bot usage. Thank you for your trust.';
                
            }
            
            await ctx.api.sendMessage(targetId,msg);
            await ctx.reply(`✅ User <code>${targetId}</code> now s VIP ang get the notification.`,{parse_mode:'HTML'});
            
        }catch(e:any){
            
            await ctx.reply(`❌ Ошибка: Пользователь не найден в базе или бот заблокирован.\n${e.message}`);
            
        }
        
    }
    
}
