import type {ITelegramBotCore} from '../interfaces/ITelegramBotCore.js';

export abstract class AbstractTelegramBotCore implements ITelegramBotCore{

	abstract getWebhookCallback():(req:any,res:any,next:any)=>void;
	abstract startPolling():void;

}
