import type {BotContext} from '../../../types/BotContext.js';

export class UnlockAction{
    
    constructor(private readonly ctx:BotContext, private readonly handler:any){}
    
    async execute():Promise<void>{
        
        const {ctx, handler} = this;
        const i18n = handler.getI18n();

        await handler.logger.logAction(
            'UnlockAction:execute',
            ctx.from!,
            'Unlock',
            'Waiting for password',
        );

        await ctx.reply(i18n.messages.actions.unlock.ask_unlock_password, {
            parse_mode:  'HTML',
            reply_markup: handler.keyboards.getBackOnlyMenu(),
        });

        ctx.session.currentAction = 'unlock';
        ctx.session.step          = 'waiting_for_password';
        
    }
    
}
