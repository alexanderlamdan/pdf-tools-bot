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
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        // Путь, куда сервер положил файл (ИСТОЧНИК)
        const sourcePath = path.join(
            this.config.apiStorageRoot, 
            this.config.token, 
            fileInfo.file_path
        );

        // Путь, куда мы хотим его забрать (НАЗНАЧЕНИЕ)
        const destination = path.join(this.runtimeDir, `${fileId}.pdf`);

        console.log(`[FileService] Ищу файл: ${sourcePath}`);

        // --- ГЛАВНОЕ: ЦИКЛ ОЖИДАНИЯ ---
        // Сервер может тупить и писать файл на диск с задержкой в 10-100мс.
        // Если мы попытаемся прочитать сразу — получим ENOENT.
        // Поэтому мы ждем.
        let attempts = 0;
        const maxAttempts = 20; // Ждем до 2 секунд (20 * 100мс)
        
        while (attempts < maxAttempts) {
            if (fs.existsSync(sourcePath)) {
                break; // Файл появился! Выходим из цикла.
            }
            attempts++;
            // Ждем 100мс перед следующей проверкой
            await sleep(100);
        }

        // Если даже через 2 секунды файла нет — тогда реально ошибка
        if (!fs.existsSync(sourcePath)) {
            console.error(`[FileService] Файл не найден после ${maxAttempts} попыток.`);
            // Выводим содержимое папки, чтобы понять, что там вообще есть
            try {
                const dir = path.dirname(sourcePath);
                console.log(`Содержимое папки ${dir}:`, fs.readdirSync(dir));
            } catch (e) {}
            
            throw new Error(`TIMEOUT: Файл не появился на диске: ${sourcePath}`);
        }

        // --- КОПИРОВАНИЕ ---
        try {
            await fs.promises.copyFile(sourcePath, destination);
            console.log(`[FileService] ✅ Успешно забрали файл в runtime!`);
            return destination;
        } catch (e: any) {
            console.error(`[FileService] Ошибка копирования: ${e.message}`);
            throw new Error(`Ошибка при копировании: ${e.message}`);
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
