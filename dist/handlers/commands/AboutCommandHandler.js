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
        const isAdmin = ctx.from?.id === this.config.adminId;
        const i18n = this.localization.get();
        await this.logger.logAction('AboutCommandHandler', ctx.from, 'Command', '/about', 'Command received');
        try {
            await ctx.reply(i18n.messages.about, {
                parse_mode: 'HTML',
                reply_markup: this.keyboards.getMainMenu(isAdmin)
            });
        }
        catch (e) {
            await this.logger.error('AboutCommandHandler', e, { user: ctx.from, message: ctx.message });
        }
    }
}
