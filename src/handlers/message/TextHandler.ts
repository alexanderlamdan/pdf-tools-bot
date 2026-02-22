import type {BotContext} from '../../types/BotContext.js'
import {LocalizationService} from '../../services/LocalizationService.js';
import {PdfWorkerService} from '../../services/PdfWorkerService.js';
import {FileService} from '../../services/FileService.js';
import {InputFile} from 'grammy';
import {initialSession} from '../../types/SessionData.js';
import type {IBotConfig} from '../../config/interfaces/IBotConfig.js';
import type {LocalApi} from '../../types/LocalApi.js';
import { FileNameUtils } from '../../utils/FileNameUtils.js';
import {Keyboards} from '../../services/Keyboards.js';
import { LoggerService } from '../../services/LoggerService.js';
import { DatabaseService} from '../../services/DatabaseService.js';
import fs from 'fs';
import { SmartQueueService } from '../../services/SmartQueueService.js';
export class TextHandler{
    
    private readonly workerService:PdfWorkerService;
    private readonly fileService:FileService;
    private readonly keyboards:Keyboards;
    private readonly logger:LoggerService;
    private readonly db:DatabaseService;
    constructor(
        private readonly config:IBotConfig,
        private readonly localApi:LocalApi,
        private readonly localization:LocalizationService
    ){
        
        this.keyboards = new Keyboards(this.localization);
        this.logger = new LoggerService(this.config);
        this.db = new DatabaseService(this.logger);
        this.workerService = new PdfWorkerService(this.config,SmartQueueService.getInstance(this.localization,this.db));
        this.fileService = new FileService(this.config,this.localApi);
        
    }
    
