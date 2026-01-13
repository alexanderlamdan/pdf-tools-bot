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
        const fileName = `${fileId}.pdf`;
        const destination = path.join(this.tempDir, fileName);
        const fileUrl = `${this.config.apiRoot}/file/bot${this.config.token}/${fileInfo.file_path}`;
        try {
            const response = await axios({
                method: 'GET',
                url: fileUrl,
                responseType: 'stream'
            });
            await pipeline(response.data, createWriteStream(destination));
            return destination;
        }
        catch (e) {
            console.error(`Error downloading file: ${e.message}`);
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
