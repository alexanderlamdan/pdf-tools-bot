import http from 'http';
import fs from "fs";
import type {IBotConfig} from '../config/interfaces/IBotConfig.js';
import { SmartQueueService } from './SmartQueueService.js';
import type { BotContext } from '../types/BotContext.js';

export const WORKER_TIMEOUT_MS = 20 * 60 * 1000 + 30_000;

export interface MergeResult{
    path?:      string;
    paths?:     string[];
    zipPath?:   string;
    isFallback: boolean;
}

export interface IPdfInfo {
    pages: number;
    version: string;
    encrypted: boolean;
    size: number;
    author: string;
    
    can_compress: boolean;
    can_split: boolean;
    can_merge: boolean;
    
    has_metadata: boolean;
    is_scanned: boolean;
    
    is_corrupt: boolean;
    cant_compress_reason: string;
}

export interface IMetadataInfo{
    
    fields:Record<string,string>;
    HasWatermark:boolean;
    HasDigitalSignature:boolean;
    
}
export interface IAsymmetricResult{
    zipPath: string;
}

interface WorkerResponse{
    
    status: 'ok' | 'error' | 'timeout' | 'cancelled' | 'not_found' | 'already_optimal';
    info?:unknown;
    error?:string;
    path?:string;
    zipPath?:string;
    isFallback:boolean;
    paths?:string[];
    
}
const KNOWN_ERROR_CODE = /^[A-Z_]+(\|.*)?$/;

function sanitizeWorkerError(raw: string | undefined): string{
 
    const message = raw || 'UNKNOWN_ERROR';
 
    if(KNOWN_ERROR_CODE.test(message)) return message;
 
    console.error(`[PdfWorkerService] Raw worker error (not shown to user): ${message}`);
    return 'WORKER_TECHNICAL_ERROR';
 
}

export class PdfWorkerService{
    
    constructor(private readonly config:IBotConfig,private readonly queueService:SmartQueueService){}
    
    public async sendRequest(payload:any,timeoutMs:number = WORKER_TIMEOUT_MS):Promise<WorkerResponse>{
        
        const socketPath = this.config.workerSocketPath;
        
        return new Promise((resolve,reject)=>{
            
            const body = JSON.stringify(payload);
            const options = {
                
                socketPath,
                path:'/process',
                method:'POST',
                headers:{
                    
                    'Content-Type':'application/json',
                    'Content-Length':Buffer.byteLength(body)
                    
                }
                
            };
            
            const req = http.request(options,(res)=>{
                
                let raw = '';
                res.on('data',chunk=>raw += chunk);
                res.on('end',()=>{
                    
                    try{
                        
                        const data = JSON.parse(raw) as WorkerResponse;
                        
                        if(data.status === 'timeout'){
                            reject(new Error('PROCESSING_TIMEOUT'));
                            return;
                        }
                        
                        if(data.status === 'cancelled'){
                            reject(new Error('USER_CANCELLED'));
                            return;
                        }
                        
                        if(data.status === 'error'){
                            reject(new Error(sanitizeWorkerError(data.error)));
                            return;
                        }
                        else resolve(data);
                        
                    }catch{
                        
                        reject(new Error(`Worker returned invalid JSON: ${raw.slice(0,100)}`));
                        
                    }
                    
                });
                
            });
            
            req.setTimeout(timeoutMs,()=>{req.destroy();reject(new Error('Worker request timeout'))});
            
            req.on('error',(e:any)=>{
                
                console.error(`[PdfWorkerService] Failed connect to worker: ${e.message}`);
                if      (e.code === 'ENOENT')      reject(new Error(`Socket file not found: ${socketPath}`));
                else if (e.code === 'EACCES')       reject(new Error(`Permissions denied: ${socketPath}`));
                else if (e.code === 'ECONNREFUSED') reject(new Error('Worker not accepting connections'));
                else                                reject(new Error(e.message));
                
            });
            
            req.write(body);
            req.end();
            
        });
        
    }
    
