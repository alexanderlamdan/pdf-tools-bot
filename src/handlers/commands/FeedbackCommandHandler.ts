import type { BotContext } from '../../types/BotContext.js';
import type { IBotConfig } from '../../config/interfaces/IBotConfig.js';
import type { LocalizationService } from '../../services/LocalizationService.js';
import { LoggerService } from '../../services/LoggerService.js';
import { FeedbackRepository } from '../../database/repositories/FeedbackRepository.js';

const MAX_CHARS = 1000;
export class FeedbackCommandHandler{
    
    private readonly logger:LoggerService;
    private readonly repo:FeedbackRepository;
    
    constructor(private readonly config:IBotConfig,private readonly localization:LocalizationService){
        
        this.logger = new LoggerService(config);
        this.repo = new FeedbackRepository();
        
    }
    
    async handle(ctx:BotContext):Promise<void>{
        
        const userId = ctx.from!.id;
        const {allowed, remainMs} = await this.repo.canSubmit(userId);
        
        if(!allowed){
            
            const days = Math.floor(remainMs / 86_400_000);
            const hours = Math.floor((remainMs % 86_400_000) / 3_600_000);
            await ctx.reply(
                `⏳ <b>You've already submitted feedback recently.</b>\n\n` +
                `You can submit again in <b>${days}d ${hours}h</b>.`,
                {parse_mode:'HTML'}
            );
            return;
        }
        
        ctx.session.step = 'waiting_for_feedback' as any;
        
        await ctx.reply(
            `💬 <b>Feedback</b>\n\n` +
            `Share your thoughts, suggestions or feature requests.\n\n` +
            `• Maximum <b>${MAX_CHARS} characters</b>\n` +
            `• For longer messages: <code>support@lmdnbot.com</code>\n\n` +
            `✍️ Write your feedback:`,
            {parse_mode:'HTML'}
        );
        
    }
    
    async handleMessage(ctx:BotContext):Promise<void>{
        
        const text = ctx.message?.text?.trim();
        if(!text) return;
        
        if(text.length > MAX_CHARS){
            
            await ctx.reply(
                
                `⚠️ Too long — <b>${text.length}</b> characters.\n` +
                `Please keep it under <b>${MAX_CHARS}</b> characters,\n` +
                `or send longer feedback to <code>support@lmdnbot.com</code>`,
                {parse_mode:'HTML'}
                
            );
            
            return;
            
        }
        
        const user = ctx.from!;
        
        const feedback = await this.repo.submit({
            userId:user.id,
            username:user.username || '',
            firstName:user.first_name || '',
            text
        });
        
        const userStr = user.username ? `@${user.username}` : user.first_name;
        
        await ctx.api.sendMessage(this.config.botGroupId,
            `💬 <b>NEW FEEDBACK</b>\n\n` +
            `👤 <b>User:</b> ${userStr} (ID: <code>${user.id}</code>)\n` +
            `🔖 <b>ID:</b> <code>#${feedback.id}</code>\n\n` +
            `📝 <b>Message:</b>\n${text}`,
            {parse_mode:'HTML'}
        );
        
        await ctx.reply(
            `✅ <b>Thank you for your feedback!</b>\n\n` +
            `We read every message and use it to improve the bot.\n\n` +
            `<i>You can submit feedback again in 7 days.</i>`,
            {parse_mode:'HTML'}
        );
        
         ctx.session.step = 'idle';
         await this.logger.logAction(
            'FeedbackCommandHandler:handleMessage',
            user,
            'feedback submitted',
            `ID: ${feedback.id} | Length: ${text.length}`
         );
        
    }
    
}
