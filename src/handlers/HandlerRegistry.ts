import type {Bot} from 'grammy';
import type {LocalApi} from '../types/LocalApi.js';
import type {IBotConfig} from '../config/interfaces/IBotConfig.js';
import type {BotContext} from '../types/BotContext.js';

import {LocalizationService} from '../services/LocalizationService.js';
import {LoggerService} from '../services/LoggerService.js';
import {Keyboards} from '../services/Keyboards.js';
import {DatabaseService} from '../services/DatabaseService.js';
import { isEffectiveAdmin } from '../utils/AdminCheck.js';
import { OFFICE_TIER_EXTENSIONS } from '../utils/SubscriptionPlans.js';

import { StartCommandHandler }   from './commands/StartCommandHandler.js';
import { HelpCommandHandler }    from './commands/HelpCommandHandler.js';
import { AboutCommandHandler }   from './commands/AboutCommandHandler.js';
import { AdminCommandHandler }   from './commands/AdminCommandHandler.js';
import { SupportCommandHandler }  from './commands/SupportCommandHandler.js';
import { AdminSupportHandler }    from './commands/AdminSupportHandler.js';
import { FeedbackCommandHandler } from './commands/FeedbackCommandHandler.js';
import { CleanupCommandHandler } from './commands/CleanupCommandHandler.js';
import { SubscribeHandler } from '../payments/SubscribeHandler.js';
import { PackagePurchaseHandler } from '../payments/PackagePurchaseHandler.js';

