import { validateConfig } from './ConfigValidator.js';
export class LocalConfig {
    token = 'ЗАМЕНИ_НА_ТОКЕН_БОТА';
    adminId = 0;
    botName = 'ЗАМЕНИ_НА_ИМЯ_БОТА';
    url = 'https://ТВОЙ_ДОМЕН.com';
    channelLogId = 0;
    botGroupId = 0;
    marketplaceUrl = 'https://your-domain.com';
    workerSocketPath = '/run/bots/ИМЯ.sock';
    localApiFile = 'http://127.0.0.1:PORT';
    telegramStoragePath = '/srv/ПУТЬ';
    forceLang = 'lang';
    db = {
        host: 'localhost',
        port: 0,
        database: 'ЗАМЕНИ',
        user: 'ЗАМЕНИ',
        password: 'ЗАМЕНИ',
    };
    smtp = {
        host: 'smtppro.zoho.com',
        port: 587,
        user: 'noreply@ТВОЙ_ДОМЕН.com',
        password: 'ЗАМЕНИ',
    };
    get slug() { return this.botName.replace(/-bot$/, ''); }
    get path() { return `/bot/${this.slug}`; }
    async validate() { await validateConfig(this); }
}
