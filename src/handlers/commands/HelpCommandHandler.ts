import type {Context} from 'grammy';
import {LoggerService} from '../../services/LoggerService.js';
import type {IBotConfig} from '../../config/interfaces/IBotConfig.js';
import {LocalizationService} from '../../services/LocalizationService.js';
import { Keyboards } from '../../services/Keyboards.js';
export class HelpCommandHandler{
	
	private readonly logger:LoggerService;
    private readonly keyboards:Keyboards;
	constructor(
		private readonly config:IBotConfig,
		private readonly localization:LocalizationService
	){
		
		this.logger = new LoggerService(config);
        this.keyboards = new Keyboards(localization);
		
	}
	
	async handle(ctx:Context){
		
		const userCode = ctx.from?.language_code;
		const {lang} = this.localization.getUserLanguage(userCode);
		
		await this.logger.logToTelegram(
            `ℹ️ <b>COMMAND: /help</b>\nUser: <code>${ctx.from?.id}</code>`,
            'Log: Command',
            { user: ctx.from!, message: ctx.message!, errorText: 'Help requested', botName: this.config.botName }
        );

        this.logger.logToFile('system/commands.log', `HELP | User: ${ctx.from?.id}`);
		
		try{
			
			await ctx.reply(
				this.localization.t(lang,'help_full_message'),
				{
                    parse_mode:'HTML',
                    reply_markup:this.keyboards.getMainMenu(lang)
                }
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
