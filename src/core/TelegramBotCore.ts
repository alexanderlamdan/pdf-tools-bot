import { Bot, Api, webhookCallback } from "grammy";
import type { RawApi } from "grammy";
import {AbstractTelegramBotCore} from './abstract/AbstractTelegramBotCore.js';
import type {IBotConfig} from '../config/interfaces/IBotConfig.js';
import type {Request, Response, NextFunction} from 'express';
import {HandlerRegistry} from '../handlers/HandlerRegistry.js';
import {LoggerService} from '../services/LoggerService.js';
import { LocalizationService } from "../services/LocalizationService.js";


export class TelegramBotCore extends AbstractTelegramBotCore{

	private readonly bot:Bot;
	private readonly webhookHandler:(req:Request,res:Response,next:NextFunction)=>void;
	private readonly config:IBotConfig;
	private readonly logger:LoggerService;
	private readonly localApi: Api<RawApi>;
	private readonly localization: LocalizationService;

	constructor(configSource: IBotConfig) {
  super();

  this.config = configSource;
  
  this.bot = new Bot(this.config.token);

  this.localApi = new Api<RawApi>(this.config.token, {
    apiRoot: this.config.localApiFile
  });

  this.logger = new LoggerService(this.config);

  new HandlerRegistry(this.bot, this.config, this.localApi,this.localization).registerAll();
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
