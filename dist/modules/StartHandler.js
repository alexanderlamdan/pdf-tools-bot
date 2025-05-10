import { Bot } from 'grammy';
import { LanguageCode } from '../shared/lang/LangService.js';
export class StartHandler {
    register(bot) {
        bot.command('start', async (ctx) => {
            const lang = LanguageCode.get(ctx.from?.language_code);
            await ctx.reply(lang.start);
        });
    }
}
