import type {BotContext} from '../../types/BotContext.js'
import {LocalizationService} from '../../services/LocalizationService.js';
import {PdfWorkerService} from '../../services/PdfWorkerService.js';
import {FileService} from '../../services/FileService.js';
import {InputFile} from 'grammy';
import {initialSession} from '../../types/SessionData.js';
import type {IBotConfig} from '../../config/interfaces/IBotConfig.js';
import type {LocalApi} from '../../types/LocalApi.js';

export class TextHandler{
    
    private readonly workerService:PdfWorkerService;
    private readonly fileService:FileService;
    
    constructor(
        private readonly config:IBotConfig,
        private readonly localApi:LocalApi,
        private readonly localization:LocalizationService
    ){
        
        this.workerService = new PdfWorkerService(this.config);
        this.fileService = new FileService(this.config,this.localApi);
        
    }
    
    async handle(ctx:BotContext){
        
        const {lang} = this.localization.getUserLanguage(ctx.from?.language_code);
        
        const text = ctx.message?.text;
        if(!text) return;
        
        if(text.startsWith('/') || this.localization.getActionKeyByText(text)) return;
        
        const action = ctx.session.currentAction;
        const step = ctx.session.step;
        
        if(action === 'protect' && step === 'waiting_for_password'){
            
            const password = text.trim();
            
            if(password.length < 1){
                
                await ctx.reply(this.localization.t(lang,'password_empty'));
                return;
                
            }
            
            const filePath = ctx.session.filePaths[0];
            if(!filePath){
                
                await ctx.reply(this.localization.t(lang,'file_lost'));
                ctx.session = initialSession();
                return;
                
            }
            
            try{
                
                await ctx.deleteMessage();
                
            }catch(e){}
            
            const statusMsg = await ctx.reply(this.localization.t(lang,'set_encrypt'));
            let resultPath:string | null = null;
            
            try{
                
                resultPath = await this.workerService.encrypt(filePath, password);
                
                await ctx.replyWithDocument(new InputFile(resultPath),{
                    
                    caption:this.localization.t(lang,'encrypt_caption_finished'),
                    parse_mode:'HTML'
                    
                });
                
                ctx.session = initialSession();
                
            }catch(e:any){
                
                await ctx.reply(`Error: ${e.message}`);
                ctx.session = initialSession();
                
            }finally{
                
                await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
                if (filePath) await this.fileService.deleteFile(filePath);
                if (resultPath) await this.fileService.deleteFile(resultPath);
                
            }
            
        }
        
    }
    
}
