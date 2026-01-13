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

        const destination = path.join(this.tempDir, `${fileId}.pdf`);
        const absolutePath = fileInfo.file_path;

        console.log(`[DEBUG] Абсолютный путь от API: ${absolutePath}`);

        // --- ЛОГИКА ОБРЕЗАНИЯ ПУТИ ---
        // Нам нужно найти момент, где начинается стандартная папка Телеграма
        // Список папок, куда Телеграм кладет файлы
        const standardFolders = ['documents', 'photos', 'videos', 'voice', 'music', 'stickers', 'video_notes'];
        
        // Разбиваем путь на куски (с учетом Windows или Linux слешей)
        // Например: ['', 'srv', 'telegram-bot-api', 'TOKEN', 'documents', 'file.pdf']
        const parts = absolutePath.split(path.sep);
        
        let relativePath = '';
        
        // Ищем индекс папки (например 'documents')
        const folderIndex = parts.findIndex(part => standardFolders.includes(part));

        if (folderIndex !== -1) {
            // Собираем всё, начиная с этой папки
            // Было: /srv/.../documents/file.pdf -> Стало: documents/file.pdf
            relativePath = parts.slice(folderIndex).join('/');
        } else {
            // Если вдруг папка нестандартная, пробуем просто взять имя файла
            // Но в 99% случаев сработает if выше
            console.warn('[WARN] Не нашел стандартную папку, беру только имя файла');
            relativePath = path.basename(absolutePath);
        }

        console.log(`[DEBUG] Относительный путь для URL: ${relativePath}`);

        // Формируем URL
        // Убираем слеш в конце apiRoot, если он там есть, чтобы не было двойного //
        let root = this.config.apiRoot.replace(/\/$/, ''); 
        if (!root.startsWith('http')) root = `http://${root}`;

        const finalUrl = `${root}/file/bot${this.config.token}/${relativePath}`;
        
        console.log(`[DEBUG] Ссылка для скачивания: ${finalUrl}`);

        try {
            const response = await axios({
                method: 'GET',
                url: finalUrl,
                responseType: 'stream',
                timeout: 30000
            });

            await pipeline(response.data, createWriteStream(destination));
            console.log(`[SUCCESS] Файл скачан: ${destination}`);
            return destination;

        } catch (e: any) {
            // Если 404 - мы увидим URL выше и поймем ошибку
            console.error(`[ERROR] Ошибка Axios: ${e.message}`);
            console.error(`[ERROR] Статус: ${e.response?.status}`);
            throw new Error(`Скачивание не удалось: ${e.message}`);
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
