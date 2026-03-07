import { LocalizationService } from '../../services/LocalizationService.js';
import { LoggerService } from '../../services/LoggerService.js';
import { DatabaseService } from '../../services/DatabaseService.js';
import { FileService } from '../../services/FileService.js';
import { Keyboards } from '../../services/Keyboards.js';
import { PdfWorkerService } from '../../services/PdfWorkerService.js';
import { SmartQueueService } from '../../services/SmartQueueService.js';
export class BaseHandler {
    config;
    localApi;
    localization;
    logger;
    db;
    fileService;
    keyboards;
    worker;
    constructor(config, localApi, localization) {
        this.config = config;
        this.localApi = localApi;
        this.localization = localization;
        this.logger = new LoggerService(this.config);
        this.db = new DatabaseService(this.logger);
        this.keyboards = new Keyboards(this.localization);
        this.fileService = new FileService(this.config, this.localApi);
        this.worker = new PdfWorkerService(this.config, SmartQueueService.getInstance(this.localization, this.db));
    }
    getLang(ctx) {
        return this.localization.getUserLanguage(ctx.from?.language_code).lang;
    }
    getI18n(ctx) {
        return this.localization.get(this.getLang(ctx));
    }
    async registerUser(ctx) {
        const lang = this.getLang(ctx);
        await this.db.registerUser(ctx.from.id, ctx.from.username, ctx.from.first_name, lang);
    }
    isAdmin(ctx) {
        return ctx.from?.id === this.config.adminId;
    }
}
