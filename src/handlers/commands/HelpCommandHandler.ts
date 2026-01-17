import type {Context} from 'grammy';
import {LoggerService} from '../../services/LoggerService.js';
import type {IBotConfig} from '../../config/interfaces/IBotConfig.js';
import {LocalizationService} from '../../services/LocalizationService.js';

export class HelpCommandHandler{
	
	private readonly logger:LoggerService;
	constructor(
		private readonly config:IBotConfig,
		private readonly localization:LocalizationService
	){
		
		this.logger = new LoggerService(config);
		
	}
	
	async handle(ctx:Context){
		
		const userCode = ctx.from?.language_code;
		const {lang} = this.localization.getUserLanguage(userCode);
		
		await this.logger.logToTelegram(
            `ℹ️ <b>Command /help received</b>\nLang: <code>${lang}</code>`,
            'HelpCommandHandler INFO',
            {
                user: ctx.from!,
                message: ctx.message!,
                errorText: 'Command received',
                botName: ctx.me?.username ?? 'unknown'
            }
        );

        this.logger.logToFile(
            'system/command-info.log', 
            `COMMAND /help | USER_ID:${ctx.from!.id} | LANG:${lang}`
        );
		
		try{
			
			await ctx.reply(
				this.localization.t(lang,'help_message'),
				{parse_mode:'HTML'}
			);
			
		}catch(e){
			
			const errorStack = (e as Error).stack ?? String(e);
            
            await this.logger.logToTelegram(
                `❌ <b>Error on /help</b>\n${(e as Error).message}`,
                'Error in HelpCommandHandler',
                {
                    user: ctx.from,
                    message: ctx.message,
                    errorText: errorStack,
                    botName: ctx.me?.username ?? 'unknown'
                }
            );

            this.logger.logToFile('system/command-errors.log', `ERROR /help | ${errorStack}`);
			
		}
		
	}
	
}
