import {Context} from 'grammy';
import type {IBotConfig} from '../../config/interfaces/IBotConfig.js';
import {FileService} from '../../services/FileService.js';
import {PdfWorkerService} from '../../services/PdfWorkerService.js';

export class DocumentMessageHandler{
    
    private fileService:FileService;
    private workerService:PdfWorkerService;
    
    constructor(private readonly config: IBotConfig){
        
        this.fileService = new FileService(config);
        this.workerService = new PdfWorkerService(config);
        
    }
    
    public isSupportedDocument(ctx:Context):boolean{
        
        return ctx.message?.document?.mime_type === 'application/pdf';
        
    }
    
    async handle(ctx:Context){
        
        const document = ctx.message?.document;
        
        if(!document) return;
        
        const statusMsg = await ctx.reply('<b>Processing...</b>',{parse_mode:'HTML'});
        
        let localPath:string | null = null;
        
        try{
            
            localPath = await this.fileService.downloadFile(ctx,document.file_id);
            
            const infoText = await this.workerService.getPdfInfo(localPath);
            
            await ctx.api.editMessageText(
                ctx.chat!.id,
                statusMsg.message_id,
                `<b>Information about PDF:</b>\n\n${infoText}`,
                {parse_mode:'HTML'}
            );
            
        }catch(e:any){
            
            console.error('Error in Document Handler',e);
            await ctx.api.editMessageText(
                ctx.chat!.id,
                statusMsg.message_id,
                `<b>Error:</b> ${e.message}`,
                {parse_mode:'HTML'}
            );
            
        }finally{
            
            if(localPath){
                
                this.fileService.deleteFile(localPath);
                
            }
            
        }
        
    }
    
}
