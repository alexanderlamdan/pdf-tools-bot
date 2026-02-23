import type {Context} from 'grammy';
import {LoggerService} from '../../services/LoggerService.js';
import type {IBotConfig} from '../../config/interfaces/IBotConfig.js';
import {LocalizationService} from '../../services/LocalizationService.js';
import { Keyboards } from '../../services/Keyboards.js';
import { DatabaseService } from '../../services/DatabaseService.js';

export class StartCommandHandler{
	
	private readonly logger:LoggerService;
	private readonly config:IBotConfig;
	private readonly localization:LocalizationService;
	private readonly keyboards:Keyboards;
	private readonly db: DatabaseService
	
	constructor(config:IBotConfig,localization:LocalizationService){
		
		this.config = config;
		this.localization = localization;
		this.logger = new LoggerService(config);
		this.keyboards = new Keyboards(localization);
		this.db = new DatabaseService(this.logger);
		
	}
	
	async handle(ctx:Context){
		
		const userCode = ctx.from?.language_code;
		const {lang,isFallback} = this.localization.getUserLanguage(userCode);
		const isAdmin = ctx.from?.id === this.config.adminId;
		const i18n = this.localization.get(lang);
		
		if(ctx.from){
			
			await this.db.registerUser(
				ctx.from.id,
				ctx.from.username,
				ctx.from.first_name,
				lang
			);
			
		}
		
		await this.logger.logAction(ctx.from!, 'Command','/start');
		
		try{
			
			if(isFallback){
				
				await ctx.reply(i18n.errors.language_not_supported);
				
			}
			
			const keyboard = this.keyboards.getMainMenu(lang, isAdmin);
			
			await ctx.reply(
				i18n.messages.start,
				{
					parse_mode:'HTML',
					reply_markup:keyboard
				}
			);
			
		}catch(e){
			
			await this.logger.error('StartCommandHandler', e as Error,{user:ctx.from,message:ctx.message});
			
		}
		
		try{
			
			await ctx.reply(i18n.errors.spam_warning,{
				parse_mode:'HTML',
				reply_markup:this.keyboards.getMainMenu(lang,isAdmin)
			});
			
		}catch(e){
			
			console.error(e);
			
		}
		
	}
	
}
