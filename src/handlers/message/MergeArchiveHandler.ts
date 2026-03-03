import type { BotContext } from '../../types/BotContext.js';
import type { IBotConfig } from '../../config/interfaces/IBotConfig.js';
import type { LocalApi } from '../../types/LocalApi.js';
import { LocalizationService } from '../../services/LocalizationService.js';
import { LoggerService } from '../../services/LoggerService.js';
import { FileService } from '../../services/FileService.js';
import { PdfWorkerService } from '../../services/PdfWorkerService.js';
import { DatabaseService } from '../../services/DatabaseService.js';
import { Keyboards } from '../../services/Keyboards.js';
import { FileNameUtils } from '../../utils/FileNameUtils.js';
import { SmartQueueService } from '../../services/SmartQueueService.js';
import { notifyTrafficAfterResult } from '../../utils/TrafficNotifier.js';
import { initialSession } from '../../types/SessionData.js';
import { InputFile } from 'grammy';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

const ARCHIVE_MIMES = new Set([
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/vnd.rar',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/gzip',
    'application/x-gzip',
    'application/x-bzip2',
    'application/octet-stream',
]);

const ARCHIVE_EXTENSIONS = new Set(['.zip', '.rar', '.7z', '.tar', '.gz', '.tgz', '.tar.gz', '.tar.xz', '.tar.bz2']);

export class MergeArchiveHandler{
    
    private readonly fileService: FileService;
    private readonly workerService: PdfWorkerService;
    private readonly logger: LoggerService;
    private readonly db: DatabaseService;
    private readonly keyboards: Keyboards;

    constructor(
        private readonly config: IBotConfig,
        private readonly localApi: LocalApi,
        private readonly localization: LocalizationService
    ) {
        this.logger       = new LoggerService(this.config);
        this.db           = new DatabaseService(this.logger);
        this.keyboards    = new Keyboards(this.localization);
        this.fileService  = new FileService(this.config, this.localApi);
        this.workerService = new PdfWorkerService(this.config, SmartQueueService.getInstance(this.localization, this.db));
    }
    
    public isArchive(ctx:BotContext):boolean{
        
        const doc = ctx.message?.document;
        if(!doc) return false;
        
        const mime = doc.mime_type || '';
        const ext = path.extname(doc.file_name || '').toLowerCase();
        const fullName = (doc.file_name || '').toLowerCase();
        
        if(fullName.endsWith('.tar.gz') || fullName.endsWith('.tar.xz') || fullName.endsWith('.tar.bz2')) return true;
        
        return ARCHIVE_MIMES.has(mime) || ARCHIVE_EXTENSIONS.has(ext);
        
    }
    
    public async handle(ctx:BotContext):Promise<void>{
        
        const {lang} = this.localization.getUserLanguage(ctx.from?.language_code);
        const i18n = this.localization.get(lang);
        const isAdmin = ctx.from?.id === this.config.adminId;
        const doc = ctx.message?.document!;
        
        await this.logger.logAction(
            'MergeArchiveHandler',
            ctx.from!,
            'Archive received',
            `${doc.file_name} (${doc.mime_type})`
        );
        
        const statusMsg = await ctx.reply(i18n.messages.common.wait,{parse_mode:'HTML'});
        
        let archivePath:string | null = null;
        let tempDir:string|null = null;
        
        try{
            
            archivePath = await this.fileService.downloadFile(ctx,doc.file_id);
            tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(),'merge_archive_'));
            
            await this.extract(archivePath,tempDir,doc.file_name || '');
            const pdfFiles = await this.collectPdfs(tempDir);
            
            if(pdfFiles.length === 0){
                
                await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
                await ctx.reply(i18n.errors.pdf_archive,{parse_mode:'HTML'});
                return;
                
            }
            
            if(pdfFiles.length === 1){
                
                await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
                await ctx.reply(i18n.errors.single_pdf_archive,{parse_mode:'HTML'});
                return;
                
            }
            
            await this.logger.logAction(
                'MergeArchiveHandler',
                ctx.from!,
                'Archive extracted',
                `Found ${pdfFiles.length} PDF files`
            );
            
            let totalSize = 0;
            for(const f of pdfFiles) totalSize += (await fs.promises.stat(f)).size;
            
            const result = await this.workerService.merge(ctx,pdfFiles,totalSize);
            
            await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
            
            const originalName = FileNameUtils.getSafeName(doc.file_name || 'archive','_merged');
            
