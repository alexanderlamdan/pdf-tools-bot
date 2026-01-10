import type {ITelegramBotCore} from '../interfaces/ITelegramBotCore.js';

export class TelegramBotCoreController{

	constructor(private readonly botCore:ITelegramBotCore){};

	getWebhookCallback(){

		return this.botCore.getWebhookCallback();

	}

	startPolling(){

		this.botCore.startPolling();

	}

}