import { ButtonHandler }         from './buttons/ButtonHandler.js';
import { TextHandler }           from './text/TextHandler.js';
import { DocumentMessageHandler } from './document/DocumentMessageHandler.js';
import { ImagesToPdfAction } from './buttons/actions/ImagesToPdfAction.js';
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
    const subscribeHandler = new SubscribeHandler(this.config, this.localization);
    const packagePurchaseHandler = new PackagePurchaseHandler(this.config, this.localization);
    const cleanupHandler = new CleanupCommandHandler(this.config, this.localization);
    const docHandler     = new DocumentMessageHandler(this.config, this.localApi, this.localization);
    const buttonHandler  = new ButtonHandler(this.config, this.localApi, this.localization);
    const textHandler    = new TextHandler(this.config, this.localApi, this.localization);
    const archiveHandler = new MergeArchiveHandler(this.config, this.localApi, this.localization);
    const adminSupportHandler = new AdminSupportHandler(this.config, this.localization);
    const supportHandler      = new SupportCommandHandler(this.config, this.localization);
    const feedbackHandler = new FeedbackCommandHandler(this.config,this.localization);
    const db = new DatabaseService(this.logger);
    
    this.bot.on('my_chat_member', async (ctx) => {
        
        if(ctx.chat.type !== 'private') return;
        
        const userId    = ctx.myChatMember.from.id;
        const newStatus = ctx.myChatMember.new_chat_member.status;
        
        if(newStatus === 'kicked'){
            
            await db.setBlocked(userId, true);
            await this.logger.logAction('HandlerRegistry:my_chat_member', ctx.from!, 'User blocked the bot', `userId: ${userId}`);
            
        }else if(newStatus === 'member'){
            
            await db.setBlocked(userId, false);
            await this.logger.logAction('HandlerRegistry:my_chat_member', ctx.from!, 'User unblocked the bot', `userId: ${userId}`);
            
        }
        
    });
    
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
          text.startsWith('/post_news')     ||
          text.startsWith('/add_vip')       ||
          text.startsWith('/admin_mode_on') ||
          text.startsWith('/admin_mode_off') ||
          text.startsWith('/admin_report')   ||
          text.startsWith('/admin_user') ||
          text.startsWith('/reset_traffic_all') ||
          text.startsWith('/reset_traffic_user')
      ) {
          await adminHandler.handle(ctx);
          return;
      }
      
      if(text === '/cleanup_inactive'){
        
        await cleanupHandler.handleList(ctx);
        return;
        
      }
      
      if(text.startsWith('/cleanup_inactive_clean')){
        
        const args = text.replace('/cleanup_inactive_clean','').trim();
        await cleanupHandler.handleClean(ctx, args);
        return;
        
      }
      
      if(text === '/cleanup_blocked'){
        
        await cleanupHandler.handleBlockedList(ctx);
        return;
        
      }
      
      if(text.startsWith('/cleanup_blocked_clean')){
        
        const args = text.replace('/cleanup_blocked_clean','').trim();
        await cleanupHandler.handleBlockedClean(ctx, args);
        return;
        
      }
      
      if(text === '/backfill_blocked'){
        
        await cleanupHandler.handleBackfillBlocked(ctx);
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
      
      if (text.startsWith('/message')) {
        const args = text.replace('/message', '').trim();
        await adminSupportHandler.handleMessage(ctx, args);
        return;
    }
      
      if(ctx.from?.id === this.config.adminId && text.startsWith('/') && text !== '/cancel'){
        
        await ctx.reply(`❓ Unknown command: <code>${text.split(' ')[0]}</code>`, {parse_mode: 'HTML'});
        return;
        
      }
      
      const step = ctx.session.step;
      const awaitingInput = step === 'waiting_for_password' ||
      step === 'waiting_for_split_pages' ||
      step === 'waiting_for_long_image_pages' ||
      step === 'waiting_for_long_image_bulk' ||
      step === 'waiting_for_merge_confirm' ||
      step === 'waiting_for_merge_bulk' ||
      step === 'waiting_for_metadata_confirm' ||
      step === 'waiting_for_metadata_mode' ||
      step === 'waiting_for_search_query' ||
      step === 'waiting_for_rename';
      
      if(awaitingInput && !this.localization.isCancelFamilyButton(text) && text !== '/cancel'){
        
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
      const i18n   = this.localization.get();
      
      if(this.localization.getSubscriptionPlanByButton(text) || this.localization.isCancelFamilyButton(text)){
        
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
            
            if (data.startsWith('sub_info:')) {
                const plan = data.replace('sub_info:', '');
                await subscribeHandler.handlePlanPeriods(ctx, plan);
                return;
            }

            if (data.startsWith('set_currency:')) {
                const currency = data.replace('set_currency:', '');
                await subscribeHandler.handleCurrencySelected(ctx, currency);
                return;
            }

            if (data.startsWith('admin_logs:')) {
                await ctx.answerCallbackQuery();
                if(ctx.from?.id !== this.config.adminId) return;
                const target = data.replace('admin_logs:', '') as 'bot' | 'worker';
                await buttonHandler.handleAdminLogs(ctx, target);
                return;
            }

            if (data === 'my_stats') {
                await buttonHandler.handleMyStats(ctx);
                return;
            }

            if (data === 'pdf_stats') {
                await buttonHandler.handlePdfStats(ctx);
                return;
            }

            if (data === 'convert_to:office') {
                await ctx.answerCallbackQuery();
                const i18n = this.localization.get();
                await ctx.reply(i18n.messages.convert_menu.prompt_office, {reply_markup: buttonHandler.keyboards.getBackOnlyMenu()});
                return;
            }

            if (data === 'convert_to:images') {
                await ctx.answerCallbackQuery();
                const i18n = this.localization.get();
                await ctx.reply(i18n.messages.convert_menu.prompt_images, {reply_markup: buttonHandler.keyboards.getBackOnlyMenu()});
                return;
            }
 
            if (data === 'sub_info_back') {
                await ctx.answerCallbackQuery();
                await ctx.deleteMessage().catch(() => {});
                return;
            }
 
            if(data.startsWith('cancel_confirm:')){

                const choice = data.replace('cancel_confirm:', '');

                if(choice === 'yes'){
                    await buttonHandler.handleCancelConfirmed(ctx);
                }else{
                    await buttonHandler.handleCancelDeclined(ctx);
                }

                return;

            }
 
            if (data.startsWith('subscribe:')) {
                const parts  = data.replace('subscribe:', '').split(':');
                const plan   = parts[0];
                const period = parts[1] || 'monthly';
                await subscribeHandler.handleSubscribeCallback(ctx, plan, period);
                return;
            }
            
            if (data.startsWith('buy_package:')) {
                const packageId = data.replace('buy_package:', '');
                await packagePurchaseHandler.handleBuyPackage(ctx, packageId);
                return;
            }
            
            if (data === 'buy_package_menu') {
                await ctx.answerCallbackQuery();
                await packagePurchaseHandler.showPackageMenu(ctx);
                return;
            }
            
            if (data.startsWith('package_page:')) {
                const page = data.replace('package_page:', '') === '2' ? 2 : 1;
                await packagePurchaseHandler.switchPackagePage(ctx, page);
                return;
            }
            
            if(data.startsWith('protect:')){
 
              const method = data.replace('protect:', '') as 'password' | 'asymmetric';
              const i18n   = this.localization.get();
              await ctx.answerCallbackQuery();
              await ctx.deleteMessage().catch(() => {});

              ctx.session.tempParams.protectMethod = method;

              if(method === 'password'){

                  ctx.session.step = 'waiting_for_password';
                  await ctx.reply(i18n.messages.actions.protect.ask_protect, {
                      parse_mode:   'HTML',
                      reply_markup: buttonHandler.keyboards.getBackOnlyMenu(),
                  });

              }else{

                  ctx.session.currentAction = 'asymmetric';
                  ctx.session.step          = 'processing';

                  const { AsymmetricProtectAction } = await import('./buttons/actions/AsymmetricProtectAction.js');
                  await new AsymmetricProtectAction(ctx, buttonHandler).execute();

              }

              return;

          }

          if(data.startsWith('unlock:')){

              const method = data.replace('unlock:', '') as 'password' | 'asymmetric';
              const i18n   = this.localization.get();
              await ctx.answerCallbackQuery();
              await ctx.deleteMessage().catch(() => {});

              ctx.session.tempParams.unlockMethod = method;

              if(method === 'password'){

                  ctx.session.currentAction = 'unlock';
                  ctx.session.step          = 'waiting_for_password';
                  await ctx.reply(i18n.messages.actions.unlock.ask_unlock_password, {
                      parse_mode:   'HTML',
                      reply_markup: buttonHandler.keyboards.getBackOnlyMenu(),
                  });

              }else{

                  const { AsymmetricUnlockAction } = await import('./buttons/actions/AsymmetricUnlockAction.js');
                  await new AsymmetricUnlockAction(ctx, buttonHandler).askForPrivateKey();

              }

              return;

          }
            await ctx.answerCallbackQuery();
      
    });
    
    this.bot.on('message:document', async (ctx) => {
      
      const step = ctx.session.step;

      if(step === 'waiting_for_private_key'){

          const { AsymmetricUnlockAction } = await import('./buttons/actions/AsymmetricUnlockAction.js');
          await new AsymmetricUnlockAction(ctx, buttonHandler).handlePrivateKeyUpload();
          return;

      }

      if(step === 'waiting_for_encrypted_key'){

          const { AsymmetricUnlockAction } = await import('./buttons/actions/AsymmetricUnlockAction.js');
          await new AsymmetricUnlockAction(ctx, buttonHandler).handleEncryptedKeyUpload();
          return;

      }
  
      if(step === 'waiting_for_merge_archive') {
        
          if(archiveHandler.isArchive(ctx)) {
            
              await archiveHandler.handle(ctx);
              
          } else {
            
              await ctx.reply(this.localization.get().errors.not_archive, {parse_mode:'HTML'});
              
          }
          
          return;
      }
      
      if(step === 'waiting_for_long_image_bulk' || step === 'waiting_for_long_image_files'){
 
        if(docHandler.isSupportedDocument(ctx)){

            await docHandler.handleBulkLongImageFile(ctx);

        }else{

            await ctx.reply(this.localization.get().errors.not_pdf, {parse_mode: 'HTML'});

        }

        return;

    }
  
      if(step === 'waiting_for_merge_bulk' || step === 'waiting_for_merge_files') {
        
          if(docHandler.isSupportedDocument(ctx)) {
            
              await docHandler.handleBulkMergeFile(ctx);
              
          } else {
            
              await ctx.reply(this.localization.get().errors.not_pdf, {parse_mode:'HTML'});
              
          }
          
          return;
      }
  
      if(docHandler.isImageDocument(ctx)){
          
          await new ImagesToPdfAction(ctx, buttonHandler).handleImageDocument();
          return;
          
      }
      
      const officeFileName = (ctx.message as any)?.document?.file_name || '';
      const officeExt = officeFileName.includes('.') ? officeFileName.split('.').pop()!.toLowerCase() : '';
      if(officeExt && OFFICE_TIER_EXTENSIONS['business'].includes(officeExt)){
          
          const { OfficeToPdfAction } = await import('./buttons/actions/OfficeToPdfAction.js');
          await new OfficeToPdfAction(ctx, buttonHandler).handleDocument();
          return;
          
      }
      
      if(docHandler.isSupportedDocument(ctx)) {
          await docHandler.handle(ctx);
      }
      
    });
    
    this.bot.on('message:photo', async (ctx) => {
        
        await new ImagesToPdfAction(ctx, buttonHandler).handlePhoto();
        
    });
    
    this.bot.on(['message:voice', 'message:video', 'message:sticker',
      'message:audio', 'message:animation', 'message:video_note'],async (ctx)=>{
        
        const isAdmin = isEffectiveAdmin(ctx, this.config.adminId);
        const i18n    = this.localization.get();
        
        await this.logger.logAction(
          'HandlerRegistry', ctx.from!, 'Unsupported media',
          Object.keys(ctx.message || {}).filter(k => !['message_id', 'from', 'chat', 'date'].includes(k)).join(', ')
        );
        
        try { await ctx.deleteMessage(); } catch {}

        await ctx.reply(i18n.errors.not_pdf, {
            parse_mode:   'HTML',
            reply_markup: new Keyboards(this.localization).getMainMenu(isAdmin),
        });
        
      });
    
  }
  
}
