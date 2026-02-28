import { StartCommandHandler } from "./commands/StartCommandHandler.js";
import { HelpCommandHandler } from "./commands/HelpCommandHandler.js";
import { AboutCommandHandler } from './commands/AboutCommandHandler.js';
import { ButtonHandler } from "./message/ButtonHandler.js";
import { TextHandler } from "./message/TextHandler.js";
import { AdminCommandHandler } from './commands/AdminCommandHandler.js';
import { UserService } from "../services/UserService.js";
import { DocumentMessageHandler } from "./message/DocumentMessageHandler.js";
import { LocalizationService } from "../services/LocalizationService.js";
import { LoggerService } from '../services/LoggerService.js';
import { Keyboards } from '../services/Keyboards.js';
export class HandlerRegistry {
    bot;
    config;
    localApi;
    localization;
    userService;
    logger;
    commandBindings = [
        { command: "start", Handler: StartCommandHandler },
        { command: "help", Handler: HelpCommandHandler },
        { command: "about", Handler: AboutCommandHandler }
    ];
    constructor(bot, config, localApi, localization) {
        this.bot = bot;
        this.config = config;
        this.localApi = localApi;
        this.localization = localization;
        this.userService = new UserService();
        this.logger = new LoggerService(this.config);
    }
    registerAll() {
        for (const { command, Handler } of this.commandBindings) {
            const instance = new Handler(this.config, this.localization);
            this.bot.command(command, instance.handle.bind(instance));
        }
        const adminHandler = new AdminCommandHandler(this.config, this.localization);
        const docHandler = new DocumentMessageHandler(this.config, this.localApi, this.localization);
        const buttonHandler = new ButtonHandler(this.config, this.localApi, this.localization);
        const textHandler = new TextHandler(this.config, this.localApi, this.localization);
        this.bot.on("message:text", async (ctx, next) => {
            const text = ctx.message?.text;
            if (!text)
                return;
            if (text.startsWith('/publish_') || text.startsWith('/add_vip')) {
                await adminHandler.handle(ctx);
                return;
            }
            const awaitingInput = ctx.session.step === 'waiting_for_password' || ctx.session.step === 'waiting_for_split_pages';
            if (awaitingInput) {
                await textHandler.handle(ctx);
                return;
            }
            const isKnownButton = !!this.localization.getActionKeyByText(text);
            if (isKnownButton) {
                await buttonHandler.handle(ctx);
                return;
            }
            const isSubscriptionButton = !!this.localization.getSubscriptionPlanByButton(text) || text === this.localization.get(this.localization.getUserLanguage(ctx.from?.language_code).lang).buttons.common.btn_cancel;
            if (isSubscriptionButton) {
                await buttonHandler.handle(ctx);
                return;
            }
            await textHandler.handle(ctx);
        });
        this.bot.on("message:document", async (ctx) => {
            if (docHandler.isSupportedDocument(ctx)) {
                await docHandler.handle(ctx);
            }
        });
        this.bot.on(["message:photo", "message:voice", "message:video", "message:sticker", "message:audio", "message:animation", "message:video_note"], async (ctx) => {
            const { lang } = this.localization.getUserLanguage(ctx.from?.language_code);
            const isAdmin = ctx.from?.id === this.config.adminId;
            const i18n = this.localization.get(lang);
            await this.logger.logAction('HandlerRegistry', ctx.from, 'Unsupported media', `Type: ${Object.keys(ctx.message || {}).filter(k => !['message_id', 'from', 'chat', 'date'].includes(k)).join(', ')}`);
            try {
                await ctx.deleteMessage();
            }
            catch { }
            await ctx.reply(i18n.errors.not_pdf, {
                parse_mode: 'HTML',
                reply_markup: new Keyboards(this.localization).getMainMenu(lang, isAdmin)
            });
        });
    }
}
