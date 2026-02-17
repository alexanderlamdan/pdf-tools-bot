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
    const isAdmin = ctx.from?.id === this.config.adminId;
    
    if(document.mime_type !== 'application/pdf'){
      
      await this.logger.logAction(ctx.from!, 'Trash upload',`Rejected: ${document.file_name}(${document.mime_type})`);
      
      try { await ctx.deleteMessage(); } catch (e) {}
      await ctx.reply(this.localization.t(lang, 'errors.not_pdf'), {
        parse_mode: 'HTML',
        reply_markup: this.keyboards.getMainMenu(lang,isAdmin)
    });
    return;
      
    }
    
    await this.db.registerUser(ctx.from!.id, ctx.from!.username, ctx.from!.first_name);
    await this.db.logAction(ctx.from!.id, 'upload', document.file_size || 0);
    const sizeMB = (document.file_size! / 1024 / 1024).toFixed(2);
    
    await this.logger.logAction(ctx.from!,'File Upload',`📄 ${document.file_name} | ${sizeMB} MB`);
    
    const statusMsg = await ctx.reply(this.localization.t(lang,'messages.analysis.processing'),{
      
      parse_mode:'HTML',
      reply_markup:{remove_keyboard:true}
      
    });
    
    let localPath:string | null = null;
    
    try{
      
      localPath = await this.fileService.downloadFile(ctx,document.file_id);
      const info = await this.workerService.getPdfInfo(localPath,lang);
      
      ctx.session.filePaths = [localPath];
      ctx.session.tempParams = {originalName:document.file_name};
      
      await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id);
      
      if(info.encrypted){
        
        ctx.session.currentAction = 'unlock';
        await ctx.reply(this.localization.t(lang,'messages.analysis.encrypted'),{
          parse_mode:'HTML',
          reply_markup:this.keyboards.getEncryptedFileMenu(lang)
        });
        
      }else{
        
        const protectedText = this.localization.t(lang,'messages.common.no');
        const msgText = this.localization.t(lang, 'messages.analysis.success')
        .replace('{{name}}', FileNameUtils.escapeHtml(document.file_name || 'document.pdf'))
        .replace('{{size}}', sizeMB)
        .replace('{{pages}}', info.pages.toString())
        .replace('{{protected}}', protectedText);
        
        ctx.session.currentAction = 'ready';
        
        await ctx.reply(msgText,{
          parse_mode:'HTML',
          reply_markup:this.keyboards.getFileActionsMenu(lang)
        });
        
        localPath = null;
        
      }
      
    }catch(e:any){
      
      console.error(e);
      const isCorrupt = e.message?.includes('invalid') || e.message?.includes('corrupt');
      
      await this.logger.error('DocumentHandler',e,{user:ctx.from,message:ctx.message});
      
      const errorKey = isCorrupt ? 'messages.analysis.corrupt' : 'messages.actions.file_lost';
      
      const errorText = isCorrupt ? this.localization.t(lang,errorKey) : `Error: ${e.message}`;
      
      await ctx.api.editMessageText(ctx.chat!.id,statusMsg.message_id,errorText,{parse_mode:'HTML'}).catch(()=>{});
      
      if(localPath) await this.fileService.deleteFile(localPath);
      ctx.session = initialSession();
      
    }
    
  }
}
