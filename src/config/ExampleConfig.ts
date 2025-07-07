import type {IBotConfig} from './interfaces/IBotConfig.js';

export class ExampleConfig implements IBotConfig{

	readonly token = "1234567890:aaaabbbcccc";
	readonly url = "https://your-domain.com";
	readonly path = '/bot/your-bot-name';
	readonly adminId = 1234567890;
	readonly botName = 'bot-name';
	readonly channelLogId = -1001234567890;

}
