import type { Bot } from "grammy";
import type { LocalApi } from "../types/LocalApi.js";

import { StartCommandHandler } from "./commands/StartCommandHandler.js";
import { HelpCommandHandler } from "./commands/HelpCommandHandler.js";
import { ButtonHandler } from "./message/ButtonHandler.js";

import { UserService } from "../services/UserService.js";
import type {IBotConfig} from '../config/interfaces/IBotConfig.js';
import { DocumentMessageHandler } from "./message/DocumentMessageHandler.js";
import { LocalizationService } from "../services/LocalizationService.js";
import type { BotContext } from "../types/BotContext.js";

interface CommandBinding {
  command: string;
  Handler: new (config: IBotConfig, localization: LocalizationService) => { handle(ctx: any): Promise<void> | void };
}

export class HandlerRegistry {
  private readonly userService: UserService;

  private commandBindings: CommandBinding[] = [
    { command: "start", Handler: StartCommandHandler },
    { command: "help", Handler: HelpCommandHandler },
  ];

  constructor(
    private readonly bot: Bot<BotContext>,
    private readonly config: IBotConfig,
    private readonly localApi: LocalApi,
    private readonly localization: LocalizationService
  ) {
    this.userService = new UserService();
  }

  public registerAll(): void {
    for (const { command, Handler } of this.commandBindings) {
      const instance = new Handler(this.config,this.localization);
      this.bot.command(command, instance.handle.bind(instance));
    }

    const docHandler = new DocumentMessageHandler(this.config, this.localApi,this.localization);
    
    const buttonHandler = new ButtonHandler(this.localization);

    this.bot.on("message:text",async (ctx)=>{
      
      await buttonHandler.handle(ctx);
      
    });
    
    this.bot.on("message:document", async (ctx) => {
      if (docHandler.isSupportedDocument(ctx)) {
        await docHandler.handle(ctx);
      }
    });
  }
}
