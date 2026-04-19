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
        const isAdmin = ctx.from?.id === this.config.adminId;
		const i18n = this.localization.get();
		
        await this.logger.logAction(
			'HelpCommandHandler',
			ctx.from!,
			'Command',
			'/help',
			'Command received'
		);
        
		try{
			
			await ctx.reply(
				i18n.messages.help,
				{
                    parse_mode:'HTML',
                    reply_markup:this.keyboards.getMainMenu(isAdmin)
                }
			);
			
		}catch(e){
			
			await this.logger.error('HelpCommandHandler',e as Error, {user:ctx.from,message:ctx.message});
			
		}
		
	}
	
}
