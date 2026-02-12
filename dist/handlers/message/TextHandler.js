import { LocalizationService } from '../../services/LocalizationService.js';
import { PdfWorkerService } from '../../services/PdfWorkerService.js';
import { FileService } from '../../services/FileService.js';
import { InputFile } from 'grammy';
import { initialSession } from '../../types/SessionData.js';
import { FileNameUtils } from '../../utils/FileNameUtils.js';
import { Keyboards } from '../../services/Keyboards.js';
import { LoggerService } from '../../services/LoggerService.js';
import { DatabaseService } from '../../services/DatabaseService.js';
export class TextHandler {
    config;
    localApi;
    localization;
    workerService;
    fileService;
    keyboards;
    logger;
    db;
    constructor(config, localApi, localization) {
        this.config = config;
        this.localApi = localApi;
        this.localization = localization;
        this.workerService = new PdfWorkerService(this.config);
        this.fileService = new FileService(this.config, this.localApi);
        this.keyboards = new Keyboards(this.localization);
        this.logger = new LoggerService(this.config);
        this.db = new DatabaseService(this.logger);
    }
    async handle(ctx) {
        const { lang } = this.localization.getUserLanguage(ctx.from?.language_code);
        const text = ctx.message?.text;
        if (!text)
            return;
        if (ctx.from) {
            await this.db.registerUser(ctx.from.id, ctx.from.username, ctx.from.first_name);
        }
        if (text.startsWith('/') || this.localization.getActionKeyByText(text))
            return;
        const action = ctx.session.currentAction;
        const step = ctx.session.step;
        const logText = (step === 'waiting_for_password') ? '***PASSWORD***' : text;
        this.logger.logToFile('system/text.log', `TEXT | User: ${ctx.from?.id} | Action: ${action} | Content: ${logText}`);
        if (action === 'protect' && step === 'waiting_for_password') {
            const password = text.trim();
            if (password.length < 1) {
                await ctx.reply(this.localization.t(lang, 'password_empty'));
                return;
            }
            const filePath = ctx.session.filePaths[0];
            if (!filePath) {
                await ctx.reply(this.localization.t(lang, 'file_lost'));
                ctx.session = initialSession();
                return;
            }
            const statusMsg = await ctx.reply(this.localization.t(lang, 'set_encrypt'));
            let resultPath = null;
            try {
                resultPath = await this.workerService.encrypt(filePath, password);
                await this.db.logAction(ctx.from.id, 'protect', 0);
                const suffix = this.localization.t(lang, 'suffix_protected');
                const originalName = ctx.session.tempParams?.originalName || 'Document.pdf';
                const safeName = FileNameUtils.getSafeName(originalName, suffix);
                const safePassword = FileNameUtils.escapeHtml(password);
                await ctx.replyWithDocument(new InputFile(resultPath, safeName), {
                    caption: this.localization.t(lang, 'encrypt_caption_finished'),
                    parse_mode: 'HTML',
                    reply_markup: this.keyboards.getMainMenu(lang)
                });
                await this.fileService.deleteFile(filePath);
                await this.fileService.deleteFile(resultPath);
                ctx.session = initialSession();
            }
            catch (e) {
                await this.logger.logToTelegram(`Protect Error: ${e.message}`, 'TextHandler', { user: ctx.from, message: ctx.message, errorText: e.message, botName: this.config.botName });
                ctx.session = initialSession();
            }
            finally {
                await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => { });
            }
        }
        else if (action === 'unlock' && step === 'waiting_for_password') {
            const password = text.trim();
            const filePath = ctx.session.filePaths[0];
            if (!filePath) {
                await ctx.reply(this.localization.t(lang, 'file_lost'));
                return;
            }
            const statusMsg = await ctx.reply(this.localization.t(lang, 'decrypting'));
            try {
                const resultPath = await this.workerService.decrypt(filePath, password);
                this.db.logAction(ctx.from.id, 'unlock', 0);
                const safeName = FileNameUtils.getSafeName(ctx.session.tempParams?.originalName || 'doc.pdf', '');
                await ctx.replyWithDocument(new InputFile(resultPath, safeName), {
                    caption: this.localization.t(lang, 'decrypt_success'),
                    parse_mode: 'HTML',
                    reply_markup: this.keyboards.getMainMenu(lang)
                });
                await this.fileService.deleteFile(resultPath);
                await this.fileService.deleteFile(filePath);
                ctx.session = initialSession();
            }
            catch (e) {
                await ctx.reply(this.localization.t(lang, 'decrypt_fail'));
                this.logger.logToFile('system/auth.log', `DECRYPT FAIL | User: ${ctx.from?.id} | Wrong pass entered`);
            }
            finally {
                await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => { });
            }
        }
    }
}
