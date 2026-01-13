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
        let relativePath = fileInfo.file_path;
        if (path.isAbsolute(relativePath)) {
            const parts = relativePath.split(path.sep);
            const validTypes = ['documents', 'photos', 'videos', 'voice', 'music', 'video_notes', 'stickers'];
            const typeIndex = parts.findIndex(p => validTypes.includes(p));
            if (typeIndex !== -1) {
                relativePath = parts.slice(typeIndex).join('/');
            }
            else {
                relativePath = path.basename(relativePath);
            }
        }
        let baseUrl = this.config.apiRoot;
        if (!baseUrl.startsWith('http')) {
            baseUrl = `http://${baseUrl}`;
        }
        const fileUrl = `${baseUrl}/file/bot${this.config.token}/${relativePath}`;
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
            console.error(`Error with downloading file. URL: ${fileUrl} | error: ${e.message}`);
            throw new Error('Cant download file from local server');
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
