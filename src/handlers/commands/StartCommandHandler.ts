import type {Context} from 'grammy';
import {LoggerService} from '../../services/LoggerService.js';
import type {IBotConfig} from '../../config/interfaces/IBotConfig.js';

export class StartCommandHandler{

	private readonly logger:LoggerService;
  private readonly config: IBotConfig;
	constructor(config:IBotConfig){
    this.config = config;
		this.logger = new LoggerService(config);

	}

	async handle(ctx:Context){

		await this.logger.logToTelegram(
            '/start command received',
            'StartCommandHandler INFO',
            {
                user: ctx.from!,
                message: ctx.message!,
                errorText: 'Command received',
                botName: ctx.me?.username ?? 'unknown'
            }
        );
        this.logger.logToFile('system/command-info.log', `COMMAND /start RECEIVED FROM: USER ID:${ctx.from!.id} USERNAME:${ctx.from!.username} FIRST NAME:${ctx.from!.first_name || ''} LAST NAME:${ctx.from!.last_name || ''} IS_ADMIN:${ctx.from!.id === Number(this.config.adminId) ? 'YES' : 'NO'}`);

		try{

			await ctx.reply(

			'Привет! Это бот для связи с Александром.\n' +
			'Отправь сюда сообщение, и я обязательно его увижу.\n\n' +
			'Для подсказки используй /help'

		);

		return;

		}catch(e){

			await this.logger.logToTelegram(

				`Error on the command /start:\n${(e as Error).message}`,
        'Error in StartCommandHandler',
				{

					user:ctx.from,
					message:ctx.message,
					errorText:(e as Error).stack ?? String(e),
					botName:ctx.me?.username ?? 'unknown'

				}

			);

			this.logger.logToFile('system/command-errors.log',`Error on command /start: ${(e as Error).stack ?? String(e)}`)

		}

	}

}
