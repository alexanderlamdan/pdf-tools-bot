import { Bot, webhookCallback } from 'grammy';
import { AbstractTelegramBotCore } from './abstract/AbstractTelegramBotCore.js';
import { BotConfig } from '../config/BotConfig.js';
import { HandlerRegistry } from '../handlers/HandlerRegistry.js';
import { LoggerService } from '../services/LoggerService.js';
export class TelegramBotCore extends AbstractTelegramBotCore {
    bot;
    webhookHandler;
    config;
    logger;
    constructor(configSource) {
        super();
        this.config = new BotConfig(configSource);
        this.bot = new Bot(this.config.token);
        this.logger = new LoggerService(this.config);
        this.webhookHandler = webhookCallback(this.bot, 'express');
        new HandlerRegistry(this.bot, this.config).registerAll();
    }
    getWebhookCallback() {
        return this.webhookHandler;
    }
    getBot() {
        return this.bot;
    }
    startPolling() {
        this.bot.start();
        console.log('Bot is now working on long polling (OOP)');
    }
}
