import { LoggerService } from '../../services/LoggerService.js';
import { LocalizationService } from '../../services/LocalizationService.js';
import { Keyboards } from '../../services/Keyboards.js';
export class StartCommandHandler {
    logger;
    config;
    localization;
    keyboards;
    constructor(config, localization) {
        this.config = config;
        this.localization = localization;
        this.logger = new LoggerService(config);
        this.keyboards = new Keyboards(localization);
    }
    async handle(ctx) {
        const userCode = ctx.from?.language_code;
        const { lang, isFallback } = this.localization.getUserLanguage(userCode);
        await this.logger.logToTelegram(`🟢 <b>COMMAND: /start</b>\nUser: <code>${ctx.from?.id}</code>\nName: ${ctx.from?.first_name}`, 'Log: Command', {
            user: ctx.from,
            message: ctx.message,
            errorText: 'User started bot',
            botName: this.config.botName
        });
        this.logger.logToFile('system/commands.log', `START | User: ${ctx.from?.id}`);
        try {
            if (isFallback) {
                await ctx.reply(this.localization.t('en', 'language_not_supported'));
            }
            const keyboard = this.keyboards.getMainMenu(lang);
            await ctx.reply(this.localization.t(lang, 'start_message'), {
                parse_mode: 'HTML',
                reply_markup: keyboard
            });
            this.logger.logToFile('system/command-info.log', `COMMAND /start | Success response sent to User ${ctx.from.id}`);
        }
        catch (e) {
            const errorStack = e.stack ?? String(e);
            await this.logger.logToTelegram(`❌ <b>Error on /start</b>\n${e.message}`, 'Error in StartCommandHandler', {
                user: ctx.from,
                message: ctx.message,
                errorText: errorStack,
                botName: ctx.me?.username ?? 'unknown'
            });
            this.logger.logToFile('system/command-errors.log', `ERROR /start | ${errorStack}`);
        }
        try {
            await ctx.reply(this.localization.t(lang, 'spam_warning'), {
                parse_mode: 'HTML',
                reply_markup: this.keyboards.getMainMenu(lang)
            });
        }
        catch (e) {
            console.error(e);
        }
    }
}