    async handle(ctx:BotContext){
        
        const {lang} = this.localization.getUserLanguage(ctx.from?.language_code);
        const text = ctx.message?.text;
        const isAdmin = ctx.from?.id === this.config.adminId;
        if(!text) return;
        
        if(ctx.from){
            
            await this.db.registerUser(ctx.from.id,ctx.from.username,ctx.from.first_name,lang);
            
        }
        
        if(text.startsWith('/') || this.localization.getActionKeyByText(text)) return;
        
        const action = ctx.session.currentAction;
        const step = ctx.session.step;
        
        if(action === 'protect' && step === 'waiting_for_password'){
            
            await this.logger.logAction(ctx.from!, 'Input password','***HIDDEN***');
            
            
            const password = text.trim();
            if(password.length < 1){
                
                await ctx.reply(this.localization.t(lang,'errors.password_empty'));
                return;
                
            }
            
            const filePath = ctx.session.filePaths[0];
            if(!filePath){
                
                await ctx.reply(this.localization.t(lang,'messages.actions.file_lost'));
                ctx.session = initialSession();
                return;
                
            }
            
            const statusMsg = await ctx.reply(this.localization.t(lang,'messages.actions.encrypting'));
            let resultPath:string | null = null;
            const sizeBytes = fs.statSync(filePath).size;
            
            try{
                
                resultPath = await this.workerService.encrypt(ctx,filePath,password,sizeBytes);
                const stats = await fs.promises.stat(resultPath);
                await this.db.logAction(ctx.from!.id, 'protect', stats.size);
                
                const suffix = this.localization.t(lang,'messages.actions.suffix_protected');
                const originalName = ctx.session.tempParams?.originalName || 'Document.pdf';
                const safeName = FileNameUtils.getSafeName(originalName,suffix);
                const safePassword = FileNameUtils.escapeHtml(password);
                
                await ctx.replyWithDocument(new InputFile(resultPath,safeName),{
                    
                    caption:this.localization.t(lang,'messages.actions.success_protect'),
                    parse_mode:'HTML',
                    reply_markup:this.keyboards.getMainMenu(lang,isAdmin)
                    
                });
                
                await this.fileService.deleteFile(filePath);
                await this.fileService.deleteFile(resultPath);
                ctx.session = initialSession();
                return;
            }catch(e:any){
                
                const safeError = e as Error;
                if(safeError.message && safeError.message.length > 2000){
                    
                    safeError.message = safeError.message.substring(0,2000) + '... [TRUNCATED]';
                    
                }
                
                await this.logger.error('TextHandler:protect',safeError,{user:ctx.from!,message:ctx.message!});
                ctx.session = initialSession();
                
            }finally{
                
                await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
                
            }
            
            return;
            
        }
        
        else if(action === 'unlock' && step === 'waiting_for_password'){
            
            const password = text.trim();
            const filePath = ctx.session.filePaths[0];
            
            if(!filePath){
                
                await ctx.reply(this.localization.t(lang,'messages.actions.file_lost'));
                return;
                
            }
            
            const statusMsg = await ctx.reply(this.localization.t(lang,'messages.actions.decrypting'));
            const sizeBytes = fs.statSync(filePath).size;
            try{
                
                const resultPath = await this.workerService.decrypt(ctx,filePath, password,sizeBytes);
                const stats = await fs.promises.stat(resultPath);
                this.db.logAction(ctx.from!.id, 'unlock', stats.size);
                const safeName = FileNameUtils.getSafeName(ctx.session.tempParams?.originalName || 'doc.pdf', '');
                
                await ctx.replyWithDocument(new InputFile(resultPath,safeName),{
                    
                    caption:this.localization.t(lang,'messages.actions.success_crack').replace('{{password}}', password),
                    parse_mode:'HTML',
                    reply_markup:this.keyboards.getMainMenu(lang,isAdmin)
                    
                });
                
                await this.fileService.deleteFile(resultPath);
                await this.fileService.deleteFile(filePath);
                ctx.session = initialSession();
                return;
            }catch(e:any){
                
                await ctx.reply(this.localization.t(lang,'messages.actions.decrypt_fail'));
                await this.logger.logAction(ctx.from!,'Unlock Failed','Wrong password');
                
            }finally{
                
                await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
                
            }
            
            return;
            
        }
        
        else if(action === 'split' && step === 'waiting_for_split_pages'){
            
            const pages = text.trim();
            const filePath = ctx.session.filePaths[0];
            
            if(!filePath){
                
                await ctx.reply(this.localization.t(lang,'messages.actions.file_lost'),{parse_mode:'HTML'});
                ctx.session = initialSession();
                return;
                
            }
            
            const statusMsg = await ctx.reply(this.localization.t(lang,'messages.action.processing'),{parse_mode:'HTML'});
            
            try{
                
                const sizeBytes = fs.statSync(filePath).size;
                
                const result = await this.workerService.split(ctx,filePath,pages,sizeBytes);
                
                const originalName = ctx.session.tempParams?.originalName || 'Document.pdf';
                
                const safeNamePdf = FileNameUtils.getSafeName(originalName,'splitted');
                
                await ctx.replyWithDocument(new InputFile(result.path,safeNamePdf),{
                    
                    caption: ` ${this.localization.t(lang,'messages.actions.split_caption_success_file')}`,
                    parse_mode:'HTML',
                    reply_markup:result.zipPath ? undefined : this.keyboards.getMainMenu(lang, isAdmin)
                    
                });
                
                const statsPdf = await fs.promises.stat(result.path);
                let totalLogSize = statsPdf.size;
                
                if(result.zipPath){
                    
                    const safeNameZip = safeNamePdf.replace('.pdf','.zip');
                    await ctx.replyWithDocument(new InputFile(result.zipPath,safeNameZip),{
                        
                        caption: `${this.localization.t(lang,'messages.actions.split_caption_success_zip')}`,
                        parse_mode:'HTML',
                        reply_markup:this.keyboards.getMainMenu(lang, isAdmin)
                        
                    });
                    
                    const statsZip = await fs.promises.stat(result.zipPath);
                    totalLogSize += statsZip.size;
                    
                    await this.fileService.deleteFile(result.zipPath);
                    
                }
                
                await this.db.logAction(ctx.from!.id,'split',totalLogSize);
                
                await this.fileService.deleteFile(filePath);
                await this.fileService.deleteFile(result.path);
                ctx.session = initialSession();
                
            }catch(e:any){
                
                await this.logger.error('TextHandler:split',e,{user:ctx.from!,message:ctx.message!});
                await ctx.reply(`Error: ${e.message}`,{
                    
                    reply_markup:this.keyboards.getMainMenu(lang, isAdmin)
                    
                });
                
                ctx.session = initialSession();
                
            }finally{
                
                await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
                
            }
            
            return;
            
        }
        
        await this.logger.logAction(ctx.from!,'Spam text',text);
        // 2. Настойчиво отвечаем
        await ctx.reply(this.localization.t(lang, 'errors.text_rejected'), {
            parse_mode: 'HTML',
            reply_markup: this.keyboards.getMainMenu(lang,isAdmin)
        });
        
    }
    
}
