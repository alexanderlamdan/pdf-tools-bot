import fs from 'fs';
import path from 'path';
import os from 'os';
import {Context} from 'grammy';
import {pipeline} from 'stream/promises';
import {createWriteStream} from 'fs';
import axios from 'axios';
import type {IBotConfig} from '../config/interfaces/IBotConfig.js';

export class FileService{
    
    private readonly tempDir = path.join(os.tmpdir(),'pdf-bot-files');
    
    constructor(private readonly config:IBotConfig){
        
        if(!fs.existsSync(this.tempDir)){
            
            fs.mkdirSync(this.tempDir,{recursive:true});
            
        }
        
    }
    
    async downloadFile(ctx:Context,fileId:string):Promise<string>{
        
        const fileInfo = await ctx.api.getFile(fileId);
        
        if(!fileInfo.file_path) throw new Error('Cant get the file path');
        
        console.log(`[FileService] Получен file_path от API: ${fileInfo.file_path}`);
        
        const sourcePath= fileInfo.file_path;
        const destination = path.join(this.tempDir,`${fileId}.pdf`);
        
        if(!fs.existsSync(sourcePath)){
            
            throw new Error(`File not found on the disc: ${sourcePath}. Check if API and bot is equal paths`);
            
        }
        
        try{
            
            await fs.promises.copyFile(sourcePath,destination);
            
            console.log(`File is successfully copied to ${destination}`);
            
            return destination;
            
        }catch(e:any){
            
            console.error(`[FileService]: Copy error: ${e.message}`);
            
            if(e.code === 'EACCES'){
                
                throw new Error('You dont have permissions to read file(permission denied). Check if bot can read API server');
                
            }
            
            throw new Error(`Error local copy: ${e.message}`);
            
        }
        
    }
    
    deleteFile(filePath:string){
        
        try{
            
            if(fs.existsSync(filePath)){
                
                fs.unlinkSync(filePath);
                
            }
            
        }catch(e){
            
            console.error(`Error to delete file: ${e.message}`);
            
        }
        
    }
    
}
