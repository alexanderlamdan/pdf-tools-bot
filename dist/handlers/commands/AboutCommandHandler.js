import { LoggerService } from '../../services/LoggerService.js';
import { LocalizationService } from '../../services/LocalizationService.js';
import { Keyboards } from '../../services/Keyboards.js';
export class AboutCommandHandler {
    config;
    localization;
    logger;
    keyboards;
    constructor(config, localization) {
        this.config = config;
        this.localization = localization;
        this.logger = new LoggerService(config);
        this.keyboards = new Keyboards(localization);
    }
    async handle(ctx) {
        const userCode = ctx.from?.language_code;
        const { lang } = this.localization.getUserLanguage(userCode);
        const isAdmin = ctx.from?.id === this.config.adminId;
        const i18n = this.localization.get(lang);
        await this.logger.logAction(ctx.from, 'Command', '/about');
        try {
            await ctx.reply(i18n.messages.about, {
                parse_mode: 'HTML',
                reply_markup: this.keyboards.getMainMenu(lang, isAdmin)
            });
        }
        catch (e) {
            await this.logger.error('AboutCommandHandler', e, { user: ctx.from, message: ctx.message });
        }
    }
}
