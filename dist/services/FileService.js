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
            throw new Error('Telegram API не вернул file_path');
        const destination = path.join(this.tempDir, `${fileId}.pdf`);
        const absolutePath = fileInfo.file_path;
        console.log(`[FileService] Вижу путь: ${absolutePath}`);
        let relativePath = absolutePath;
        if (absolutePath.includes(this.config.token)) {
            const parts = absolutePath.split(this.config.token);
            relativePath = parts[1];
            if (relativePath.startsWith('/') || relativePath.startsWith('\\')) {
                relativePath = relativePath.substring(1);
            }
        }
        else {
            const parts = absolutePath.split(path.sep);
            const typeIndex = parts.findIndex(p => ['documents', 'photos', 'voice'].includes(p));
            if (typeIndex !== -1)
                relativePath = parts.slice(typeIndex).join('/');
        }
        let baseUrl = this.config.apiRoot;
        if (!baseUrl.startsWith('http'))
            baseUrl = `http://${baseUrl}`;
        const fileUrl = `${baseUrl}/file/bot${this.config.token}/${relativePath}`;
        console.log(`[FileService] Качаю через сеть: ${fileUrl}`);
        try {
            const response = await axios({
                method: 'GET',
                url: fileUrl,
                responseType: 'stream',
                timeout: 30000
            });
            await pipeline(response.data, createWriteStream(destination));
            console.log(`[FileService] ✅ Сохранено у нас: ${destination}`);
            return destination;
        }
        catch (e) {
            console.error(`[FileService] Ошибка скачивания: ${e.message}`);
            throw new Error(`Не удалось скачать файл: ${e.message}`);
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
