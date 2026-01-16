import axios from "axios";
import fs from "fs";
export class PdfWorkerService {
    config;
    constructor(config) {
        this.config = config;
    }
    async getPdfInfo(filePath) {
        const socketPath = this.config.workerSocketPath;
        try {
            const response = await axios.post('http://localhost/process', {
                action: 'info',
                inputPath: filePath
            }, {
                socketPath: socketPath,
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });
            const data = response.data;
            if (data.status === 'error') {
                throw new Error(data.error);
            }
            return data.info || 'No Information';
        }
        catch (e) {
            console.error(`Worker Communication Error: ${e.message}`);
            if (e.code === 'ENOENT' || e.code === 'ECONNREFUSED') {
                throw new Error('PDF Service is under construction.');
            }
            throw new Error(e.response?.data?.error || e.message);
        }
    }
}
