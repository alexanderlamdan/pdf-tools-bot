import { LocalizationService } from '../../services/LocalizationService.js';
import { PdfWorkerService } from '../../services/PdfWorkerService.js';
import { FileService } from '../../services/FileService.js';
import { InputFile } from 'grammy';
import { initialSession } from '../../types/SessionData.js';
import { FileNameUtils } from '../../utils/FileNameUtils.js';
import { Keyboards } from '../../services/Keyboards.js';
export class TextHandler {
    config;
    localApi;
    localization;
    workerService;
    fileService;
    keyboards;
    constructor(config, localApi, localization) {
        this.config = config;
        this.localApi = localApi;
        this.localization = localization;
        this.workerService = new PdfWorkerService(this.config);
        this.fileService = new FileService(this.config, this.localApi);
        this.keyboards = new Keyboards(this.localization);
    }
    async handle(ctx) {
        const { lang } = this.localization.getUserLanguage(ctx.from?.language_code);
        const text = ctx.message?.text;
        if (!text)
            return;
        if (text.startsWith('/') || this.localization.getActionKeyByText(text))
            return;
        const action = ctx.session.currentAction;
        const step = ctx.session.step;
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
            try {
                await ctx.deleteMessage();
            }
            catch (e) { }
            const statusMsg = await ctx.reply(this.localization.t(lang, 'set_encrypt'));
            let resultPath = null;
            try {
                resultPath = await this.workerService.encrypt(filePath, password);
                const suffix = this.localization.t(lang, 'suffix_protected');
                const originalName = ctx.session.tempParams?.originalName || 'Document.pdf';
                const safeName = FileNameUtils.getSafeName(originalName, suffix);
                const safePassword = FileNameUtils.escapeHtml(password);
                await ctx.replyWithDocument(new InputFile(resultPath, safeName), {
                    caption: this.localization.t(lang, 'encrypt_caption_finished'),
                    parse_mode: 'HTML',
                    reply_markup: this.keyboards.getMainMenu(lang)
                });
                ctx.session = initialSession();
            }
            catch (e) {
                await ctx.reply(`Error: ${e.message}`);
                ctx.session = initialSession();
            }
            finally {
                await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => { });
                if (filePath)
                    await this.fileService.deleteFile(filePath);
                if (resultPath)
                    await this.fileService.deleteFile(resultPath);
            }
        }
    }
}
