import axios from "axios"
import fs from "fs";
import type {IBotConfig} from '../config/interfaces/IBotConfig.js';

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
    
}

export class PdfWorkerService{
    
    constructor(private readonly config:IBotConfig){}
    
    public async sendRequest(payload:any):Promise<WorkerResponse>{
        
        const socketPath = this.config.workerSocketPath;

        try{
            const response = await axios.post<WorkerResponse>(
                'http://localhost/process',
                payload,
                {
                    socketPath: socketPath,
                    headers:{'Content-Type':'application/json'},
                    timeout: 60000
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
    
    public async getPdfInfo(filePath:string,lang:string):Promise<IPdfInfo>{
        
        const data = await this.sendRequest({
            
            action:'info',
            inputPath:filePath,
            lang:lang
            
        });
        
        return data.info as unknown as IPdfInfo;
    }
    
    public async encrypt(filePath:string,password:string):Promise<string>{
        
        const data = await this.sendRequest({
            
            action:'encrypt',
            inputPath:filePath,
            password:password
            
        });
        
        if(data.status === 'error') throw new Error(data.error);
        return data.path!;
        
    }
    
    public async decrypt(filePath:string, password:string):Promise<string>{
        
        const data = await this.sendRequest({
            
            action:'decrypt',
            inputPath:filePath,
            password:password
            
        });
        
        if(data.status === 'error') throw new Error(data.error);
        return data.path!;
        
    }
    
    public async crack(filePath:string):Promise<{path:string,password:string}>{
        
        const data = await this.sendRequest({
            
            action:'crack',
            inputPath:filePath
            
        });
        
        if(data.status === 'error') throw new Error(data.error);
        return {
            
            path:data.path!,
            password:data.info as string
            
        };
        
    }
    
    public async compress(filePath:string):Promise<string>{
        
        const data = await this.sendRequest({
            
            action:'compress',
            inputPath:filePath
            
        });
        
        if(data.status === 'error') throw new Error(data.error);
        return data.path!;
        
    }
    
}
