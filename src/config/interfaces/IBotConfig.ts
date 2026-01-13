export interface IBotConfig{

	readonly token:string;
	readonly path:string;
	readonly url:string;
	readonly adminId:number;
	readonly botName:string;
	readonly channelLogId?:number;
	readonly workerSocketPath:string;
	readonly apiRoot:string;
	readonly apiStorageRoot:string;

}
