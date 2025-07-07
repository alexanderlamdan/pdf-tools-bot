import type {IBotConfig} from './interfaces/IBotConfig.js';

export class BotConfig implements IBotConfig{

	readonly token:string;
	readonly path:string;
	readonly url:string;
	readonly adminId:number;
	readonly botName:string;
	readonly channelLogId?:number;

	constructor(source:IBotConfig){

		this.token = source.token;
		this.path = source.path;
		this.url = source.url;
		this.adminId = source.adminId;
		this.botName = source.botName;
		this.channelLogId = source.channelLogId;

	}

}
