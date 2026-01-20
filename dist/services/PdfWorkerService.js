import axios from "axios";
import fs from "fs";
export class PdfWorkerService {
    config;
    constructor(config) {
        this.config = config;
    }
    async getPdfInfo(filePath, lang) {
        const socketPath = this.config.workerSocketPath;
        try {
            const response = await axios.post('http://localhost/process', {
                action: 'info',
                inputPath: filePath,
                lang: lang
            }, {
                socketPath: socketPath,
                headers: { 'Content-Type': 'application/json' },
                timeout: 2000
            });
            const data = response.data;
            if (data.status === 'error') {
                throw new Error(data.error);
            }
            return data.info || 'No Information';
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
}
