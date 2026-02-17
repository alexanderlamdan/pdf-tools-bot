import axios from "axios";
import fs from "fs";
export class PdfWorkerService {
    config;
    constructor(config) {
        this.config = config;
    }
    async sendRequest(payload) {
        const socketPath = this.config.workerSocketPath;
        try {
            const response = await axios.post('http://localhost/process', payload, {
                socketPath: socketPath,
                headers: { 'Content-Type': 'application/json' },
                timeout: 60000
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
    async getPdfInfo(filePath, lang) {
        const data = await this.sendRequest({
            action: 'info',
            inputPath: filePath,
            lang: lang
        });
        return data.info;
    }
    async encrypt(filePath, password) {
        const data = await this.sendRequest({
            action: 'encrypt',
            inputPath: filePath,
            password: password
        });
        if (data.status === 'error')
            throw new Error(data.error);
        return data.path;
    }
    async decrypt(filePath, password) {
        const data = await this.sendRequest({
            action: 'decrypt',
            inputPath: filePath,
            password: password
        });
        if (data.status === 'error')
            throw new Error(data.error);
        return data.path;
    }
    async crack(filePath) {
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
    }
    async compress(filePath) {
        const data = await this.sendRequest({
            action: 'compress',
            inputPath: filePath
        });
        if (data.status === 'error')
            throw new Error(data.error);
        return data.path;
    }
}
