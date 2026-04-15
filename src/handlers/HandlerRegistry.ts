import type {Bot} from 'grammy';
import type {LocalApi} from '../types/LocalApi.js';
import type {IBotConfig} from '../config/interfaces/IBotConfig.js';
import type {BotContext} from '../types/BotContext.js';

import {LocalizationService} from '../services/LocalizationService.js';
import {LoggerService} from '../services/LoggerService.js';
import {Keyboards} from '../services/Keyboards.js';

import { StartCommandHandler }   from './commands/StartCommandHandler.js';
import { HelpCommandHandler }    from './commands/HelpCommandHandler.js';
import { AboutCommandHandler }   from './commands/AboutCommandHandler.js';
import { AdminCommandHandler }   from './commands/AdminCommandHandler.js';
import { SupportCommandHandler }  from './commands/SupportCommandHandler.js';
import { AdminSupportHandler }    from './commands/AdminSupportHandler.js';
import { FeedbackCommandHandler } from './commands/FeedbackCommandHandler.js';

import { ButtonHandler }         from './buttons/ButtonHandler.js';
import { TextHandler }           from './text/TextHandler.js';
import { DocumentMessageHandler } from './document/DocumentMessageHandler.js';
import { MergeArchiveHandler }   from './document/MergeArchiveHandler.js';

interface CommandBinding{
  
  command:string;
  Handler:new(config:IBotConfig,localization:LocalizationService)=>{handle(ctx:any):Promise<void> | void};
  
}

export class HandlerRegistry{
  
  private readonly logger:LoggerService;
  
  private readonly commands:CommandBinding[] = [
    
    {command:'start',Handler:StartCommandHandler},
    {command:'help',Handler:HelpCommandHandler},
    {command:'about',Handler:AboutCommandHandler},
    {command: 'support', Handler: SupportCommandHandler },
    {command:'feedback',Handler:FeedbackCommandHandler}
    
  ];
  
  constructor(private readonly bot: Bot<BotContext>,private readonly config:IBotConfig,private readonly localApi:LocalApi,private readonly localization:LocalizationService){
    
    this.logger = new LoggerService(this.config);
    
  }
  
  public registerAll():void{
    
    for(const {command, Handler} of this.commands){
      
      const instance = new Handler(this.config, this.localization);
      this.bot.command(command, instance.handle.bind(instance));
      
    }
    
    const adminHandler   = new AdminCommandHandler(this.config, this.localization);
    const docHandler     = new DocumentMessageHandler(this.config, this.localApi, this.localization);
    const buttonHandler  = new ButtonHandler(this.config, this.localApi, this.localization);
    const textHandler    = new TextHandler(this.config, this.localApi, this.localization);
    const archiveHandler = new MergeArchiveHandler(this.config, this.localApi, this.localization);
    const adminSupportHandler = new AdminSupportHandler(this.config, this.localization);
    const supportHandler      = new SupportCommandHandler(this.config, this.localization);
    const feedbackHandler = new FeedbackCommandHandler(this.config,this.localization);
    
    this.bot.on('message:text',async(ctx)=>{
      
      const text = ctx.message?.text;
      const chatId  = ctx.chat?.id;
      if(!text) return;
      
      if(chatId === this.config.botGroupId && ctx.message?.reply_to_message){
        
          await adminSupportHandler.handleAdminReply(ctx);
          return;
        
      }
      
      if (ctx.chat?.type !== 'private') return;
      
        if (
          text.startsWith('/publish')       ||
          text.startsWith('/add_vip')       ||
          text.startsWith('/admin_mode_on') ||
          text.startsWith('/admin_mode_off') ||
          text.startsWith('/admin_report')   ||
          text.startsWith('/admin_user')
      ) {
          await adminHandler.handle(ctx);
          return;
      }
      
      if (text.startsWith('/open-chat')) {
          await adminSupportHandler.handleOpenChat(ctx);
          return;
      }
 
      if (text.startsWith('/close-chat')) {
          const args = text.replace('/close-chat', '').trim();
          await adminSupportHandler.handleCloseChat(ctx, args);
          return;
      }
      
      const step = ctx.session.step;
      const awaitingInput = step === 'waiting_for_password' || 
                      step === 'waiting_for_split_pages' || 
                      step === 'waiting_for_merge_confirm' ||
                      step === 'waiting_for_merge_bulk' || step === 'waiting_for_metadata_confirm' || step === 'waiting_for_metadata_mode';
      
      if(awaitingInput){
        
        await textHandler.handle(ctx);
        return;
        
      }
      
      if (step === 'waiting_for_support_message') {
          await supportHandler.handleMessage(ctx);
          return;
      }
      
      if(step === 'waiting_for_feedback'){
        
        await feedbackHandler.handleMessage(ctx);
        return;
        
      }
      
      if(this.localization.getActionKeyByText(text)){
        
        await buttonHandler.handle(ctx);
        return;
        
      }
      
      const lang = this.localization.getUserLanguage(ctx.from?.language_code).lang;
      const cancel = this.localization.get(lang).buttons.common.btn_cancel;
      
      if(this.localization.getSubscriptionPlanByButton(text) || text === cancel){
        
        await buttonHandler.handle(ctx);
        return;
        
      }
      
      await textHandler.handle(ctx); 
      
    });
    
    this.bot.on('callback_query:data', async (ctx) => {
 
      const data = ctx.callbackQuery?.data || '';
 
      if (data.startsWith('support_cat:')) {
                await supportHandler.handleCategoryCallback(ctx);
                return;
      }
 
        await ctx.answerCallbackQuery();
 
    });
    
    this.bot.on('message:document', async (ctx) => {
      
      const step = ctx.session.step;
  
      if(step === 'waiting_for_merge_archive') {
        
          if(archiveHandler.isArchive(ctx)) {
            
              await archiveHandler.handle(ctx);
              
          } else {
            
              const lang = this.localization.getUserLanguage(ctx.from?.language_code).lang;
              await ctx.reply(this.localization.get(lang).errors.not_archive, {parse_mode:'HTML'});
              
          }
          
          return;
      }
  
      if(step === 'waiting_for_merge_bulk' || step === 'waiting_for_merge_files') {
        
          if(docHandler.isSupportedDocument(ctx)) {
            
              await docHandler.handleBulkMergeFile(ctx);
              
          } else {
            
              const lang = this.localization.getUserLanguage(ctx.from?.language_code).lang;
              await ctx.reply(this.localization.get(lang).errors.not_pdf, {parse_mode:'HTML'});
              
          }
          
          return;
      }
  
      if(docHandler.isSupportedDocument(ctx)) {
          await docHandler.handle(ctx);
      }
      
    });
    
    this.bot.on(['message:photo', 'message:voice', 'message:video', 'message:sticker',
      'message:audio', 'message:animation', 'message:video_note'],async (ctx)=>{
        
        const lang    = this.localization.getUserLanguage(ctx.from?.language_code).lang;
        const isAdmin = ctx.from?.id === this.config.adminId;
        const i18n    = this.localization.get(lang);
        
        await this.logger.logAction(
          'HandlerRegistry', ctx.from!, 'Unsupported media',
          Object.keys(ctx.message || {}).filter(k => !['message_id', 'from', 'chat', 'date'].includes(k)).join(', ')
        );
        
        try { await ctx.deleteMessage(); } catch {}

        await ctx.reply(i18n.errors.not_pdf, {
            parse_mode:   'HTML',
            reply_markup: new Keyboards(this.localization).getMainMenu(lang, isAdmin),
        });
        
      });
    
  }
  
}
