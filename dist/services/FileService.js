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
        const fileName = `${fileId}.pdf`;
        const destination = path.join(this.tempDir, fileName);
        try {
            if (fs.existsSync(fileInfo.file_path)) {
                console.log('File found in local, copying');
                fs.copyFileSync(fileInfo.file_path, destination);
                return destination;
            }
        }
        catch (e) {
            console.warn(`[FileService] Не удалось скопировать локально (права?): ${e.message}`);
        }
        console.log('[FileService] Пробую скачать через HTTP...');
        let baseUrl = this.config.apiRoot;
        if (!baseUrl.startsWith('http')) {
            baseUrl = `http://${baseUrl}`;
        }
        const fileUrl = `${this.config.apiRoot}/file/bot${this.config.token}/${fileInfo.file_path}`;
        try {
            const response = await axios({
                method: 'GET',
                url: fileUrl,
                responseType: 'stream',
                timeout: 30000
            });
            await pipeline(response.data, createWriteStream(destination));
            return destination;
        }
        catch (e) {
            console.error(`[FileService] FAIL. URL: ${fileUrl}`);
            if (e.code === 'ERR_INVALID_URL') {
                throw new Error(`Ошибка конфигурации URL: ${fileUrl}`);
            }
            throw new Error(`Не удалось получить файл ни локально, ни по сети: ${e.message}`);
        }
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
