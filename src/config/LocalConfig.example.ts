import type {IBotConfig} from './interfaces/IBotConfig.js';
import {validateConfig} from './ConfigValidator.js';

type PLACEHOLDER = never;
export class LocalConfig implements IBotConfig {
 
    // ── Core ──────────────────────────────────────────────────────────────────
    readonly token:        PLACEHOLDER = 'ЗАМЕНИ_НА_ТОКЕН_БОТА'        as never;
    readonly adminId:      PLACEHOLDER = 0                              as never;
    readonly botName:      PLACEHOLDER = 'ЗАМЕНИ_НА_ИМЯ_БОТА'          as never;
    readonly url:          PLACEHOLDER = 'https://ТВОЙ_ДОМЕН.com'       as never;
    readonly channelLogId: PLACEHOLDER = 0                              as never;
    readonly botGroupId:PLACEHOLDER =  0 as never;
 
    // ── Worker ────────────────────────────────────────────────────────────────
    readonly workerSocketPath: PLACEHOLDER = '/run/bots/ИМЯ.sock'       as never;
 
    // ── Local API ─────────────────────────────────────────────────────────────
    readonly localApiFile:        PLACEHOLDER = 'http://127.0.0.1:PORT' as never;
    readonly telegramStoragePath: PLACEHOLDER = '/srv/ПУТЬ'             as never;
    readonly forceLang:PLACEHOLDER = 'lang' as never;
 
    // ── Database ──────────────────────────────────────────────────────────────
    readonly db: PLACEHOLDER = {
        host:     'localhost',
        port:     0,
        database: 'ЗАМЕНИ',
        user:     'ЗАМЕНИ',
        password: 'ЗАМЕНИ',
    } as never;
 
    // ── SMTP ──────────────────────────────────────────────────────────────────
    readonly smtp: PLACEHOLDER = {
        host:     'smtppro.zoho.com',
        port:     587,
        user:     'noreply@ТВОЙ_ДОМЕН.com',
        password: 'ЗАМЕНИ',
    } as never;
 
    // ── Вычисляемые (не трогать) ──────────────────────────────────────────────
    get slug(): string { return (this.botName as string).replace(/-bot$/, ''); }
    get path(): string { return `/bot/${this.slug}`; }
 
    // ── Валидация (не трогать) ────────────────────────────────────────────────
    async validate(): Promise<void> { await validateConfig(this); }
 
}
