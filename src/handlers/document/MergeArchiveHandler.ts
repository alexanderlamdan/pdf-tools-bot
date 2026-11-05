import type {BotContext}             from '../../types/BotContext.js';
import {InputFile}                   from 'grammy';
import {BaseHandler}                 from '../base/BaseHandler.js';
import {MergeAction}                 from '../buttons/actions/MergeAction.js';
import {initialSession}              from '../../types/SessionData.js';
import {FileNameUtils}               from '../../utils/FileNameUtils.js';
import {notifyTrafficAfterResult}    from '../../utils/TrafficNotifier.js';
import {isDuplicateCall}             from '../../utils/BusyGuard.js';
import {handleProcessingTimeout, handleServerBusy, handleUserCancelled} from '../../utils/ProcessingTimeoutHelper.js';
import {execFileSync}                from 'child_process';
import crypto                        from 'crypto';
import fs                            from 'fs';
import path                          from 'path';

const MAX_ARCHIVE_BYTES = 2 * 1024 * 1024 * 1024;
const WARN_TOTAL_BYTES = 2 * 1024 * 1024 * 1024;
const MAX_PDF_FILES = 200;
const MAX_DEPTH = 10;

const PDF_MAGIC = Buffer.from([0x25,0x50,0x44,0x46]);

const DANGEROUS_EXTENSIONS = new Set([
    '.sh','.bash','.zsh','.fish',
    '.py','.rb','.pl','.php','.lua',
    '.exe','.elf','.bin','.com',
    '.so','.dll','.dylib',
    '.js','.ts','.mjs','.cjs',
    '.jar','.class','.war',
    '.bat','.cmd','.ps1','.vbs',
    '.AppImage',
]);

const ARCHIVE_MIMES = new Set([
    'application/zip', 'application/x-zip-compressed',
    'application/x-rar-compressed', 'application/vnd.rar',
    'application/x-7z-compressed',
    'application/x-tar', 'application/gzip', 'application/x-gzip', 'application/x-bzip2',
    'application/octet-stream',
]);

const ARCHIVE_EXTENSIONS = new Set(['.zip','.rar','.7z','.tar','.gz','tgz']);

export class MergeArchiveHandler extends BaseHandler{
    
    public isArchive(ctx:BotContext):boolean{
        
        const doc = ctx.message?.document;
        if(!doc)return false;
        
        const mime = doc.mime_type || '';
        const ext = path.extname(doc.file_name || '').toLowerCase();
        const fullName = (doc.file_name || '').toLowerCase();
        if(fullName.endsWith('.tar.gz') || fullName.endsWith('.tar.xz') || fullName.endsWith('.tar.bz2')) return true;
        
        return ARCHIVE_MIMES.has(mime) || ARCHIVE_EXTENSIONS.has(ext);
        
    }
    
