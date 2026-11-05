import { InlineKeyboard } from 'grammy';
import type { Context }   from 'grammy';
import { LoggerService }        from '../../services/LoggerService.js';
import type { IBotConfig }      from '../../config/interfaces/IBotConfig.js';
import { LocalizationService }  from '../../services/LocalizationService.js';
import { isEffectiveAdmin }     from '../../utils/AdminCheck.js';
import { Keyboards }            from '../../services/Keyboards.js';
import { DatabaseService }      from '../../services/DatabaseService.js';
import type { BotContext }      from '../../types/BotContext.js';

const HE_LANG_CODES = ['he','iw'] as const;

const CIS_LANG_CODES = new Set([
    'ru', // Россия
    'be', // Беларусь
    'kk', // Казахстан
    'ky', // Кыргызстан
    'tg', // Таджикистан
    'tk', // Туркменистан
    'uz', // Узбекистан
    'az', // Азербайджан
    'hy', // Армения
    'uk', // Украина
    'ka', // Грузия
    'mn', // Монголия (постсоветская орбита)
]);

function isHebrew(langCode:string|undefined):boolean{
	
	if(!langCode) return false;
	const lc = langCode.toLowerCase();
	return HE_LANG_CODES.some(code=>lc.startsWith(code));
	
}

function isCis(langCode:string|undefined):boolean{
	
	if(!langCode) return false;
	return CIS_LANG_CODES.has(langCode.toLowerCase());
	
}

export class StartCommandHandler{
	
	private readonly logger:LoggerService;
	private readonly config:IBotConfig;
	private readonly localization:LocalizationService;
	private readonly keyboards:Keyboards;
	private readonly db: DatabaseService;
	
	constructor(config:IBotConfig,localization:LocalizationService){
		
		this.config = config;
		this.localization = localization;
		this.logger = new LoggerService(config);
		this.keyboards = new Keyboards(localization);
		this.db = new DatabaseService(this.logger);
		
	}
	
	async handle(ctx:BotContext){
		
		const isAdmin = isEffectiveAdmin(ctx, this.config.adminId);
		const i18n = this.localization.get();
		const langCode = ctx.from?.language_code;
		
		if(ctx.from){
			
			await this.db.registerUser(
				ctx.from.id,
				ctx.from.username,
				ctx.from.first_name
			);
			
		}
		
		await this.logger.logAction(
			'StartCommandHandler',
			ctx.from!,
			'Command',
			'/start',
			`lang_code: ${langCode ?? 'undefined'} | redirectShown: ${ctx.session.redirectShown}`
		);
		
		try{
			
			if(this.config.redirectEnabled && !ctx.session.redirectShown){
				
				if(isHebrew(langCode)){
				
					ctx.session.redirectShown = true;
					
					const kb = new InlineKeyboard().url(
						(i18n.messages.user.redirect as any).he_button,
						this.config.heBotUrl!
					);
					
					await ctx.reply(
						(i18n.messages.user.redirect as any).he,
						{parse_mode:'HTML',reply_markup:kb}
					);
					
					await this.logger.logAction(
						'StartCommandHandler',
						ctx.from!,
						'Redirect shown',
						`lang=${langCode} → HE bot`,
					);
					
					return;
					
				}
				
				if(isCis(langCode)){
					
					ctx.session.redirectShown = true;
					
					const kb = new InlineKeyboard().url(
						(i18n.messages.user.redirect as any).ru_button,
						this.config.ruBotUrl!
					);
					
					await ctx.reply(
						(i18n.messages.user.redirect as any).ru,
						{parse_mode:'HTML',reply_markup:kb}
					);
					
					await this.logger.logAction(
						'StartCommandHandler',
						ctx.from!,
						'Redirect shown',
						`lang=${langCode} → RU bot`,
					);
					
					return;
					
				}
				
			}
			
			await ctx.reply(
                i18n.messages.commands.start,
                {
                    parse_mode:   'HTML',
                    reply_markup: this.keyboards.getMainMenu(isAdmin),
                },
            );
			
		}catch(e){
			
			await this.logger.error('StartCommandHandler', e as Error,{user:ctx.from,message:ctx.message});
			
		}
		
	}
	
}
