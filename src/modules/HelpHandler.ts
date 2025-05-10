import {Bot} from 'grammy';
import type {BotContext} from '../core/BotContext.js';
import type {IBotHandler} from '../types/IBotHandler.js';
import {LanguageCode} from '../shared/lang/LangService.js';

export class HelpHandler implements IBotHandler{

	public register(bot:Bot<BotContext>):void{

		bot.command('help',async (ctx)=>{

			const lang = LanguageCode.get(ctx.from?.language_code);
			await ctx.reply(lang.help);

		});

	}

}
