import { Bot, Api, webhookCallback } from "grammy";
import type { RawApi } from "grammy";
import {AbstractTelegramBotCore} from './abstract/AbstractTelegramBotCore.js';
import {BotConfig} from '../config/BotConfig.js';
import type {IBotConfig} from '../config/interfaces/IBotConfig.js';
import type {Request, Response, NextFunction} from 'express';
import {HandlerRegistry} from '../handlers/HandlerRegistry.js';
import {LoggerService} from '../services/LoggerService.js';


export class TelegramBotCore extends AbstractTelegramBotCore{

	private readonly bot:Bot;
	private readonly webhookHandler:(req:Request,res:Response,next:NextFunction)=>void;
	private readonly config:BotConfig;
	private readonly logger:LoggerService;
	private readonly localApi: Api<RawApi>;

	constructor(configSource: IBotConfig) {
  super();

  this.config = new BotConfig(configSource);

  // 1) Обычный бот (webhook, ctx.api)
  this.bot = new Bot(this.config.token);

  // 2) Local API клиент (для upload >50MB и т.п.)
  this.localApi = new Api<RawApi>(this.config.token, {
    apiRoot: this.config.localApiFile, // http://127.0.0.1:8081
  });

  this.logger = new LoggerService(this.config);

  new HandlerRegistry(this.bot, this.config, this.localApi).registerAll();
}
	public getWebhookCallback(){

		return webhookCallback(this.bot, "express");

	}

	public getBot(){

		return this.bot;

	}

	public startPolling(){

		this.bot.start();
		console.log('Bot is now working on long polling (OOP)');

	}

}
