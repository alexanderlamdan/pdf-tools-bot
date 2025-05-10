import { Bot } from 'grammy';
import { StartHandler } from '../modules/StartHandler.js';
import { HelpHandler } from '../modules/HelpHandler.js';
export class BotKernel {
    modules;
    constructor() {
        this.modules = [
            new StartHandler(),
            new HelpHandler()
        ];
    }
    registerAll(bot) {
        for (const module of this.modules) {
            module.register(bot);
        }
    }
}
