import fs from 'fs';
import path from 'path';
import {Context, Api} from 'grammy';
import type {IBotConfig} from '../config/interfaces/IBotConfig.js';
import type {RawApi} from 'grammy';

const sleep = (ms:number)=> new Promise((resolve) =>setTimeout(resolve,ms));

export class FileService{
    
    private readonly baseRuntimeDir = '/srv/runtime';
    
    constructor(private readonly config: IBotConfig,private readonly localApi:Api<RawApi>){
        
        if(!fs.existsSync(this.baseRuntimeDir)){
            
            try{
                
                fs.mkdirSync(this.baseRuntimeDir,{recursive:true});
                
            }catch(e){
                
                console.error(`[FileService] Can't create base dir: ${e}`);
                
            }
            
        }
        
    }
    
    async downloadFile(ctx:Context,fileId:string):Promise<string>{
        
        let fileInfo;
        let retries = 10;
        const retryDelay = 3000;
        
        while(retries >0){
            
            try{
                
                fileInfo = await this.localApi.getFile(fileId);
                break;
                
            }catch(err:any){
                
                if(err.description?.includes('temporarily unavailable') && retries > 1){
                    
                    console.log(`[FileService] Телега качает файл в кэш. Ждем 3 сек... (Осталось попыток: ${retries - 1})`);
                    await sleep(retryDelay);
                    retries--;
                    
                }else{
                    throw new Error(`Telegram API error: ${err.message}`);
                }
                
            }
            
        }
        
        
        if(!fileInfo.file_path) throw new Error('API not returned file_path');
        
        const sourcePath = path.isAbsolute(fileInfo.file_path) ? fileInfo.file_path : path.join(this.config.telegramStoragePath,this.config.token,fileInfo.file_path);
        
        const userId = ctx.from?.id ? String(ctx.from.id) : 'unknown_user';
        
        const userDir = path.join(this.baseRuntimeDir,this.config.botName,'documents','pdf',userId);
        
        if(!fs.existsSync(userDir)){
            
            fs.mkdirSync(userDir,{recursive:true});
            
        }
        
        const ext = path.extname(fileInfo.file_path) || '.bin';
        const destination = path.join(userDir,`${fileId}${ext}`);
        
        console.log(`[FileService] Source path: ${sourcePath}`);
        console.log(`[FileService] Destination path: ${destination}`);
        
        const timeoutMs = 45000;
        const stepMs = 500;
        const start = Date.now();
        
        while(!fs.existsSync(sourcePath)){
            
            if(Date.now() - start > timeoutMs){
                
                throw new Error(`Timeout (45s): file not found on the path: ${sourcePath}`);
                
            }
            
            await sleep(stepMs);
            
        }
        
        try{
            
            await fs.promises.copyFile(sourcePath,destination);
            console.log(`[FileService] Copied in ${Date.now() - start}ms`);
            return destination;
            
        }catch(e:any){
            
            throw new Error(`Copy error: ${e.message}`);
            
        }
        
    }
    
    public async deleteFile(filePath:string):Promise<void>{
        
        try{
            
            if(fs.existsSync(filePath)){
                
                await fs.promises.unlink(filePath);
                console.log(`🗑 [FileService] Deleted: ${filePath}`)
                
            }
            
        }catch(e:any){
            
            console.error(`⚠️ [FileService] Failed to delete file ${filePath}: ${e.message}`)
            
        }
        
    }
    
}
