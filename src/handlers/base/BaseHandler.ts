import { InputFile }           from 'grammy';
import type { IBotConfig }     from '../../config/interfaces/IBotConfig.js';
import type { LocalApi }       from '../../types/LocalApi.js';
import type { BotContext }     from '../../types/BotContext.js';
import { LocalizationService } from '../../services/LocalizationService.js';
import { LoggerService }       from '../../services/LoggerService.js';
import { DatabaseService }     from '../../services/DatabaseService.js';
import { FileService }         from '../../services/FileService.js';
import { Keyboards }           from '../../services/Keyboards.js';
import { PdfWorkerService }    from '../../services/PdfWorkerService.js';
import { SmartQueueService }   from '../../services/SmartQueueService.js';
import { isEffectiveAdmin }    from '../../utils/AdminCheck.js';

export abstract class BaseHandler{
    
    protected readonly logger:LoggerService;
    protected readonly db:DatabaseService;
    protected readonly fileService:FileService;
    public readonly keyboards:Keyboards;
    protected readonly worker:PdfWorkerService;
    
    constructor(protected readonly config:IBotConfig,protected readonly localApi:LocalApi, protected readonly localization:LocalizationService){
        
        this.logger = new LoggerService(this.config);
        this.db = new DatabaseService(this.logger);
        this.keyboards = new Keyboards(this.localization);
        this.fileService = new FileService(this.config,this.localApi);
        this.worker = new PdfWorkerService(this.config,SmartQueueService.getInstance(this.localization,this.db));
        
    }
    
    protected getI18n(){
        
        return this.localization.get();
        
    }
    
    protected async registerUser(ctx:any):Promise<void>{
        
        await this.db.registerUser(ctx.from!.id,ctx.from!.username,ctx.from!.first_name,this.localization.getLang());
        
    }
    
    protected isAdmin(ctx:any):boolean{
        
        return isEffectiveAdmin(ctx, this.config.adminId);
        
        
    }
    
    protected async isFreeUser(ctx:BotContext):Promise<boolean>{
        
        if(ctx.session.adminMode) return false;
        if(ctx.session.simulateUser) return ctx.session.simulatedPlan === 'free';
        const user = await this.db.getUser(ctx.from!.id);
        if(!user) return true;
        if(user.isVip === 1) return false;
        if(user.subType && user.subType !== 'free') return false;
        
        return true;
        
    }
    
    protected async isPaidUser(ctx:BotContext):Promise<boolean>{
        
        if(ctx.session.adminMode) return true;
        if(ctx.session.simulateUser) return ctx.session.simulatedPlan !== 'free';
        const user = await this.db.getUser(ctx.from!.id);
        if(!user) return false;
        if(user.isVip === 1) return true;
        if(user.subType && user.subType !== 'free') return true;
        return false;
        
    }
    
    protected async sendDocumentWithWatermark(ctx:BotContext,filePath:string,fileName:string,extra?:Parameters<BotContext['replyWithDocument']>[1]):Promise<void>{
        
        const free = await this.isFreeUser(ctx);
        const sendPath = free ? await this.worker.applyWatermark(filePath) : filePath;
        
        await ctx.replyWithDocument(new InputFile(sendPath,fileName),extra);
        
        if(free && sendPath !== filePath){
            
            await this.fileService.deleteFile(sendPath);
            
        }
        
    }
    
    protected async sendDocumentWithMetadata(ctx:BotContext,filePath:string,fileName:string,extra?:Parameters<BotContext['replyWithDocument']>[1]):Promise<void>{
        
        const free = await this.isFreeUser(ctx);
        const sendPath = free ? await this.worker.stampMetadata(filePath) : filePath;
        
        await ctx.replyWithDocument(new InputFile(sendPath,fileName),extra);
        
        if(free && sendPath !== filePath){
            
            await this.fileService.deleteFile(sendPath);
            
        }
        
    }
    
    protected async sendDocumentWithWatermarkAndMetadata(ctx:BotContext,filePath:string,fileName:string,extra?:Parameters<BotContext['replyWithDocument']>[1]):Promise<void>{
        
        const free = await this.isFreeUser(ctx);
        
        if(!free){
            
            await ctx.replyWithDocument(new InputFile(filePath,fileName),extra);
            return;
            
        }
        
        const watermarkedPath = await this.worker.applyWatermark(filePath);
        const finalPath = await this.worker.stampMetadata(watermarkedPath);
        
        await ctx.replyWithDocument(new InputFile(finalPath,fileName),extra);
        
        if(watermarkedPath !== filePath){
            
            await this.fileService.deleteFile(watermarkedPath).catch(()=>{});
            
        }
        
        if(finalPath !== watermarkedPath && finalPath !== filePath){
            
            await this.fileService.deleteFile(finalPath).catch(()=>{});
            
        }
        
    }
    
}
