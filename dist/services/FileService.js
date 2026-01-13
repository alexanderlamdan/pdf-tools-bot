import fs from 'fs';
import path from 'path';
import os from 'os';
import { Context } from 'grammy';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import axios from 'axios';
export class FileService {
    config;
    tempDir = path.join(os.tmpdir(), 'pdf-bot-files');
    constructor(config) {
        this.config = config;
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }
    async downloadFile(ctx, fileId) {
        const fileInfo = await ctx.api.getFile(fileId);
        if (!fileInfo.file_path)
            throw new Error('Cant get the file path');
        console.log(`[FileService] Получен file_path от API: ${fileInfo.file_path}`);
        const sourcePath = path.join(this.config.apiStorageRoot, this.config.token, fileInfo.file_path);
        const destination = path.join(this.tempDir, `${fileId}.pdf`);
        const parentDir = path.dirname(sourcePath);
        console.log(`[DEBUG] Ищу файл: ${sourcePath}`);
        if (!fs.existsSync(sourcePath)) {
            console.error('!!! ФАЙЛ НЕ НАЙДЕН. ВКЛЮЧАЮ РЕЖИМ ОТЛАДКИ !!!');
            if (fs.existsSync(parentDir)) {
                console.log(`📂 Папка ${parentDir} существует. Содержимое:`);
                try {
                    const files = fs.readdirSync(parentDir);
                    console.log(files);
                    if (files.length === 0)
                        console.log('(Папка пуста)');
                }
                catch (e) {
                    console.error(`⛔ Бот не может прочитать папку (ПРАВА ДОСТУПА?): ${e.message}`);
                }
            }
            else {
                console.error(`⛔ Папка ${parentDir} вообще не существует!`);
                console.error(`Проверь apiStorageRoot в конфиге. Сейчас он: ${this.config.apiStorageRoot}`);
            }
            throw new Error(`Файл не найден (или нет прав): ${sourcePath}`);
        }
        await fs.promises.copyFile(sourcePath, destination);
        console.log(`[FileService] ✅ Успех!`);
        return destination;
    }
    deleteFile(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        catch (e) {
            console.error(`Error to delete file: ${e.message}`);
        }
    }
}
