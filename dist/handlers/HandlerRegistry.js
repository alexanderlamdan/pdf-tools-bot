import { StartCommandHandler } from "./commands/StartCommandHandler.js";
import { HelpCommandHandler } from "./commands/HelpCommandHandler.js";
import { UserService } from "../services/UserService.js";
import { DocumentMessageHandler } from "./message/DocumentMessageHandler.js";
import { LocalizationService } from "../services/LocalizationService.js";
export class HandlerRegistry {
    bot;
    config;
    localApi;
    localization;
    userService;
    commandBindings = [
        { command: "start", Handler: StartCommandHandler },
        { command: "help", Handler: HelpCommandHandler },
    ];
    constructor(bot, config, localApi, localization) {
        this.bot = bot;
        this.config = config;
        this.localApi = localApi;
        this.localization = localization;
        this.userService = new UserService();
    }
    registerAll() {
        for (const { command, Handler } of this.commandBindings) {
            const instance = new Handler(this.config, this.localization);
            this.bot.command(command, instance.handle.bind(instance));
        }
        const docHandler = new DocumentMessageHandler(this.config, this.localApi, this.localization);
        this.bot.on("message:document", async (ctx) => {
            if (docHandler.isSupportedDocument(ctx)) {
                await docHandler.handle(ctx);
            }
        });
    }
}
