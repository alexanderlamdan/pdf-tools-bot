export interface IBotConfigCore{
	
	readonly token:string;
	readonly adminId: number;
	readonly botName: string;
	readonly url:string;
	readonly channelLogId:number;
	readonly slug:string;
	readonly path:string;
	readonly forceLang:string;
	
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

export interface IBotConfig extends IBotConfigCore, IWithWorker, IWithLocalApi, IWithDatabase, IWithSmtp{}

export interface IBotConfigSimple extends IBotConfigCore, IWithLocalApi, IWithDatabase, IWithSmtp{}
