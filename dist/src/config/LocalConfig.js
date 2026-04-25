import { validateConfig } from '../../shared/src/config/ConfigValidator.js';
export class LocalConfig {
    token = '7849675923:AAHWF3aTkc9KV9-x3WDyelABcAW_-iZTTdw';
    adminId = 492383012;
    botName = 'pdf-tools-bot';
    url = 'https://lmdnbot.com';
    channelLogId = -1002838810332;
    botGroupId = -1002171859324;
    workerSocketPath = '/run/bots/pdf-worker.sock';
    localApiFile = 'http://127.0.0.1:8081';
    telegramStoragePath = '/srv/telegram-bot-api';
    forceLang = 'en';
    marketplaceUrl = 'https://lmdnbot.com';
    db = {
        host: '127.0.0.1',
        port: 63915,
        database: 'pdf_tools_bot',
        user: 'pdftoolsbot',
        password: 'gNObfMruRFmnVL54osWnam5aZMRDzkKNmCqQyegCCZTVEadIdNIBwn9N7nPfhaYW09D3vte7G'
    };
    smtp = {
        host: 'smtppro.zoho.com',
        port: 587,
        user: 'noreply@lmdnbot.com',
        password: '2gvN0NrPigyA'
    };
    get slug() { return this.botName.replace(/-bot$/, ''); }
    get path() { return `/bot/${this.slug}`; }
    async validate() { await validateConfig(this); }
}
