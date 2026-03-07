import type { IBotConfig } from '../../config/interfaces/IBotConfig.js';
import type { LocalApi } from '../../types/LocalApi.js';
import { LocalizationService } from '../../services/LocalizationService.js';
import { LoggerService } from '../../services/LoggerService.js';
import { DatabaseService } from '../../services/DatabaseService.js';
import { FileService } from '../../services/FileService.js';
import { Keyboards } from '../../services/Keyboards.js';
import { PdfWorkerService } from '../../services/PdfWorkerService.js';
import { SmartQueueService } from '../../services/SmartQueueService.js';

export abstract class BaseHandler{
    
    protected readonly logger:LoggerService;
    protected readonly db:DatabaseService;
    protected readonly fileService:FileService;
    protected readonly keyboards:Keyboards;
    protected readonly worker:PdfWorkerService;
    
    constructor(protected readonly config:IBotConfig,protected readonly localApi:LocalApi, protected readonly localization:LocalizationService){
        
        this.logger = new LoggerService(this.config);
        this.db = new DatabaseService(this.logger);
        this.keyboards = new Keyboards(this.localization);
        this.fileService = new FileService(this.config,this.localApi);
        this.worker = new PdfWorkerService(this.config,SmartQueueService.getInstance(this.localization,this.db));
        
    }
    
    protected getLang(ctx:any):string{
        
        return this.localization.getUserLanguage(ctx.from?.language_code).lang;
        
    }
    
    protected getI18n(ctx:any){
        
        return this.localization.get(this.getLang(ctx));
        
    }
    
    protected async registerUser(ctx:any):Promise<void>{
        
        const lang = this.getLang(ctx);
        await this.db.registerUser(ctx.from!.id,ctx.from!.username,ctx.from!.first_name,lang);
        
    }
    
    protected isAdmin(ctx:any):boolean{
        
        const realAdmin = ctx.from?.id === this.config.adminId;

        if(!realAdmin) return false;

        if(ctx.session?.simulateUser) return false;
        
        return true;
        
        
    }
    
}
