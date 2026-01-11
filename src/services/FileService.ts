import fs from 'fs';
import path from 'path';
import os from 'os';
import {Context} from 'grammy';
import {pipeline} from 'stream/promises';
import {createWriteStream} from 'fs';
import axios from 'axios';

export class FileService{
    
    private readonly tempDir = path.join(os.tmpdir(),'pdf-bot-files');
    
    constructor(){
        
        if(!fs.existsSync(this.tempDir)){
            
            fs.mkdirSync(this.tempDir,{recursive:true});
            
        }
        
    }
    
    async downloadFile(ctx:Context,fileId:string):Promise<string>{
        
        const fileInfo = await ctx.api.getFile(fileId);
        
        if(!fileInfo.file_path) throw new Error('Cant get the file path');
        
        const fileName= `${fileId}.pdf`;
        const destination = path.join(this.tempDir,fileName);
        
        const fileUrl = `http:localhost:8081`
        
        return tempFile;
        
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
