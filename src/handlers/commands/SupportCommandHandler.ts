import {InlineKeyboard} from 'grammy';
import type {BotContext} from '../../types/BotContext.js';
import type {IBotConfig} from '../../config/interfaces/IBotConfig.js';
import type {LocalizationService} from '../../services/LocalizationService.js';
import {LoggerService} from '../../services/LoggerService.js';
import {SupportRepository} from '../../database/repositories/SupportRepository.js';

export const SUPPORT_CATEGORIES:Record<string,string>={
    
    business:'🏢 Business inquiry',
    privacy:'🔒 Data & Privacy',
    payment:'💳 Payment & Subscription',
    bug:'🐛 Bug Report',
    
};

const MAX_CHARS = 1000;
export class SupportCommandHandler{
    
    private readonly logger:LoggerService;
    private readonly repo:SupportRepository;
    
    constructor(private readonly config:IBotConfig,private readonly localization:LocalizationService){
        
        this.logger = new LoggerService(config);
        this.repo = new SupportRepository();
        
    }
    
    async handle(ctx:BotContext):Promise<void>{
        
        ctx.session.step = 'waiting_for_support_category' as any;
        ctx.session.currentAction = 'idle';
        
        const kb = new InlineKeyboard();
        
        for(const [key,label] of Object.entries(SUPPORT_CATEGORIES)){
            
            kb.text(label,`support_cat:${key}`).row();
            
        }
        
        await ctx.reply(`🆘 <b>Support</b>\n\nPlease select the topic of your request:`,{parse_mode:'HTML',reply_markup:kb});
        
    }
    
    async handleCategoryCallback(ctx:BotContext):Promise<void>{
        
        await ctx.answerCallbackQuery();
        
        const data = ctx.callbackQuery?.data || '';
        const category = data.replace('support_cat','');
        
        if(!SUPPORT_CATEGORIES[category]) return;
        
        ctx.session.step = 'waiting_for_support_message' as any;
        (ctx.session.tempParams as any).supportCategory = category;
        
        await ctx.editMessageText(
            `${SUPPORT_CATEGORIES[category]}\n\n` +
            `✍️ <b>Please describe your request</b>\n\n` +
            `Maximum <b>${MAX_CHARS} characters</b>.\n` +
            `For longer messages, email us at <code>support@lmdnbot.com</code>`,
            {parse_mode:'HTML'}
        );
        
    }
    
    async handleMessage(ctx:BotContext):Promise<void>{
        
        const text = ctx.message?.text?.trim();
        if(!text) return;
        
        if(text.length > MAX_CHARS){
            
            await ctx.reply(
           `⚠️ Your message is too long (<b>${text.length}</b> characters).\n` +
                `Please keep it under <b>${MAX_CHARS}</b> characters,\n` +
                `or email us at <code>support@lmdnbot.com</code>`,
                {parse_mode:'HTML'}
            );
            
            return;
            
        }
        
        const user = ctx.from!;
        const category = (ctx.session.tempParams as any).supportCategory as string || 'bug';
        const catLabel = SUPPORT_CATEGORIES[category] || category;
        
        const session = await this.repo.createSession({
            userId:user.id,
            username:user.username || '',
            firstName:user.first_name || '',
            lastName:user.last_name || '',
            category
        });
        
        const userStr = user.username ? `@${user.username}` : `${user.first_name} ${user.last_name || ''}`.trim();
        
        const groupAlert =             `🆘 <b>SUPPORT REQUEST</b>\n\n` +
            `📂 <b>Category:</b> ${catLabel}\n` +
            `👤 <b>User:</b> ${userStr} (ID: <code>${user.id}</code>)\n` +
            `🔖 <b>Session:</b> <code>#${session.id}</code>\n\n` +
            `💬 <b>Message:</b>\n${text}\n\n` +
            `<i>Reply to this message to respond directly to the user.</i>`;
        
        const sentMsg = await ctx.api.sendMessage(
            this.config.botGroupId,
            groupAlert,
            {parse_mode:'HTML'}
        );
        
        await this.repo.saveMessage(session.id,user.id,sentMsg.message_id);
        
        await ctx.reply(
            `✅ <b>Your request has been sent to the developer.</b>\n\n` +
            `📂 Topic: ${catLabel}\n\n` +
            `We will get back to you within <b>24 hours</b>.\n\n` +
            `<i>For urgent matters, email us at <code>support@lmdnbot.com</code></i>`,
            {parse_mode:'HTML'}
        );
        
        ctx.session.step = 'idle';
        (ctx.session.tempParams as any).supportCategory = undefined;
        await this.logger.logAction('SupportCommandHandler:handleMessage',user,'Support request created',`Category: ${category} | Session: ${session.id}`);
        
    }
    
}
