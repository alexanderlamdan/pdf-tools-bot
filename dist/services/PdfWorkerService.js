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
                timeout: 2000
            });
            const data = response.data;
            if (data.status === 'error') {
                throw new Error(data.error);
            }
            return data.info || 'No Information';
        }
        catch (e) {
            console.error(`[PdfWorkerService] Ошибка запроса к воркеру: ${e.message}`);
            if (e.code === 'ENOENT') {
                throw new Error(`Файл сокета не найден: ${socketPath} (Проверь, запущен ли worker)`);
            }
            if (e.code === 'EACCES') {
                throw new Error(`Нет прав доступа к сокету: ${socketPath} (Проверь chmod/user)`);
            }
            if (e.code === 'ECONNREFUSED') {
                throw new Error('Воркер не принимает соединения (Воркер упал?)');
            }
            throw new Error(e.response?.data?.error || e.message);
        }
    }
}
