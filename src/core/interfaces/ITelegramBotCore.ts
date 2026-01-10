export interface ITelegramBotCore{

	getWebhookCallback():(req:any,res:any,next:any)=>void;
	startPolling():void;

}
