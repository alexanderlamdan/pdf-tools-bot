import { Context } from "grammy";
import { FileService } from "../../services/FileService.js";
import { PdfWorkerService } from "../../services/PdfWorkerService.js";
export class DocumentMessageHandler {
    config;
    localApi;
    fileService;
    workerService;
    constructor(config, localApi) {
        this.config = config;
        this.localApi = localApi;
        this.fileService = new FileService(this.config, this.localApi);
        this.workerService = new PdfWorkerService(this.config);
    }
    isSupportedDocument(ctx) {
        return ctx.message?.document?.mime_type === "application/pdf";
    }
    async handle(ctx) {
        const document = ctx.message?.document;
        if (!document)
            return;
        const statusMsg = await ctx.reply("<b>Processing...</b>", { parse_mode: "HTML" });
        let localPath = null;
        try {
            localPath = await this.fileService.downloadFile(ctx, document.file_id);
            const infoText = await this.workerService.getPdfInfo(localPath);
            await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, `<b>Information about PDF:</b>\n\n${infoText}`, { parse_mode: "HTML" });
        }
        catch (e) {
            console.error("Error in Document Handler", e);
            await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, `<b>Error:</b> ${e.message}`, { parse_mode: "HTML" });
        }
        finally {
            if (localPath)
                this.fileService.deleteFile(localPath);
        }
    }
}
