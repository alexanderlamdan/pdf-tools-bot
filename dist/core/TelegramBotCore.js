import { Bot, Api, webhookCallback, session } from "grammy";
import { AbstractTelegramBotCore } from './abstract/AbstractTelegramBotCore.js';
import { HandlerRegistry } from '../handlers/HandlerRegistry.js';
import { LoggerService } from '../services/LoggerService.js';
import { LocalizationService } from "../services/LocalizationService.js";
import { BotMenuService } from "../services/BotMenuService.js";
import { initialSession } from "../types/SessionData.js";
import { DatabaseService } from '../services/DatabaseService.js';
import { AntiSpamService } from '../services/AntiSpamService.js';
import { SmartQueueService } from '../services/SmartQueueService.js';
export class TelegramBotCore extends AbstractTelegramBotCore {
    bot;
    webhookHandler;
    config;
    logger;
    localApi;
    localization;
    menuService;
    db;
    antiSpam;
    constructor(configSource) {
        super();
        this.config = configSource;
        this.localization = new LocalizationService(this.config.forceLang);
        this.antiSpam = new AntiSpamService();
        this.bot = new Bot(this.config.token, {
            client: {
                apiRoot: this.config.localApiFile
            }
        });
        this.bot.use(session({
            initial: initialSession,
        }));
        this.localApi = new Api(this.config.token, {
            apiRoot: this.config.localApiFile
        });
        this.logger = new LoggerService(this.config);
        this.db = new DatabaseService(this.logger);
        this.menuService = new BotMenuService(this.bot);
        this.bot.use(async (ctx, next) => {
            if (!ctx.session)
                return next();
            const shouldReply = await this.antiSpam.check(ctx);
            if (shouldReply) {
                await next();
            }
            else {
            }
        });
        new HandlerRegistry(this.bot, this.config, this.localApi, this.localization).registerAll();
        SmartQueueService.getInstance(this.localization, new DatabaseService(this.logger)).setApi(this.localApi);
    }
    async init() {
        try {
            console.log('⚙️ [Core] Initializing Database & Migrations...');
            await this.db.initDatabase();
            console.log('✅ [Core] Database ready.');
        }
        catch (error) {
            console.error('❌ [Core] FATAL: Database init failed.');
            console.error(error);
            process.exit(1);
        }
        await this.menuService.syncMenu();
    }
    getWebhookCallback() {
        return webhookCallback(this.bot, "express", {
            timeoutMilliseconds: 60000
        });
    }
    getBot() {
        return this.bot;
    }
    startPolling() {
        this.bot.start();
        console.log('Bot is now working on long polling (OOP)');
    }
}
