import fs from 'fs';
import path from 'path';
import os from 'os';
import {Context} from 'grammy';
import {pipeline} from 'stream/promises';
import {createWriteStream} from 'fs';
import axios from 'axios';
import type {IBotConfig} from '../config/interfaces/IBotConfig.js';

export class FileService{
    
    private readonly runtimeDir = '/srv/runtime';
    
    constructor(private readonly config:IBotConfig){
        
       if (!fs.existsSync(this.runtimeDir)) {
            try {
                fs.mkdirSync(this.runtimeDir, { recursive: true });
            } catch (e) {
                console.error('CRITICAL: Не могу создать temp папку!', e);
            }
        }
        
    }
    
  async downloadFile(ctx: Context, fileId: string): Promise<string> {
        const fileInfo = await ctx.api.getFile(fileId);
        if (!fileInfo.file_path) throw new Error('API не вернул file_path');

        // 1. ОТКУДА БЕРЕМ (Из грязной зоны API)
        const sourcePath = path.join(
            this.config.apiStorageRoot, 
            this.config.token, 
            fileInfo.file_path
        );

        // 2. КУДА КЛАДЕМ (В чистую зону runtime)
        const destination = path.join(this.runtimeDir, `${fileId}.pdf`);

        console.log(`[FileService] Копирую: ${sourcePath} -> ${destination}`);

        // 3. КОПИРУЕМ
        try {
            await fs.promises.copyFile(sourcePath, destination);
            console.log(`[FileService] ✅ Файл в runtime!`);
            return destination;
        } catch (e: any) {
            // Если ошибка — значит исходный файл не создался из-за прав
            console.error(`[FileService] Ошибка: ${e.message}`);
            throw new Error(`Не удалось забрать файл из API: ${e.message}`);
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
