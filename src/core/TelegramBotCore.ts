import { Bot, Api, webhookCallback, session } from "grammy";
import { sequentialize } from "@grammyjs/runner";
import type { RawApi } from "grammy";
import type {IBotConfig} from '../config/interfaces/IBotConfig.js';
import type {Request, Response, NextFunction} from 'express';
import {HandlerRegistry} from '../handlers/HandlerRegistry.js';
import {LoggerService} from '../services/LoggerService.js';
import { LocalizationService } from "../services/LocalizationService.js";
import type { BotContext } from "../types/BotContext.js";
import { initialSession } from "../types/SessionData.js";
import {DatabaseService} from '../services/DatabaseService.js';
import { AntiSpamService } from '../services/AntiSpamService.js';
import { SmartQueueService } from '../services/SmartQueueService.js';


export class TelegramBotCore{

	private readonly bot:Bot<BotContext>;
	private readonly webhookHandler:(req:Request,res:Response,next:NextFunction)=>void;
	private readonly config:IBotConfig;
	private readonly logger:LoggerService;
	private readonly localApi: Api<RawApi>;
	private readonly localization: LocalizationService;
	private readonly db: DatabaseService;
	private readonly antiSpam:AntiSpamService;

	constructor(configSource: IBotConfig) {

  		this.config = configSource;
  		this.localization = new LocalizationService(this.config.forceLang);
		this.antiSpam = new AntiSpamService();
  
		this.bot = new Bot<BotContext>(this.config.token, {
			client: {
				apiRoot: this.config.localApiFile
			}
		});
		
		const getSessionKey = (ctx: BotContext) => ctx.from?.id.toString();
		this.bot.use(sequentialize(getSessionKey));
		
		this.bot.use(session({
			initial:initialSession,
		}));

  		this.localApi = new Api<RawApi>(this.config.token, {
    		apiRoot: this.config.localApiFile
  		});

  		this.logger = new LoggerService(this.config);
		this.db = new DatabaseService(this.logger);
		
		this.bot.use(async (ctx,next)=>{
			
			if(!ctx.session) return next();
			const shouldReply = await this.antiSpam.check(ctx);
			
			if(shouldReply){
				
				await next();
				
			}else{
				
				
				
			}
			
		});

  		new HandlerRegistry(this.bot, this.config, this.localApi,this.localization).registerAll();
		SmartQueueService.getInstance(this.localization, new DatabaseService(this.logger)).setApi(this.localApi);
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
		
		
	}
	public getWebhookCallback(){

		return webhookCallback(this.bot, "express",{
			timeoutMilliseconds:60000
		});

	}

}
