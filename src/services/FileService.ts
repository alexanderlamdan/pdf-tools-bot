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
    
    async downloadFile(ctx: Context, fileId: string): Promise<string> {
        const fileInfo = await ctx.api.getFile(fileId);
        
        if (!fileInfo.file_path) throw new Error('Telegram API не вернул file_path');

        // Собираем путь: /srv/telegram-bot-api / ТОКЕН / documents/file.pdf
        const sourcePath = path.join(
            this.config.apiStorageRoot, 
            this.config.token, 
            fileInfo.file_path
        );
        
        const destination = path.join(this.tempDir, `${fileId}.pdf`);

        console.log(`[FileService] Пробую копировать: ${sourcePath}`);

        try {
            // Копируем файл
            await fs.promises.copyFile(sourcePath, destination);
            console.log(`[FileService] ✅ Успешно скопировано!`);
            return destination;

        } catch (e: any) {
            console.error(`[FileService] Ошибка: ${e.message}`);
            // Если тут ошибка доступа — мы решим её в Шаге 2
            throw new Error(`Ошибка копирования: ${e.message}`);
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
