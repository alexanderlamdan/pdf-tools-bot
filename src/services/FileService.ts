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
        
       if (!fs.existsSync(this.tempDir)) {
            try {
                fs.mkdirSync(this.tempDir, { recursive: true });
            } catch (e) {
                console.error('CRITICAL: Не могу создать temp папку!', e);
            }
        }
        
    }
    
    async downloadFile(ctx: Context, fileId: string): Promise<string> {
        const fileInfo = await ctx.api.getFile(fileId);
        
        if (!fileInfo.file_path) throw new Error('API не вернул file_path');

        // Ожидаемый путь: /srv/telegram-bot-api/<TOKEN>/documents/file.pdf
        const sourcePath = path.join(
            this.config.apiStorageRoot, 
            this.config.token, 
            fileInfo.file_path
        );
        
        const destination = path.join(this.tempDir, `${fileId}.pdf`);

        console.log(`[FileService] Пробую взять файл: ${sourcePath}`);

        try {
            await fs.promises.copyFile(sourcePath, destination);
            console.log(`[FileService] ✅ Успех! Файл у нас.`);
            return destination;

        } catch (e: any) {
            // --- ЛОВУШКА ДЛЯ ОШИБКИ ---
            console.error(`[FileService] ❌ ОШИБКА: ${e.message}`);

            if (e.code === 'ENOENT') {
                console.log('--- 🔍 НАЧИНАЮ РАССЛЕДОВАНИЕ (Что в папке?) ---');
                
                // 1. Проверим папку токена
                const tokenDir = path.join(this.config.apiStorageRoot, this.config.token);
                if (fs.existsSync(tokenDir)) {
                    console.log(`📂 Папка токена (${tokenDir}) существует.`);
                    
                    // 2. Проверим папку documents
                    const docDir = path.dirname(sourcePath);
                    if (fs.existsSync(docDir)) {
                        console.log(`📂 Папка документов (${docDir}) существует.`);
                        console.log('📄 Содержимое папки:');
                        try {
                            const files = fs.readdirSync(docDir);
                            console.log(files); // <--- ВОТ ЭТО САМОЕ ВАЖНОЕ
                        } catch (err) {
                            console.log('Не могу прочитать содержимое (права?).');
                        }
                    } else {
                        console.log(`⛔ Папки документов НЕТ: ${docDir}`);
                        console.log('Содержимое папки токена:');
                        try { console.log(fs.readdirSync(tokenDir)); } catch {}
                    }
                } else {
                    console.log(`⛔ Папки токена НЕТ: ${tokenDir}`);
                    console.log(`Проверь apiStorageRoot: ${this.config.apiStorageRoot}`);
                    console.log('Содержимое корня apiStorageRoot:');
                    try { console.log(fs.readdirSync(this.config.apiStorageRoot)); } catch {}
                }
                console.log('--- КОНЕЦ РАССЛЕДОВАНИЯ ---');
            }

            throw new Error(`Сбой копирования: ${e.message}`);
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