    async handle(ctx:BotContext):Promise<void>{
        
        const i18n = this.getI18n();
        const isAdmin = this.isAdmin(ctx);
        
        if(isDuplicateCall(ctx, this)) return;
        
        const doc = ctx.message?.document!;
        
        if((doc.file_size ?? 0) > MAX_ARCHIVE_BYTES){
            
            await this.logger.logAction(
                'MergeArchiveHandler', ctx.from!,
                'Archive rejected — too large',
                `${doc.file_name} | ${((doc.file_size ?? 0) / 1024 / 1024 / 1024).toFixed(2)} GB`,
            );
            
            await ctx.reply(i18n.errors.archive_too_large,{parse_mode:'HTML'});
            ctx.session = initialSession();
            return;
            
        }
        
        await this.logger.logAction(
            'MergeArchiveHandler', ctx.from!,
            'Archive received',
            `${doc.file_name} (${doc.mime_type}) | ${((doc.file_size ?? 0) / 1024 / 1024).toFixed(2)} MB`,
        );
        
        const statusMsg = await ctx.reply(i18n.messages.common.wait,{parse_mode:'HTML', reply_markup: this.keyboards.getCancelOnlyMenu()});
        const chatId    = ctx.chat!.id;
        
        setImmediate(async () => {
            
            let archivePath:string|null = null;
            let tempDir:string|null = null;
            
            try{
                
                archivePath = await this.fileService.downloadFile(ctx,doc.file_id);
                tempDir = await fs.promises.mkdtemp('/srv/runtime/merge_archive');
                
                await this.extract(archivePath,tempDir,doc.file_name || '');
                const {pdfs, skipped, duplicates} = await this.collectPdfs(tempDir, doc.file_name || 'archive', ctx);
                
                await ctx.api.deleteMessage(chatId,statusMsg.message_id).catch(()=>{});
                
                if(pdfs.length === 0){
                    
                    await this.logger.logAction('MergeArchiveHandler', ctx.from!, 'Archive — no valid PDFs', `Archive: ${doc.file_name}`);
                    
                    await ctx.api.sendMessage(chatId, i18n.errors.pdf_archive,{parse_mode:'HTML'});
                    Object.assign(ctx.session, initialSession());
                    return;
                    
                }
                
                if(pdfs.length === 1){
                    
                    await this.logger.logAction('MergeArchiveHandler', ctx.from!, 'Archive — only 1 PDF', `Archive: ${doc.file_name}`);
                    
                    await ctx.api.sendMessage(chatId, i18n.errors.single_pdf_archive,{parse_mode:'HTML'});
                    Object.assign(ctx.session, initialSession());
                    return;
                    
                }
                
                let totalSize = 0;
                for(const f of pdfs) totalSize += (await fs.promises.stat(f)).size;
                
                const isHeavy = totalSize > WARN_TOTAL_BYTES;
                
                if(isHeavy){
                    
                    await this.logger.logAction(
                        'MergeArchiveHandler', ctx.from!,
                        'Archive — heavy processing mode',
                        `Total: ${(totalSize / 1024 / 1024 / 1024).toFixed(2)} GB | Files: ${pdfs.length}`,
                    );
                    
                    await ctx.api.sendMessage(chatId, i18n.errors.archive_heavy_processing, {parse_mode: 'HTML'});
                    
                }
                
                await this.logger.logAction(
                    'MergeArchiveHandler', ctx.from!,
                    'Archive extracted',
                    `Found ${pdfs.length} valid PDFs | Total: ${(totalSize / 1024 / 1024).toFixed(2)} MB | Skipped: ${skipped.length} | Duplicates: ${duplicates.length}`,
                );
    
                
                const result = await this.worker.merge(ctx, pdfs, totalSize);
                
                Object.assign(ctx.session, initialSession());
                
                const archiveName = FileNameUtils.getSafeName(doc.file_name || 'archived','_merged');
                
                if(result.isFallback){
                    
                    await new MergeAction(ctx,this).deliverFallback(result,isAdmin,i18n);
                    
                }else{
                    
                    const safeName = archiveName.replace(/\.[^.]+$/,'') + '_merged.pdf';
                    
                    await this.logger.logAction(
                        'MergeArchiveHandler', ctx.from!,
                        'Archive merge result',
                        `${pdfs.length} PDFs merged | Total: ${(totalSize / 1024 / 1024).toFixed(2)} MB`,
                    );
                    
                    const duplicateNote = duplicates.length > 0
                        ? `\n\n${i18n.messages.actions.merge.duplicates_skipped
                            .replace('{{count}}', String(duplicates.length))
                            .replace('{{names}}', duplicates.slice(0, 10).join(', ') + (duplicates.length > 10 ? '...' : ''))}`
                        : '';
                    
                    await this.sendDocumentWithWatermark(ctx, result.path!, safeName,{
                        
                        caption:`${i18n.messages.actions.merge.merged_from_archive} ${pdfs.length}${duplicateNote}`,
                        parse_mode:'HTML',
                        reply_markup:this.keyboards.getMainMenu(isAdmin)
                        
                    });
                    
                    await this.db.logAction(ctx.from!.id,'merge',totalSize);
                    await this.fileService.deleteFile(result.path!);
                    await notifyTrafficAfterResult(ctx,this.localization,this.keyboards,this.logger);
                    
                }
                
            }catch(e:any){
                
                await ctx.api.deleteMessage(chatId,statusMsg.message_id).catch(()=>{});
                
                if(e.message === 'PROCESSING_TIMEOUT'){
                    
                    await handleProcessingTimeout(ctx, this, 'MergeArchive', doc.file_name || 'archive');
                    
                }else if(e.message === 'SERVER_BUSY'){
                    
                    await handleServerBusy(ctx, this, 'MergeArchive', doc.file_name || 'archive');
                    
                }else if(e.message === 'USER_CANCELLED'){
                    
                    await handleUserCancelled(ctx, this, 'MergeArchive', doc.file_name || 'archive');
                    
                }else{
                    
                    await this.logger.error('MergeArchiveHandler:handle',e,{user:ctx.from!,message:ctx.message!});
                    await ctx.api.sendMessage(chatId, `${i18n.errors.error_proccesing_archive} ${e.message}`,{parse_mode:'HTML'});
                    
                }
                
                Object.assign(ctx.session, initialSession());
                
            }finally{
                
                if(archivePath) await this.fileService.deleteFile(archivePath).catch(()=>{});
                if(tempDir) await fs.promises.rm(tempDir,{recursive:true,force:true}).catch(()=>{});
                
            }
            
        });
        
    }
    
