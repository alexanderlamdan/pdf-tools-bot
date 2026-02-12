import { Bot, Api, webhookCallback, session } from "grammy";
import { AbstractTelegramBotCore } from './abstract/AbstractTelegramBotCore.js';
import { HandlerRegistry } from '../handlers/HandlerRegistry.js';
import { LoggerService } from '../services/LoggerService.js';
import { LocalizationService } from "../services/LocalizationService.js";
import { BotMenuService } from "../services/BotMenuService.js";
import { initialSession } from "../types/SessionData.js";
import { DatabaseService } from '../services/DatabaseService.js';
export class TelegramBotCore extends AbstractTelegramBotCore {
    bot;
    webhookHandler;
    config;
    logger;
    localApi;
    localization;
    menuService;
    db;
    constructor(configSource) {
        super();
        this.config = configSource;
        this.localization = new LocalizationService();
        this.bot = new Bot(this.config.token);
        this.bot.use(session({
            initial: initialSession,
        }));
        this.localApi = new Api(this.config.token, {
            apiRoot: this.config.localApiFile
        });
        this.logger = new LoggerService(this.config);
        this.db = new DatabaseService(this.logger);
        this.menuService = new BotMenuService(this.bot);
        new HandlerRegistry(this.bot, this.config, this.localApi, this.localization).registerAll();
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
        return webhookCallback(this.bot, "express");
    }
    getBot() {
        return this.bot;
    }
    startPolling() {
        this.bot.start();
        console.log('Bot is now working on long polling (OOP)');
    }
}
