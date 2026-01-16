export interface IBotConfig{

	readonly token:string;
	readonly path:string;
	readonly url:string;
	readonly adminId:number;
	readonly botName:string;
	readonly channelLogId?:number;
	readonly workerSocketPath:string;
	readonly localApiFile:string;
	readonly telegramStoragePath:string;
	readonly slug?: string;

}