    private async extract(archivePath:string,targetDir:string,fileName:string):Promise<void>{
        
        const lower   = fileName.toLowerCase();
        const timeout = {timeout: 300_000};
 
        if     (lower.endsWith('.tar.gz')  || lower.endsWith('.tgz'))  execFileSync('tar',   ['-xzf', archivePath, '-C', targetDir], timeout);
        else if(lower.endsWith('.tar.xz'))                              execFileSync('tar',   ['-xJf', archivePath, '-C', targetDir], timeout);
        else if(lower.endsWith('.tar.bz2'))                             execFileSync('tar',   ['-xjf', archivePath, '-C', targetDir], timeout);
        else if(lower.endsWith('.tar'))                                 execFileSync('tar',   ['-xf',  archivePath, '-C', targetDir], timeout);
        else if(lower.endsWith('.zip'))                                 execFileSync('unzip', ['-q',   archivePath, '-d', targetDir], timeout);
        else if(lower.endsWith('.7z'))                                  execFileSync('7z',    ['x',    archivePath, `-o${targetDir}`, '-y'], timeout);
        else if(lower.endsWith('.rar')){
            try{ execFileSync('unrar',  ['x', '-y', archivePath, `${targetDir}/`], timeout); }
            catch{ execFileSync('bsdtar', ['-xf', archivePath, '-C', targetDir], timeout); }
        }else{
            execFileSync('bsdtar', ['-xf', archivePath, '-C', targetDir], timeout);
        }
        
    }
    
    private async collectPdfs(dir: string,archiveName:string,ctx:BotContext): Promise<{pdfs:string[];skipped:string[];duplicates:string[]}> {
        
        const result: string[] = [];
        const skipped:string[] = [];
        const duplicates:string[] = [];
        const seenHashes = new Set<string>();
        
        const walk = async (current:string,depth:number):Promise<void>=>{
            
            if(depth > MAX_DEPTH) return;
            
            const entries = await fs.promises.readdir(current,{withFileTypes:true});
            
            for(const entry of entries){
                
                const fullPath = path.join(current, entry.name);
                const nameLow = entry.name.toLowerCase();
                
                if(entry.name.startsWith('.')){
                    
                    skipped.push(`hidden: ${entry.name}`);
                    continue;
                    
                }
                
                if(entry.isDirectory()){
                    
                    await walk(fullPath,depth + 1);
                    continue;
                    
                }
                
                if(!entry.isFile()) continue;
                
                const ext = path.extname(nameLow);
                
                if(DANGEROUS_EXTENSIONS.has(ext)){
                    
                    skipped.push(`dangerous: ${entry.name}`);
                    await fs.promises.unlink(fullPath).catch(()=>{});
                    continue;
                    
                }
                
                if(!nameLow.endsWith('.pdf')){
                    
                    skipped.push(`non-pdf:${entry.name}`);
                    continue;
                }
                
                if(result.length >= MAX_PDF_FILES){
                    
                    skipped.push(`limit: ${entry.name}`);
                    continue;
                    
                }
                
                const isValidPdf = await this.checkPdfMagic(fullPath);
                if(!isValidPdf){
                    
                    skipped.push(`invalid-magic:${entry.name}`);
                    await fs.promises.unlink(fullPath).catch(()=>{});
                    continue;
                    
                }
                
                const hash = await this.hashFile(fullPath);
                
                if(seenHashes.has(hash)){
                    
                    duplicates.push(entry.name);
                    skipped.push(`duplicate:${entry.name}`);
                    await fs.promises.unlink(fullPath).catch(()=>{});
                    continue;
                    
                }
                
                seenHashes.add(hash);
                
                result.push(fullPath);
                
            }
            
        };
        
        await walk(dir,0);
        
        if(skipped.length > 0){
            
            await this.logger.logAction(
                'MergeArchiveHandler:collectPdfs', ctx.from!,
                'Skipped files',
                `Archive: ${archiveName} | Skipped: ${skipped.slice(0, 20).join(', ')}`,
            );
            
        }
        
        result.sort((a,b)=>path.basename(a).toLowerCase().localeCompare(
            path.basename(b).toLowerCase(),
            undefined,
            {numeric:true,sensitivity:'base'}
        ));
        
        const safePaths:string[] = [];
        for(let i = 0; i < result.length;i++){
            
            const safePath = path.join(path.dirname(result[i]),`__safe_${i+1}.pdf`);
            await fs.promises.rename(result[i],safePath);
            safePaths.push(safePath);
            
        }
        
        return {pdfs:safePaths,skipped,duplicates};
        
    }
    
    private async checkPdfMagic(filePath:string):Promise<boolean>{
        
        try{
            
            const fd = await fs.promises.open(filePath,'r');
            const buf = Buffer.alloc(4);
            const {bytesRead} = await fd.read(buf,0,4,0);
            await fd.close();
            if(bytesRead < 4)return false;
            return buf.equals(PDF_MAGIC);
            
        }catch{
            
            return false;
            
        }
        
    }
    
    private async hashFile(filePath:string):Promise<string>{
        
        return new Promise((resolve,reject) => {
            
            const hash = crypto.createHash('sha256');
            const stream = fs.createReadStream(filePath);
            
            stream.on('data',(chunk) => hash.update(chunk));
            stream.on('end',() => resolve(hash.digest('hex')));
            stream.on('error',reject);
            
        });
        
    }
    
}