            if(result.isFallback){
                
                await this.handleFallbackResult(ctx,result,originalName,lang,isAdmin);
                
            }else{
                
                const safeName = originalName.replace(/\.[^.]+$/,'') + '_merged.pdf';
                await this.logger.logAction(
                    'MergeArchiveHandler',
                    ctx.from!,
                    'Archive merge result',
                    `${pdfFiles.length} PDFs merged`,
                    'Success'
                );
                
                await ctx.replyWithDocument(new InputFile(result.path!,safeName),{
                    
                    caption:`${i18n.messages.actions.merged_from_archive} ${pdfFiles.length}`,
                    parse_mode:'HTML',
                    reply_markup:this.keyboards.getMainMenu(lang,isAdmin)
                    
                });
                
                await this.db.logAction(ctx.from!.id, 'merge',totalSize);
                await this.fileService.deleteFile(result.path!);
                await notifyTrafficAfterResult(ctx,lang,this.localization,this.keyboards,this.logger);
                
            }
            
            ctx.session = initialSession();
            
        }catch(e:any){
            
            await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
            await this.logger.error('MergeArchiveHandler',e,{user:ctx.from!,message:ctx.message!});
            await ctx.reply(`${i18n.errors.error_proccesing_archive} ${e.message}`,{
                parse_mode:'HTML'
            });
            ctx.session = initialSession();
            
        }finally{
            
            if(archivePath) await this.fileService.deleteFile(archivePath).catch(()=>{});
            if(tempDir) await fs.promises.rm(tempDir,{recursive:true,force:true}).catch(()=>{});
            
        }
        
    }
    
    private async handleFallbackResult(ctx:BotContext,result:any,originalName:string,lang:string,isAdmin:boolean):Promise<void>{
        
        const i18n = this.localization.get(lang);
        
        await this.logger.logAction(
            'MergeArchiveHandler',
            ctx.from!,
            'Archive merge fallback',
            `Sending ${result.paths?.length || 0} chunks + ZIP`
        );
        
        await ctx.reply(i18n.messages.actions.merge_fallback,{parse_mode:'HTML'});
        
        if(result.paths && result.paths.length >0){
            
            for(let i = 0; i< result.paths.length;i++){
                
                const chunkPath = result.paths[i];
                const chunkName = path.basename(chunkPath);
                try{
                    
                    await ctx.replyWithDocument(new InputFile(chunkPath,chunkName));
                    await this.fileService.deleteFile(chunkPath);
                    
                }catch(e){
                    
                    
                    
                }
                
            }
            
        }
        
        if(result.zipPath){
            
            const zipName = path.basename(result.zipPath);
            await ctx.replyWithDocument(new InputFile(result.zipPath,zipName),{
                
                caption:i18n.messages.actions.merge_zip_success,
                parse_mode:'HTML',
                reply_markup:this.keyboards.getMainMenu(lang,isAdmin)
                
            });
            
            await this.fileService.deleteFile(result.zipPath);
            
        }
        
    }
    
    private async extract(archivePath:string,targetDir:string,fileName:string):Promise<void>{
        
        const lower = fileName.toLowerCase();
        
        if (lower.endsWith('.tar.gz') || lower.endsWith('.tgz')) {
            await execAsync(`tar -xzf "${archivePath}" -C "${targetDir}"`);

        } else if (lower.endsWith('.tar.xz')) {
            await execAsync(`tar -xJf "${archivePath}" -C "${targetDir}"`);

        } else if (lower.endsWith('.tar.bz2')) {
            await execAsync(`tar -xjf "${archivePath}" -C "${targetDir}"`);

        } else if (lower.endsWith('.tar')) {
            await execAsync(`tar -xf "${archivePath}" -C "${targetDir}"`);

        } else if (lower.endsWith('.zip')) {
            await execAsync(`unzip -q "${archivePath}" -d "${targetDir}"`);

        } else if (lower.endsWith('.rar')) {
            // unrar или bsdtar
            try {
                await execAsync(`unrar x -y "${archivePath}" "${targetDir}/"`);
            } catch {
                await execAsync(`bsdtar -xf "${archivePath}" -C "${targetDir}"`);
            }

        } else if (lower.endsWith('.7z')) {
            await execAsync(`7z x "${archivePath}" -o"${targetDir}" -y`);

        } else {
            // Пробуем bsdtar как универсальный фолбэк
            await execAsync(`bsdtar -xf "${archivePath}" -C "${targetDir}"`);
        }
        
    }
    
    private async collectPdfs(dir:string):Promise<string[]>{
        
        const result:string[] = [];
        
        const walk = async(current:string)=>{
            
            const entries = await fs.promises.readdir(current,{withFileTypes:true});
            
            for(const entry of entries){
                
                const fullPath = path.join(current,entry.name);
                if(entry.isDirectory()){
                    
                    await walk(fullPath);
                    
                }else if(entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')){
                    
                    result.push(fullPath);
                    
                }
                
            }
            
        };
        
        await walk(dir);
        
        result.sort((a,b)=>{
            
            const nameA = path.basename(a).toLowerCase();
            const nameB = path.basename(b).toLowerCase();
            
            return nameA.localeCompare(nameB,undefined,{numeric:true,sensitivity:'base'});
        });
        
        return result;
        
    }
    
}