    public async applyWatermark(filePath:string):Promise<string>{
        
        try{
            
            const data = await this.sendRequest({
                action:'watermark',
                inputPath:filePath,
                watermarkPath:this.config.watermarkImagePath,
                marketplaceUrl:this.config.marketplaceUrl,
                botUrl:this.config.botUrl,
                lang:this.config.forceLang
            });
            
            return data.path ?? filePath;
            
        }catch(e:any){
            
            console.error(`[PdfWorkerService] Watermark failed (non-critical): ${e.message}`);
            return filePath;
        }
        
    }
    
    public async stampMetadata(filePath:string):Promise<string>{
        
        try{
            
            const data = await this.sendRequest({
                action:'stamp_metadata',
                inputPath:filePath,
                marketplaceUrl:this.config.marketplaceUrl,
                botUrl:this.config.botUrl,
                lang:this.config.forceLang
            });
            
            return data.path ?? filePath;
            
        }catch(e:any){
            
            console.error(`[PdfWorkerService] Metadata stamp failed (non-critical): ${e.message}`);
            return filePath;
        }
        
    }
    
    public async getPdfInfo(ctx:BotContext,filePath:string,sizeBytes:number):Promise<IPdfInfo>{
        return this.queueService.enqueue(ctx,'info',sizeBytes,async()=>{
            
           const data = await this.sendRequest({
            
                action:'info',
                userId:ctx.from!.id,
                inputPath:filePath,
                
            });
            
            return data.info as unknown as IPdfInfo;
            
        })
    }
    
    public async encrypt(ctx:BotContext,filePath:string,password:string,sizeBytes:number):Promise<string>{
        
        return this.queueService.enqueue(ctx, 'encrypt', sizeBytes, async()=>{
            
            const data = await this.sendRequest({
            
                action:'encrypt',
                userId:ctx.from!.id,
                inputPath:filePath,
                password:password
                
            });
            
            if(data.status === 'error') throw new Error(data.error);
            return data.path!;
            
        });
        
    }
    
    public async decrypt(ctx:BotContext,filePath:string, password:string,sizeBytes:number):Promise<string>{
        return this.queueService.enqueue(ctx, 'decrypt', sizeBytes, async()=>{
            
            const data = await this.sendRequest({
            
                action:'decrypt',
                userId:ctx.from!.id,
                inputPath:filePath,
                password:password
                
            });
            
            if(data.status === 'error') throw new Error(data.error);
            return data.path!;
            
        });
        
    }
    
    public async asymmetricEncrypt(ctx:BotContext, filePath:string, sizeBytes:number):Promise<IAsymmetricResult>{
        return this.queueService.enqueue(ctx, 'asymmetric_encrypt', sizeBytes, async()=>{
            const data = await this.sendRequest({
                action:    'asymmetric_encrypt',
                userId:    ctx.from!.id,
                inputPath: filePath,
                lang:      this.config.forceLang,
            });
            if(data.status === 'error') throw new Error(data.error);
            return {
                zipPath: data.zipPath!,
            };
        });
    }
    
    public async asymmetricDecrypt(
        ctx:              BotContext,
        encryptedPdfPath: string,
        privateKeyPath:   string,
        encryptedKeyPath: string,
        sizeBytes:        number,
    ): Promise<string>{
        return this.queueService.enqueue(ctx, 'asymmetric_decrypt', sizeBytes, async()=>{
            const data = await this.sendRequest({
                action:    'asymmetric_decrypt',
                userId:    ctx.from!.id,
                inputPath: encryptedPdfPath,
                password:  privateKeyPath,
                extra:     encryptedKeyPath,
            });
            if(data.status === 'error') throw new Error(data.error);
            return data.path!;
        });
    }
    
        public async compress(ctx:BotContext, filePath:string, sizeBytes:number):Promise<{
        path:string,
        alreadyOptimal:boolean,
        originalSize:number,
        compressedSize:number,
        savedBytes:number
    }>{
        return this.queueService.enqueue(ctx, 'compress', sizeBytes, async()=>{
            
            const data = await this.sendRequest({
                action:    'compress',
                userId:    ctx.from!.id,
                inputPath: filePath
            });
 
            if(data.status === 'timeout'){
                throw new Error('COMPRESS_TIMEOUT');
            }
 
            if(data.status === 'error') throw new Error(data.error);
 
            const info = data.info as any || {};

            return{
                path:           data.path!,
                alreadyOptimal: data.status === 'already_optimal',
                originalSize:   Number(info.originalSize   || info.OriginalSize   || 0),
                compressedSize: Number(info.compressedSize || info.CompressedSize || 0),
                savedBytes:     Number(info.savedBytes     || info.SavedBytes     || 0),
            };
            
        });
    }
    
