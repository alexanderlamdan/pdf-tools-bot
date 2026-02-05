import { LocalizationService } from "../../services/LocalizationService.js";
import { initialSession } from "../../types/SessionData.js";
import { PdfWorkerService } from "../../services/PdfWorkerService.js";
import { FileService } from "../../services/FileService.js";
import { InputFile } from "grammy";
import { FileNameUtils } from "../../utils/FileNameUtils.js";
import { Keyboards } from "../../services/Keyboards.js";
import { LoggerService } from "../../services/LoggerService.js";
export class ButtonHandler {
    config;
    localApi;
    localization;
    workerService;
    fileService;
    keyboards;
    logger;
    constructor(config, localApi, localization) {
        this.config = config;
        this.localApi = localApi;
        this.localization = localization;
        this.workerService = new PdfWorkerService(this.config);
        this.fileService = new FileService(this.config, this.localApi);
        this.keyboards = new Keyboards(this.localization);
        this.logger = new LoggerService(this.config);
    }
    async handle(ctx) {
        const text = ctx.message?.text;
        if (!text)
            return;
        const actionKey = this.localization.getActionKeyByText(text);
        if (!actionKey)
            return;
        const { lang } = this.localization.getUserLanguage(ctx.from?.language_code);
        this.logger.logToFile('system/buttons.log', `BUTTON CLICK | User: ${ctx.from?.id} | Key: ${actionKey}`);
        await this.logger.logToTelegram(`❌ <b>BUTTON CLICK|User</b>\n${ctx.from?.id}`, `Key: ${actionKey}`, { user: ctx.from, message: ctx.message, botName: this.config.botName });
        if (actionKey === 'btn_cancel' || text === '/cancel') {
            if (ctx.session.filePaths) {
                for (const path of ctx.session.filePaths) {
                    await this.fileService.deleteFile(path);
                }
            }
            ctx.session = initialSession();
            await ctx.reply("❌", { reply_markup: { remove_keyboard: true } });
            await ctx.reply(this.localization.t(lang, 'start_message'), {
                reply_markup: this.keyboards.getMainMenu(lang)
            });
            return;
        }
        const hasFile = ctx.session.filePaths && ctx.session.filePaths.length > 0;
        const localPath = hasFile ? ctx.session.filePaths[0] : null;
        const originalName = ctx.session.tempParams?.originalName || 'document.pdf';
        if (actionKey === 'btn_unlock') {
            if (!hasFile) {
                await ctx.reply(this.localization.t(lang, 'file_lost'));
                return;
            }
            const statusMsg = await ctx.reply(this.localization.t(lang, 'cracking_proccess'), {
                parse_mode: 'HTML'
            });
            try {
                const crackResult = await this.workerService.crack(localPath);
                const safeName = FileNameUtils.getSafeName(originalName, '');
                await ctx.reply(this.localization.t(lang, 'crack_success').replace('{{password}}', crackResult.password), {
                    parse_mode: 'HTML'
                });
                await ctx.replyWithDocument(new InputFile(crackResult.path, safeName), {
                    reply_markup: this.keyboards.getMainMenu(lang)
                });
                await this.fileService.deleteFile(crackResult.path);
                await this.fileService.deleteFile(localPath);
                ctx.session = initialSession();
            }
            catch (e) {
                await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id);
                await ctx.reply(this.localization.t(lang, 'manual_pass_req'), {
                    parse_mode: 'HTML',
                    reply_markup: {
                        force_reply: true
                    }
                });
                ctx.session.currentAction = 'unlock';
                ctx.session.step = 'waiting_for_password';
            }
            return;
        }
        if (actionKey === 'btn_compress') {
            if (!hasFile) {
                ctx.session.currentAction = 'compress';
                await ctx.reply(this.localization.t(lang, 'btn_compress_reply'));
                return;
            }
            const statusMsg = await ctx.reply(this.localization.t(lang, 'compress_info_proccess'), {
                parse_mode: 'HTML'
            });
            try {
                const resultPath = await this.workerService.compress(localPath);
                const safeName = FileNameUtils.getSafeName(originalName, this.localization.t(lang, 'suffix_compressed'));
                await ctx.replyWithDocument(new InputFile(resultPath, safeName), {
                    reply_markup: this.keyboards.getMainMenu(lang)
                });
                await this.fileService.deleteFile(resultPath);
                await this.fileService.deleteFile(localPath);
                ctx.session = initialSession();
            }
            catch (e) {
                await ctx.reply(`Error: ${e.message}`);
                await this.logger.logToTelegram(`Compress Error: ${e.message}`, 'ButtonHandler', { user: ctx.from, message: ctx.message, errorText: e.message, botName: this.config.botName });
            }
            finally {
                await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => { });
            }
            return;
        }
        if (actionKey === 'btn_protect') {
            if (!hasFile) {
                await ctx.reply(this.localization.t(lang, 'file_lost'));
                return;
            }
            ctx.session.currentAction = 'protect';
            ctx.session.step = 'waiting_for_password';
            await ctx.reply(this.localization.t(lang, 'set_password'), {
                parse_mode: 'HTML',
                reply_markup: { force_reply: true }
            });
            return;
        }
        if (actionKey === 'btn_help') {
            await ctx.reply(this.localization.t(lang, 'help_message'), { parse_mode: 'HTML' });
        }
    }
}
