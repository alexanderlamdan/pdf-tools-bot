import axios from "axios";
import fs from "fs";
import { SmartQueueService } from './SmartQueueService.js';
export class PdfWorkerService {
    config;
    queueService;
    constructor(config, queueService) {
        this.config = config;
        this.queueService = queueService;
    }
    async sendRequest(payload) {
        const socketPath = this.config.workerSocketPath;
        try {
            const response = await axios.post('http://localhost/process', payload, {
                socketPath: socketPath,
                headers: { 'Content-Type': 'application/json' },
                timeout: 300_000
            });
            const data = response.data;
            if (data.status === 'error') {
                throw new Error(data.error);
            }
            return response.data || 'No Information';
        }
        catch (e) {
            console.error(`[PdfWorkerService] Failed connect to worker: ${e.message}`);
            if (e.code === 'ENOENT') {
                throw new Error(`Socket file not found: ${socketPath} (Check if socket is on)`);
            }
            if (e.code === 'EACCES') {
                throw new Error(`Permissions denied: ${socketPath} (check chmod/user)`);
            }
            if (e.code === 'ECONNREFUSED') {
                throw new Error('Worker dont get connections (Worker down?)');
            }
            throw new Error(e.response?.data?.error || e.message);
        }
    }
    async getPdfInfo(ctx, filePath, lang, sizeBytes) {
        return this.queueService.enqueue(ctx, 'info', sizeBytes, async () => {
            const data = await this.sendRequest({
                action: 'info',
                inputPath: filePath,
                lang: lang
            });
            return data.info;
        });
    }
    async encrypt(ctx, filePath, password, sizeBytes) {
        return this.queueService.enqueue(ctx, 'encrypt', sizeBytes, async () => {
            const data = await this.sendRequest({
                action: 'encrypt',
                inputPath: filePath,
                password: password
            });
            if (data.status === 'error')
                throw new Error(data.error);
            return data.path;
        });
    }
    async decrypt(ctx, filePath, password, sizeBytes) {
        return this.queueService.enqueue(ctx, 'decrypt', sizeBytes, async () => {
            const data = await this.sendRequest({
                action: 'decrypt',
                inputPath: filePath,
                password: password
            });
            if (data.status === 'error')
                throw new Error(data.error);
            return data.path;
        });
    }
    async crack(ctx, filePath, sizeBytes) {
        return this.queueService.enqueue(ctx, 'crack', sizeBytes, async () => {
            const data = await this.sendRequest({
                action: 'crack',
                inputPath: filePath
            });
            if (data.status === 'error')
                throw new Error(data.error);
            return {
                path: data.path,
                password: data.info
            };
        });
    }
    async compress(ctx, filePath, sizeBytes) {
        return this.queueService.enqueue(ctx, 'compress', sizeBytes, async () => {
            const data = await this.sendRequest({
                action: 'compress',
                inputPath: filePath
            });
            if (data.status === 'error')
                throw new Error(data.error);
            return data.path;
        });
    }
    async repair(ctx, filePath, sizeBytes) {
        return this.queueService.enqueue(ctx, 'repair', sizeBytes, async () => {
            const data = await this.sendRequest({
                action: 'repair',
                inputPath: filePath
            });
            if (data.status === 'error')
                throw new Error(data.error);
            return data.path;
        });
    }
    async split(ctx, filePath, pages, sizeBytes) {
        return this.queueService.enqueue(ctx, 'split', sizeBytes, async () => {
            const data = await this.sendRequest({
                action: 'split',
                inputPath: filePath,
                pages: pages,
                originalName: ctx.session.tempParams?.originalName || 'Document.pdf'
            });
            if (data.status === 'error')
                throw new Error(data.error);
            return {
                path: data.path,
                paths: data.paths,
                zipPath: data.zipPath
            };
        });
    }
    async merge(ctx, filePaths, sizeBytes) {
        return this.queueService.enqueue(ctx, 'merge', sizeBytes, async () => {
            const data = await this.sendRequest({
                action: 'merge',
                inputPaths: filePaths
            });
            if (data.status === 'error')
                throw new Error(data.error);
            return {
                path: data.path,
                paths: data.paths,
                zipPath: data.zipPath,
                isFallback: data.isFallback ?? false,
            };
        });
    }
}