    public async split(ctx:BotContext,filePath:string,pages:string,sizeBytes:number):Promise<{path?:string,paths?:string[],zipPath?:string}>{
    
        return this.queueService.enqueue(ctx, 'split', sizeBytes, async ()=>{
            
            const data = await this.sendRequest({
                action:'split',
                userId:ctx.from!.id,
                inputPath:filePath,
                pages:pages,
                originalName:ctx.session.tempParams?.originalName || 'Document.pdf'
            });
            
            if(data.status === 'error') throw new Error(data.error);
            return{
                path:    data.path,
                paths:   data.paths,
                zipPath: data.zipPath
            };
            
        });
        
    }
    
    public async merge(ctx:BotContext, filePaths:string[], sizeBytes:number,timeoutMs?:number):Promise<MergeResult>{
        return this.queueService.enqueue(ctx, 'merge', sizeBytes, async()=>{
            const data = await this.sendRequest({
                action:     'merge',
                userId:     ctx.from!.id,
                inputPaths: filePaths
            },timeoutMs);
            if(data.status === 'error') throw new Error(data.error);
            return {
                path:       data.path,
                paths:      data.paths,
                zipPath:    data.zipPath,
                isFallback: data.isFallback ?? false,
            } as MergeResult;
        });
    }
    
    public async imagesToPdf(ctx:BotContext, filePaths:string[], sizeBytes:number):Promise<string>{
        
        return this.queueService.enqueue(ctx, 'images_to_pdf', sizeBytes, async () => {
            
            const data = await this.sendRequest({
                action:     'images_to_pdf',
                userId:     ctx.from!.id,
                inputPaths: filePaths,
            });
            
            if(data.status === 'error') throw new Error(data.error);
            return data.path!;
            
        });
        
    }
    
    public async officeToPdf(ctx:BotContext, filePath:string, sizeBytes:number):Promise<string>{
        
        return this.queueService.enqueue(ctx, 'office_to_pdf', sizeBytes, async () => {
            
            const data = await this.sendRequest({
                action:     'office_to_pdf',
                userId:     ctx.from!.id,
                inputPaths: [filePath],
            });
            
            if(data.status === 'error') throw new Error(data.error);
            return data.path!;
            
        });
        
    }
    
    public async readMetadata(ctx:BotContext,filePath:string,sizeBytes:number):Promise<IMetadataInfo>{
        
        return this.queueService.enqueue(ctx,'read_metadata',sizeBytes,async()=>{
            
            const data = await this.sendRequest({
                
                action:'read_metadata',
                userId:ctx.from!.id,
                inputPath: filePath
                
            });
            
            if(data.status === 'error') throw new Error(data.error);
            return data.info as IMetadataInfo;
            
        });
        
    }
    
    public async wipeMetadata(ctx:BotContext,filePath:string,sizeBytes:number,mode:'keep_signature'|'full_wipe' = 'full_wipe'):Promise<string>{
        
        return this.queueService.enqueue(ctx,'wipe_metadata',sizeBytes,async ()=>{
            
            const data = await this.sendRequest({
                
                action:'wipe_metadata',
                userId:ctx.from!.id,
                inputPath:filePath,
                password:mode
                
            });
            
            if(data.status === 'error') throw new Error(data.error);
            return data.path!;
            
        })
        
    }
    
    public async toLongImage(ctx: BotContext, filePath: string, pages: string, sizeBytes: number, isFreeUser: boolean, plan: string): Promise<string>{
 
        return this.queueService.enqueue(ctx, 'long_image', sizeBytes, async () => {
 
            const data = await this.sendRequest({
                action:     'long_image',
                userId:     ctx.from!.id,
                inputPath:  filePath,
                pages:      pages,
                isFreeUser: isFreeUser,
                plan:       plan,
            });
 
            if(data.status === 'error') throw new Error(data.error);
            return data.path!;
 
        });
 
    }
    
