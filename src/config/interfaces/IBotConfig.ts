export interface IBotConfigCore{
	
	readonly token:string;
	readonly adminId: number;
	readonly botName: string;
	readonly url:string;
	readonly channelLogId:number;
	readonly botGroupId:number;
	readonly slug:string;
	readonly path:string;
	readonly forceLang:string;
	readonly marketplaceUrl:string;
	readonly supportEmail:string;
	readonly botUrl:string;
	readonly watermarkImagePath:string;
	readonly redirectEnabled:boolean;
	readonly ruBotUrl?:string;
	readonly heBotUrl?:string;
	readonly enableCurrencyPicker?:boolean;
	readonly availableCurrencies?:readonly string[];
	
}

export interface IWithWorker{
	
	readonly workerSocketPath:string;
	
}

export interface IWithLocalApi{
	
	readonly localApiFile:string;
	readonly telegramStoragePath:string;
	
}

export interface IWithDatabase{
	
	readonly db:{
		
		readonly host:string;
		readonly port:number;
		readonly database:string;
		readonly user:string;
		readonly password:string;
		
	};
	
}

export interface IWithSmtp{
	
	readonly smtp:{
		
		readonly host:string;
		readonly port:number;
		readonly user:string;
		readonly password:string;
		
	};
	
}

export interface ICreemPayments{
	
	readonly creemApiKey:        string;
	readonly creemWebhookSecret: string;
	readonly creemTestMode:      boolean;
	
}

export interface IDodoPayments{
	
	readonly dodoApiKey:string;
	readonly dodoWebhookSecret:string;
	readonly dodoTestMode:boolean;
	
}

export interface IAllPayPayments{
	
	readonly allPayApiKey:string;
	readonly allPayWebhookSecret:string;
	readonly allPayTestMode:boolean;
	
}

export interface IRuPayments{
	
	readonly ruPayApiKey:string;
	readonly ruPayWebhookSecret:string;
	readonly ruPayTestMode:boolean;
	
}

export interface IBotConfig extends IBotConfigCore, IWithWorker, IWithLocalApi, IWithDatabase, IWithSmtp, Partial<ICreemPayments>,Partial<IDodoPayments>,Partial<IAllPayPayments>,Partial<IRuPayments>{}

export interface IBotConfigSimple extends IBotConfigCore, IWithLocalApi, IWithDatabase, IWithSmtp,Partial<ICreemPayments>,Partial<IDodoPayments>,Partial<IAllPayPayments>,Partial<IRuPayments>{}
