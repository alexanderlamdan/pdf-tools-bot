import { Bot, Api, webhookCallback,session } from "grammy";
import type { RawApi } from "grammy";
import {AbstractTelegramBotCore} from './abstract/AbstractTelegramBotCore.js';
import type {IBotConfig} from '../config/interfaces/IBotConfig.js';
import type {Request, Response, NextFunction} from 'express';
import {HandlerRegistry} from '../handlers/HandlerRegistry.js';
import {LoggerService} from '../services/LoggerService.js';
import { LocalizationService } from "../services/LocalizationService.js";
import { BotMenuService } from "../services/BotMenuService.js";
import type { BotContext } from "../types/BotContext.js";
import { initialSession } from "../types/SessionData.js";
import {DatabaseService} from '../services/DatabaseService.js';


export class TelegramBotCore extends AbstractTelegramBotCore{

	private readonly bot:Bot<BotContext>;
	private readonly webhookHandler:(req:Request,res:Response,next:NextFunction)=>void;
	private readonly config:IBotConfig;
	private readonly logger:LoggerService;
	private readonly localApi: Api<RawApi>;
	private readonly localization: LocalizationService;
	private readonly menuService:BotMenuService;
	private readonly db: DatabaseService;

	constructor(configSource: IBotConfig) {
  		super();

  		this.config = configSource;
  		this.localization = new LocalizationService();
  
  		this.bot = new Bot<BotContext>(this.config.token);
		
		this.bot.use(session({
			initial:initialSession,
		}));

  		this.localApi = new Api<RawApi>(this.config.token, {
    		apiRoot: this.config.localApiFile
  		});

  		this.logger = new LoggerService(this.config);
		this.db = new DatabaseService(this.logger);
  		this.menuService = new BotMenuService(this.bot);

  		new HandlerRegistry(this.bot, this.config, this.localApi,this.localization).registerAll();
	}
	
	public async init(){
		
		try {
            console.log('⚙️ [Core] Initializing Database & Migrations...');
            await this.db.initDatabase();
            console.log('✅ [Core] Database ready.');
        } catch (error) {
            console.error('❌ [Core] FATAL: Database init failed.');
            console.error(error);
            process.exit(1);
        }
		
		await this.menuService.syncMenu();
		
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