    public async toLongImageBulk(
        ctx:       BotContext,
        filePaths: string[],
        sizeBytes: number,
        isFreeUser:boolean,
        plan:      string,
    ): Promise<string>{
 
        return this.queueService.enqueue(ctx, 'long_image', sizeBytes, async () => {
 
            const data = await this.sendRequest({
                action:     'long_image_bulk',
                userId:     ctx.from!.id,
                inputPaths: filePaths,
                isFreeUser: isFreeUser,
                plan:       plan,
            });
 
            if(data.status === 'error') throw new Error(data.error);
 
            if(data.info && typeof data.info === 'string' && data.info.length > 0){
                ctx.session.tempParams = {
                    ...ctx.session.tempParams,
                    originalName: data.info as string,
                };
            }
 
            return data.path!;
 
        });
 
    }
    
    public isUserBusy(userId: number): boolean{
        return this.queueService.isUserBusy(userId);
    }
    
    public async extractText(ctx: BotContext, filePath: string, sizeBytes: number): Promise<string>{
        
        return this.queueService.enqueue(ctx, 'extract_text', sizeBytes, async () => {
            
            const data = await this.sendRequest({
                action:    'extract_text',
                userId:    ctx.from!.id,
                inputPath: filePath,
            });
            
            if(data.status === 'error') throw new Error(data.error);
            return data.path!;
            
        });
        
    }
    
    public async extractImages(ctx: BotContext, filePath: string, sizeBytes: number): Promise<string>{
        
        return this.queueService.enqueue(ctx, 'extract_images', sizeBytes, async () => {
            
            const data = await this.sendRequest({
                action:    'extract_images',
                userId:    ctx.from!.id,
                inputPath: filePath,
            });
            
            if(data.status === 'error') throw new Error(data.error);
            return data.zipPath!;
            
        });
        
    }
    
    public async searchText(ctx: BotContext, filePath: string, query: string, sizeBytes: number): Promise<{total: number; matches: string[]; truncated: boolean}>{
        
        return this.queueService.enqueue(ctx, 'search_text', sizeBytes, async () => {
            
            const data = await this.sendRequest({
                action:    'search_text',
                userId:    ctx.from!.id,
                inputPath: filePath,
                extra:     query,
            });
            
            if(data.status === 'error') throw new Error(data.error);
            
            const info = (data.info as any) || {};
            
            return {
                total:     Number(info.total || 0),
                matches:   Array.isArray(info.matches) ? info.matches : [],
                truncated: Boolean(info.truncated),
            };
            
        });
        
    }
    
    public async countWords(ctx: BotContext, filePath: string, sizeBytes: number): Promise<{words: number; chars: number; lines: number}>{
        
        return this.queueService.enqueue(ctx, 'word_count', sizeBytes, async () => {
            
            const data = await this.sendRequest({
                action:    'word_count',
                userId:    ctx.from!.id,
                inputPath: filePath,
            });
            
            if(data.status === 'error') throw new Error(data.error);
            
            const info = (data.info as any) || {};
            
            return {
                words: Number(info.words || 0),
                chars: Number(info.chars || 0),
                lines: Number(info.lines || 0),
            };
            
        });
        
    }
    
    public async cancelActiveJob(userId: number): Promise<{wasQueued: boolean}>{
        
        const wasQueued = this.queueService.cancelUser(userId);
        
        try{
            
            await this.sendRequest({action: 'cancel_job', userId}, 5_000);
            
        }catch(e:any){
            
            console.error(`[PdfWorkerService] cancelJob failed for userId=${userId}: ${e.message}`);
            
        }
        
        return {wasQueued};
        
    }
    
    public async checkMemoryStatus(): Promise<{critical: boolean; usedPercent?: number}>{
 
        try{
 
            const data = await this.sendRequest({action: 'memory_status'}, 5_000);
            return (data.info as any) ?? {critical: false};
 
        }catch{
 
            return {critical: false};
 
        }
 
    }
    
}
