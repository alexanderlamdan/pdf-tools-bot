import {Bot,webhookCallback} from 'grammy';
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

	constructor(configSource:IBotConfig){

		super();
		this.config = new BotConfig(configSource);
		this.bot = new Bot(this.config.token);
		this.logger = new LoggerService(this.config);
		this.webhookHandler = webhookCallback(this.bot,'express') as (req:Request,res:Response,next:NextFunction)=>void;

		new HandlerRegistry(this.bot,this.config).registerAll();

	}

	public getWebhookCallback(){

		return this.webhookHandler;

	}

	public getBot(){

		return this.bot;

	}

	public startPolling(){

		this.bot.start();
		console.log('Bot is now working on long polling (OOP)');

	}

}
