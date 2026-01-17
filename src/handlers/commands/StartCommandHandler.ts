import type {Context} from 'grammy';
import {LoggerService} from '../../services/LoggerService.js';
import type {IBotConfig} from '../../config/interfaces/IBotConfig.js';
import {LocalizationService} from '../../services/LocalizationService.js';

export class StartCommandHandler{
	
	private readonly logger:LoggerService;
	private readonly config:IBotConfig;
	private readonly localization:LocalizationService;
	
	constructor(config:IBotConfig,localization:LocalizationService){
		
		this.config = config;
		this.localization = localization;
		this.logger = new LoggerService(config);
		
	}
	
	async handle(ctx:Context){
		
		const userCode = ctx.from?.language_code;
		const {lang,isFallback} = this.localization.getUserLanguage(userCode);
		
		await this.logger.logToTelegram(
            `▶️ <b>Command /start received</b>\nDetected Lang: <code>${lang}</code> (Fallback: ${isFallback})`,
            'StartCommandHandler INFO',
            {
                user: ctx.from!,
                message: ctx.message!,
                errorText: 'Command received', // техническое поле для форматтера
                botName: ctx.me?.username ?? 'unknown'
            }
        );
		
		this.logger.logToFile(
            'system/command-info.log', 
            `COMMAND /start | USER_ID:${ctx.from!.id} | LANG_CODE:${userCode} -> ${lang}`
        );
		
		try{
			
			if(isFallback){
				
				await ctx.reply(this.localization.t('en','language_not_supported'));
				
			}
			
			await ctx.reply(
				this.localization.t(lang,'start_message'),
				{parse_mode:'HTML'}
			);
			
			this.logger.logToFile('system/command-info.log', `COMMAND /start | Success response sent to User ${ctx.from!.id}`);
			
		}catch(e){
			
			const errorStack = (e as Error).stack ?? String(e);
			await this.logger.logToTelegram(
                `❌ <b>Error on /start</b>\n${(e as Error).message}`,
                'Error in StartCommandHandler',
                {
                    user: ctx.from,
                    message: ctx.message,
                    errorText: errorStack,
                    botName: ctx.me?.username ?? 'unknown'
                }
            );
			
			this.logger.logToFile('system/command-errors.log', `ERROR /start | ${errorStack}`);
			
		}
		
	}
	
}
