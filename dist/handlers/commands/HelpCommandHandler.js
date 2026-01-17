import { LoggerService } from '../../services/LoggerService.js';
import { LocalizationService } from '../../services/LocalizationService.js';
export class HelpCommandHandler {
    config;
    localization;
    logger;
    constructor(config, localization) {
        this.config = config;
        this.localization = localization;
        this.logger = new LoggerService(config);
    }
    async handle(ctx) {
        const userCode = ctx.from?.language_code;
        const { lang } = this.localization.getUserLanguage(userCode);
        await this.logger.logToTelegram(`ℹ️ <b>Command /help received</b>\nLang: <code>${lang}</code>`, 'HelpCommandHandler INFO', {
            user: ctx.from,
            message: ctx.message,
            errorText: 'Command received',
            botName: ctx.me?.username ?? 'unknown'
        });
        this.logger.logToFile('system/command-info.log', `COMMAND /help | USER_ID:${ctx.from.id} | LANG:${lang}`);
        try {
            await ctx.reply(this.localization.t(lang, 'help_message'), { parse_mode: 'HTML' });
        }
        catch (e) {
            const errorStack = e.stack ?? String(e);
            await this.logger.logToTelegram(`❌ <b>Error on /help</b>\n${e.message}`, 'Error in HelpCommandHandler', {
                user: ctx.from,
                message: ctx.message,
                errorText: errorStack,
                botName: ctx.me?.username ?? 'unknown'
            });
            this.logger.logToFile('system/command-errors.log', `ERROR /help | ${errorStack}`);
        }
    }
}
