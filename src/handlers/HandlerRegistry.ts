import type { Bot } from "grammy";
import type { LocalApi } from "../types/LocalApi.js";

import { StartCommandHandler } from "./commands/StartCommandHandler.js";
import { HelpCommandHandler } from "./commands/HelpCommandHandler.js";
import { AboutCommandHandler } from './commands/AboutCommandHandler.js';
import { ButtonHandler } from "./buttons/ButtonHandler.js";
import { TextHandler } from "./text/TextHandler.js";
import { AdminCommandHandler } from './commands/AdminCommandHandler.js';
import { MergeArchiveHandler } from './document/MergeArchiveHandler.js';

import { UserService } from "../services/UserService.js";
import type {IBotConfig} from '../config/interfaces/IBotConfig.js';
import { DocumentMessageHandler } from './document/DocumentMessageHandler.js'
import { LocalizationService } from "../services/LocalizationService.js";
import type { BotContext } from "../types/BotContext.js";
import { LoggerService } from '../services/LoggerService.js';
import { Keyboards } from '../services/Keyboards.js';

interface CommandBinding {
  command: string;
  Handler: new (config: IBotConfig, localization: LocalizationService) => { handle(ctx: any): Promise<void> | void };
}

export class HandlerRegistry {
  private readonly userService: UserService;
  private readonly logger: LoggerService;

  private commandBindings: CommandBinding[] = [
    { command: "start", Handler: StartCommandHandler },
    { command: "help", Handler: HelpCommandHandler },
    {command:"about",Handler:AboutCommandHandler}
  ];

  constructor(
    private readonly bot: Bot<BotContext>,
    private readonly config: IBotConfig,
    private readonly localApi: LocalApi,
    private readonly localization: LocalizationService
  ) {
    this.userService = new UserService();
    this.logger = new LoggerService(this.config);
  }

  public registerAll(): void {
    for (const { command, Handler } of this.commandBindings) {
      const instance = new Handler(this.config,this.localization);
      this.bot.command(command, instance.handle.bind(instance));
    }
    const adminHandler = new AdminCommandHandler(this.config,this.localization);
    const docHandler = new DocumentMessageHandler(this.config, this.localApi,this.localization);
    
    const buttonHandler = new ButtonHandler(this.config,this.localApi,this.localization);
    const textHandler = new TextHandler(this.config, this.localApi, this.localization);
    const archiveHandler = new MergeArchiveHandler(this.config, this.localApi, this.localization);

    this.bot.on("message:text",async (ctx,next)=>{
      
      const text = ctx.message?.text;
      if(!text)return;
      
      if(text.startsWith('/publish_') || text.startsWith('/add_vip')){
        
        await adminHandler.handle(ctx);
        return;
        
      }
      
      const step = ctx.session.step;
      
      const awaitingInput =
      step === 'waiting_for_password'     ||
      step === 'waiting_for_split_pages'  ||
      step === 'waiting_for_merge_confirm';
      
      
      
      if(awaitingInput){
        
        await textHandler.handle(ctx);
        return;
        
      }
      
      const isKnownButton = !!this.localization.getActionKeyByText(text);
      
      if(isKnownButton){
        
        await buttonHandler.handle(ctx);
        return;
        
      }
      
      const isSubscriptionButton = !!this.localization.getSubscriptionPlanByButton(text) || text === this.localization.get(this.localization.getUserLanguage(ctx.from?.language_code).lang).buttons.common.btn_cancel;
      
      if(isSubscriptionButton){
        
        await buttonHandler.handle(ctx);
        return;
        
      }
      
      await textHandler.handle(ctx);
      
    });
    
    
    
    this.bot.on("message:document", async (ctx) => {
      const step = ctx.session.step;

      // Режим ожидания архива — отдаём в MergeArchiveHandler
      if (step === 'waiting_for_merge_archive') {
        if (archiveHandler.isArchive(ctx)) {
          await archiveHandler.handle(ctx);
        } else {
          const { lang } = this.localization.getUserLanguage(ctx.from?.language_code);
          const i18n = this.localization.get(lang);
          await ctx.reply('⚠️ Please send an archive file (.zip, .rar, .7z, .tar.gz, .tar.xz)', { parse_mode: 'HTML' });
        }
        return;
      }

      // Режим bulk — накапливаем PDF файлы
      if (step === 'waiting_for_merge_bulk') {
        if (docHandler.isSupportedDocument(ctx)) {
          await docHandler.handleBulkMergeFile(ctx);
        } else {
          const { lang } = this.localization.getUserLanguage(ctx.from?.language_code);
          await ctx.reply('⚠️ Please send only PDF files in bulk mode.');
        }
        return;
      }

      // Обычный режим — PDF документы
      if (docHandler.isSupportedDocument(ctx)) {
        await docHandler.handle(ctx);
      }

    });
    
    this.bot.on(["message:photo","message:voice","message:video","message:sticker","message:audio","message:animation","message:video_note"],async (ctx)=>{
      
      const {lang} = this.localization.getUserLanguage(ctx.from?.language_code);
      const isAdmin = ctx.from?.id === this.config.adminId;
      const i18n = this.localization.get(lang);
      await this.logger.logAction(
        'HandlerRegistry',
        ctx.from!,
        'Unsupported media',
        `Type: ${Object.keys(ctx.message || {}).filter(k => !['message_id','from','chat','date'].includes(k)).join(', ')}`
      );
      
      try { await ctx.deleteMessage(); } catch {}
      await ctx.reply(i18n.errors.not_pdf, {
        parse_mode: 'HTML',
        reply_markup: new Keyboards(this.localization).getMainMenu(lang, isAdmin)
      });
      
    });
    
  }
}
