import{Bot, webhookCallback} from 'grammy';
import {config} from '../shared/config/config.js';

export class TelegramBot{

	private bot:Bot;
	public webhookCallback;

	constructor(){

		this.bot = new Bot(config.token);
		this.webhookCallback = webhookCallback(this.bot, 'express');

	}

	public startPolling(){

		this.bot.start();
		console.log('Bot is now working on Long Polling');

	}

}
