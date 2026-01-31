import type{ BotContext } from "../../types/BotContext.js";
import { LocalizationService } from "../../services/LocalizationService.js";
import { initialSession } from "../../types/SessionData.js";

export class ButtonHandler{
    
    constructor(private readonly localization:LocalizationService){}
    
    async handle(ctx:BotContext){
        
        const text = ctx.message?.text;
        if(!text) return;
        
        const actionKey = this.localization.getActionKeyByText(text);
        if(!actionKey) return;
        
        const {lang} = this.localization.getUserLanguage(ctx.from?.language_code);
        
        ctx.session = initialSession();
        
        switch(actionKey){
            
            case 'btn_help':
                await ctx.reply(this.localization.t(lang,'help_message'),{parse_mode:'HTML'});
                break;
            case 'btn_compress':
                ctx.session.currentAction = 'compress';
                ctx.session.step = 'waiting_for_file';
                await ctx.reply(`<b>${this.localization.t(lang, 'btn_compress')}</b>\n\n` + 
                                `${this.localization.t(lang,'btn_compress_reply')}`, { parse_mode: 'HTML' });
                break;
            case 'btn_protect':
                ctx.session.currentAction = 'protect';
                ctx.session.step = 'waiting_for_file';
                await ctx.reply(`<b>${this.localization.t(lang, 'btn_protect')}</b>\n\n` + 
                                `${this.localization.t(lang,'btn_protect_reply')}`, { parse_mode: 'HTML' });
                break;
            case 'btn_unlock':
                ctx.session.currentAction = 'unlock';
                ctx.session.step = 'waiting_for_file';
                await ctx.reply(`<b>${this.localization.t(lang, 'btn_unlock')}</b>\n\n` + 
                                `${this.localization.t(lang,'btn_unlock_reply')}`, { parse_mode: 'HTML' });
                break;
            default:
                await ctx.reply(`${this.localization.t(lang,'btn_dev_reply')}`);
            
        }
        
    }
    
}
