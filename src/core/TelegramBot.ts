import {Bot} from 'grammy';
import type {BotContext} from './BotContext.js';
import {config} from '../shared/config/config.js';

export class TelegramBot{

  private readonly bot:Bot<BotContext>;

	constructor(){

		this.bot = new Bot<BotContext>(config.token);

	}

	public getBot():Bot<BotContext>{

		return this.bot;

	}

}
