import { Bot, Api, webhookCallback } from "grammy";
import { AbstractTelegramBotCore } from './abstract/AbstractTelegramBotCore.js';
import { HandlerRegistry } from '../handlers/HandlerRegistry.js';
import { LoggerService } from '../services/LoggerService.js';
import { LocalizationService } from "../services/LocalizationService.js";
export class TelegramBotCore extends AbstractTelegramBotCore {
    bot;
    webhookHandler;
    config;
    logger;
    localApi;
    localization;
    constructor(configSource) {
        super();
        this.config = configSource;
        this.localization = new LocalizationService();
        this.bot = new Bot(this.config.token);
        this.localApi = new Api(this.config.token, {
            apiRoot: this.config.localApiFile
        });
        this.logger = new LoggerService(this.config);
        new HandlerRegistry(this.bot, this.config, this.localApi, this.localization).registerAll();
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
