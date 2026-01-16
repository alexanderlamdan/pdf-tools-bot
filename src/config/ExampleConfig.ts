import type {IBotConfig} from './interfaces/IBotConfig.js';

export class ExampleConfig implements IBotConfig{

	readonly token = "1234567890:aaaabbbcccc";
	readonly url = "https://your-domain.com";
	readonly adminId = 1234567890;
	readonly botName = 'bot-name';
	readonly channelLogId = -1001234567890;
	readonly workerSocketPath = '/run/bots/worker-bot.sock';
	readonly localApiFile= 'http://localhost:8081';
	readonly telegramStoragePath = '/my/storage/folder';

	get slug():string{

		return this.botName.replace(/-bot$/,'');

	}

	get path():string{

		return `/bot/${this.slug}`;

	}

}
