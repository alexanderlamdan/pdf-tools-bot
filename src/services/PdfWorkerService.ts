import axios from "axios"
import fs from "fs";
import type {IBotConfig} from '../config/interfaces/IBotConfig.js';
import { SmartQueueService } from './SmartQueueService.js';
import type { BotContext } from '../types/BotContext.js';

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

interface WorkerResponse{
    
    status: 'ok' | 'error';
    info?:unknown;
    error?:string;
    path?:string;
    zipPath?:string;
    isFallback:boolean;
    paths?:string[];
    
}

export class PdfWorkerService{
    
    constructor(private readonly config:IBotConfig,private readonly queueService:SmartQueueService){}
    
    public async sendRequest(payload:any):Promise<WorkerResponse>{
        
        const socketPath = this.config.workerSocketPath;

        try{
            const response = await axios.post<WorkerResponse>(
                'http://localhost/process',
                payload,
                {
                    socketPath: socketPath,
                    headers:{'Content-Type':'application/json'},
                    timeout: 300_000
                }
            );
            
            const data = response.data;
            if(data.status === 'error'){
                throw new Error(data.error);
            }
            return  response.data || 'No Information';
            
        }catch(e:any){
            // Логируем реальную причину
            console.error(`[PdfWorkerService] Failed connect to worker: ${e.message}`);
            
            if (e.code === 'ENOENT') {
                 throw new Error(`Socket file not found: ${socketPath} (Check if socket is on)`);
            }
            if (e.code === 'EACCES') {
                 throw new Error(`Permissions denied: ${socketPath} (check chmod/user)`);
            }
            if (e.code === 'ECONNREFUSED') {
                 throw new Error('Worker dont get connections (Worker down?)');
            }
            
            throw new Error(e.response?.data?.error || e.message);
        }
        
    }
    
    public async getPdfInfo(ctx:BotContext,filePath:string,lang:string,sizeBytes:number):Promise<IPdfInfo>{
        return this.queueService.enqueue(ctx,'info',sizeBytes,async()=>{
            
           const data = await this.sendRequest({
            
                action:'info',
                inputPath:filePath,
                lang:lang
                
            });
            
            return data.info as unknown as IPdfInfo;
            
        })
    }
    
    public async encrypt(ctx:BotContext,filePath:string,password:string,sizeBytes:number):Promise<string>{
        
        return this.queueService.enqueue(ctx, 'encrypt', sizeBytes, async()=>{
            
            const data = await this.sendRequest({
            
                action:'encrypt',
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
                inputPath:filePath,
                password:password
                
            });
            
            if(data.status === 'error') throw new Error(data.error);
            return data.path!;
            
        });
        
    }
    
    public async crack(ctx:BotContext,filePath:string,sizeBytes:number):Promise<{path:string,password:string}>{
        return this.queueService.enqueue(ctx, 'crack', sizeBytes, async()=>{
            
            const data = await this.sendRequest({
            
                action:'crack',
                inputPath:filePath
                
            });
            
            if(data.status === 'error') throw new Error(data.error);
            return {
                
                path:data.path!,
                password:data.info as string
                
            };
            
        });
       
    }
    
    public async compress(ctx:BotContext,filePath:string,sizeBytes:number):Promise<string>{
        
        return this.queueService.enqueue(ctx, 'compress', sizeBytes, async()=>{
            
            const data = await this.sendRequest({
            
                action:'compress',
                inputPath:filePath
                
            });
            
            if(data.status === 'error') throw new Error(data.error);
            return data.path!;
            
        });
        
    }
    
    public async repair(ctx:BotContext,filePath:string,sizeBytes:number):Promise<string>{
        return this.queueService.enqueue(ctx, 'repair', sizeBytes, async()=>{
            
            const data = await this.sendRequest({
                action:'repair',
                inputPath:filePath
            });
            
            if(data.status === 'error') throw new Error(data.error);
            return data.path!;
            
        });
        
    }
    
    public async split(ctx:BotContext,filePath:string,pages:string,sizeBytes:number):Promise<{path:string,zipPath?:string}>{
        
        return this.queueService.enqueue(ctx, 'split', sizeBytes, async ()=>{
            
            const data = await this.sendRequest({
                
                action:'split',
                inputPath:filePath,
                pages:pages,
                originalName:ctx.session.tempParams?.originalName || 'Document.pdf'
                
            });
            
            if(data.status === 'error') throw new Error(data.error);
            return{
                
                path:data.path!,
                zipPath:data.zipPath
                
            };
            
        });
        
    }
    
    public async merge(ctx:BotContext, filePaths:string[], sizeBytes:number):Promise<MergeResult>{
        return this.queueService.enqueue(ctx, 'merge', sizeBytes, async()=>{
            const data = await this.sendRequest({
                action:     'merge',
                inputPaths: filePaths
            });
            if(data.status === 'error') throw new Error(data.error);
            return {
                path:       data.path,
                paths:      data.paths,
                zipPath:    data.zipPath,
                isFallback: data.isFallback ?? false,
            } as MergeResult;
        });
    }
    
}
