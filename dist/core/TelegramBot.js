import { Bot } from 'grammy';
import { config } from '../shared/config/config.js';
export class TelegramBot {
    bot;
    constructor() {
        this.bot = new Bot(config.token);
    }
    getBot() {
        return this.bot;
    }
}
