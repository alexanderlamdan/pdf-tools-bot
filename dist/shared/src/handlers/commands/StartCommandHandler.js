import { LoggerService } from '../../services/LoggerService.js';
import { LocalizationService } from '../../services/LocalizationService.js';
import { Keyboards } from '../../services/Keyboards.js';
import { DatabaseService } from '../../services/DatabaseService.js';
export class StartCommandHandler {
    logger;
    config;
    localization;
    keyboards;
    db;
    constructor(config, localization) {
        this.config = config;
        this.localization = localization;
        this.logger = new LoggerService(config);
        this.keyboards = new Keyboards(localization);
        this.db = new DatabaseService(this.logger);
    }
    async handle(ctx) {
        const userCode = ctx.from?.language_code;
        const isAdmin = ctx.from?.id === this.config.adminId;
        const i18n = this.localization.get();
        if (ctx.from) {
            await this.db.registerUser(ctx.from.id, ctx.from.username, ctx.from.first_name);
        }
        await this.logger.logAction('StartCommandHandler', ctx.from, 'Command', '/start', 'Command received');
        try {
            const keyboard = this.keyboards.getMainMenu(isAdmin);
            await ctx.reply(i18n.messages.start, {
                parse_mode: 'HTML',
                reply_markup: keyboard
            });
        }
        catch (e) {
            await this.logger.error('StartCommandHandler', e, { user: ctx.from, message: ctx.message });
        }
    }
}
