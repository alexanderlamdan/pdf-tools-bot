import { Context } from "grammy";
import type {IBotConfig} from '../../config/interfaces/IBotConfig.js';
import type { LocalApi } from "../../types/LocalApi.js";
import { FileService } from "../../services/FileService.js";
import { PdfWorkerService } from "../../services/PdfWorkerService.js";
import { LocalizationService } from "../../services/LocalizationService.js";
import { LoggerService } from "../../services/LoggerService.js";

export class DocumentMessageHandler {
  private readonly fileService: FileService;
  private readonly workerService: PdfWorkerService;
  private readonly localization: LocalizationService;
  private readonly logger: LoggerService;

  constructor(
    private readonly config: IBotConfig,
    private readonly localApi: LocalApi,
    localization: LocalizationService
  ) {
    this.localization = localization;
    this.fileService = new FileService(this.config, this.localApi);
    this.workerService = new PdfWorkerService(this.config);
    this.logger = new LoggerService(this.config);
  }

  public isSupportedDocument(ctx: Context): boolean {
    return ctx.message?.document?.mime_type === "application/pdf";
  }

  async handle(ctx: Context) {
    const document = ctx.message?.document;
    if (!document) return;
    
    const { lang } = this.localization.getUserLanguage(ctx.from?.language_code);

    // 2. ЛОГГИРОВАНИЕ: Начало обработки
    const logInfo = `FILE_ID:${document.file_id} | NAME:${document.file_name} | SIZE:${document.file_size}`;
    
    await this.logger.logToTelegram(
        `📄 <b>PDF Document Received</b>\nName: ${document.file_name}\nSize: ${document.file_size} bytes\nLang: ${lang}`,
        'DocumentHandler INFO',
        {
            user: ctx.from!,
            message: ctx.message!,
            errorText: 'Start processing...',
            botName: ctx.me?.username ?? 'unknown'
        }
    );
    this.logger.logToFile('system/document-process.log', `START PROCESS | USER:${ctx.from!.id} | ${logInfo}`);

    const statusMsg = await ctx.reply("<b>Processing...</b>", { parse_mode: "HTML" });

    let localPath: string | null = null;

    try {
      localPath = await this.fileService.downloadFile(ctx, document.file_id);
      this.logger.logToFile('system/document-process.log', `DOWNLOADED | Path: ${localPath}`);
      
      const infoText = await this.workerService.getPdfInfo(localPath);
      this.logger.logToFile('system/document-process.log', `WORKER RESPONSE | Length: ${infoText.length} chars`);

      await ctx.api.editMessageText(
        ctx.chat!.id,
        statusMsg.message_id,
        `${this.localization.t(lang, 'pdf_info')}\n${infoText}`,
        { parse_mode: "HTML" }
      );
      this.logger.logToFile('system/document-process.log', `SUCCESS | INFO SENT to User ${ctx.from!.id}`);
      
    } catch (e: any) {
      
      const errorStack = e.stack ?? e.message;
      console.error("Error in Document Handler", e);

      await this.logger.logToTelegram(
        `❌ <b>Error Processing PDF</b>\n${e.message}`,
        'Error in DocumentHandler',
        {
            user: ctx.from!,
            message: ctx.message!,
            errorText: errorStack,
            botName: ctx.me?.username ?? 'unknown'
        }
      );
      this.logger.logToFile('system/document-errors.log', `ERROR | User:${ctx.from!.id} | File:${document.file_name} | ${e.message}`);
      
      await ctx.api.editMessageText(
        ctx.chat!.id,
        statusMsg.message_id,
        `<b>Error:</b> ${e.message}`,
        { parse_mode: "HTML" }
      );
     } //finally {
    //   if (localPath) this.fileService.deleteFile(localPath);
    // }
  }
}
