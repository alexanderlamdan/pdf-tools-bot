import type { BotContext } from "../../types/BotContext.js";
import type {IBotConfig} from '../../config/interfaces/IBotConfig.js';
import type { LocalApi } from "../../types/LocalApi.js";
import { FileService } from "../../services/FileService.js";
import { PdfWorkerService } from "../../services/PdfWorkerService.js";
import { LocalizationService } from "../../services/LocalizationService.js";
import { LoggerService } from "../../services/LoggerService.js";
import { initialSession} from "../../types/SessionData.js";
import { InputFile } from "grammy";
import { Keyboards } from "../../services/Keyboards.js";
import { FileNameUtils } from "../../utils/FileNameUtils.js";
import fs from 'fs';
import { DatabaseService } from "../../services/DatabaseService.js";

export class DocumentMessageHandler {
  private readonly fileService: FileService;
  private readonly workerService: PdfWorkerService;
  private readonly localization: LocalizationService;
  private readonly logger: LoggerService;
  private readonly keyboards:Keyboards;
  private readonly db:DatabaseService;

  constructor(
    private readonly config: IBotConfig,
    private readonly localApi: LocalApi,
    localization: LocalizationService
  ) {
    this.localization = localization;
    this.fileService = new FileService(this.config, this.localApi);
    this.workerService = new PdfWorkerService(this.config);
    this.logger = new LoggerService(this.config);
    this.keyboards = new Keyboards(this.localization);
    this.db = new DatabaseService(this.logger);
  }

  public isSupportedDocument(ctx: BotContext): boolean {
    return ctx.message?.document?.mime_type === "application/pdf";
  }
  
  async handle(ctx:BotContext){
    
    const document = ctx.message?.document;
    if(!document) return;
    
    const {lang} = this.localization.getUserLanguage(ctx.from?.language_code);
    
    if(document.mime_type !== 'application/pdf'){
      
      await this.logger.logToTelegram(
        `🗑 <b>TRASH FILE REJECTED</b>\nUser: <code>${ctx.from?.id}</code>\nName: ${document.file_name}\nMime: ${document.mime_type}`,
        'Log: Trash',
        { user: ctx.from!, message: ctx.message!, botName: this.config.botName, errorText: 'File is not PDF' }
      );
      
      try { await ctx.deleteMessage(); } catch (e) {}
      await ctx.reply(this.localization.t(lang, 'file_rejected'), {
        parse_mode: 'HTML',
        reply_markup: this.keyboards.getMainMenu(lang)
    });
    return;
      
    }
    
    await this.db.registerUser(ctx.from!.id, ctx.from!.username, ctx.from!.first_name);
    await this.db.logAction(ctx.from!.id, 'upload', document.file_size || 0);
    
    await this.logger.logToTelegram(
            `📄 <b>File Received</b>\nName: ${document.file_name}\nSize: ${(document.file_size! / 1024 / 1024).toFixed(2)} MB`,
            'DocumentHandler',
            { user: ctx.from!, message: ctx.message!, errorText: 'Start Analysis', botName: this.config.botName }
        );
    await this.logger.logToFile('system/document.log', `RECEIVED | User: ${ctx.from?.id} | File: ${document.file_name}`);
    
    const statusMsg = await ctx.reply(this.localization.t(lang,'analyzing'),{
      
      parse_mode:'HTML',
      reply_markup:{remove_keyboard:true}
      
    });
    
    let localPath:string | null = null;
    
    try{
      
      localPath = await this.fileService.downloadFile(ctx,document.file_id);
      const infoText = await this.workerService.getPdfInfo(localPath,lang);
      
      const isEncrypted = infoText.includes('Protected PDF') || infoText.includes('Encrypted') || infoText.includes('Зашифрован') || infoText.includes('מוצפן');
      
      ctx.session.filePaths = [localPath];
      ctx.session.tempParams = {originalName:document.file_name};
      
      await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id);
      
      if(isEncrypted){
        
        ctx.session.currentAction = 'unlock';
        
        await ctx.reply(this.localization.t(lang,'analysis_encrypted'),{
          parse_mode:'HTML',
          reply_markup:this.keyboards.getEncryptedFileMenu(lang)
        });
        
      }else{
        
        const pagesMatch = infoText.match(/(\d+)/);
        const pages = pagesMatch ? pagesMatch[0] : "?";
        const sizeMB = (document.file_size! / 1024 / 1024).toFixed(2);
        
        const msgText = this.localization.t(lang,'analysis_success').replace('{{name}}',FileNameUtils.escapeHtml(document.file_name || 'document.pdf')).replace('{{size}}',sizeMB).replace('{{pages}}',pages).replace('{{protected}}',this.localization.t(lang,'no'));
        
        ctx.session.currentAction = 'ready';
        
        await ctx.reply(msgText,{
          
          parse_mode:'HTML',
          reply_markup:this.keyboards.getFileActionsMenu(lang)
          
        });
        localPath = null;
        
      }
      
    }catch(e:any){
      
      console.error(e);
      const isCorrupt = e.message.includes('invalid') || e.message.includes('corrupt');
      const errorKey = isCorrupt ? 'analysis_corrupt' : 'file_lost';
      const errorText = isCorrupt ? this.localization.t(lang,'analysis_corrupt') : `Error: ${e.message}`;
      
      await this.logger.logToTelegram(
                `❌ <b>Analysis Failed</b>\n${e.message}`,
                'DocumentHandler Error',
                { user: ctx.from!, message: ctx.message!, errorText: e.stack, botName: this.config.botName }
      );
      
      await ctx.api.editMessageText(ctx.chat!.id,statusMsg.message_id,errorText,{parse_mode:'HTML'});
      
      if(localPath) await this.fileService.deleteFile(localPath);
      ctx.session = initialSession();
      
    }
    
  }
  
}
