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
    getI18n() {
        return this.localization.get();
    }
    async registerUser(ctx) {
        await this.db.registerUser(ctx.from.id, ctx.from.username, ctx.from.first_name, this.localization.getLang());
    }
    isAdmin(ctx) {
        const realAdmin = ctx.from?.id === this.config.adminId;
        if (!realAdmin)
            return false;
        if (ctx.session?.simulateUser)
            return false;
        return true;
    }
}
