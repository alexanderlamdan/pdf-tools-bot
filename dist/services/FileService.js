import fs from "fs";
import path from "path";
import { Context, Api } from "grammy";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export class FileService {
    config;
    localApi;
    runtimeDir = "/srv/runtime";
    constructor(config, localApi) {
        this.config = config;
        this.localApi = localApi;
        if (!fs.existsSync(this.runtimeDir)) {
            try {
                fs.mkdirSync(this.runtimeDir, { recursive: true });
            }
            catch { }
        }
    }
    async downloadFile(ctx, fileId) {
        const fileInfo = await this.localApi.getFile(fileId);
        if (!fileInfo.file_path)
            throw new Error("API не вернул file_path");
        console.log(`[FileService] file_path: ${fileInfo.file_path}`);
        const sourcePath = path.isAbsolute(fileInfo.file_path)
            ? fileInfo.file_path
            : path.join(this.config.apiStorageRoot, this.config.token, fileInfo.file_path);
        const ext = path.extname(fileInfo.file_path) || ".bin";
        const destination = path.join(this.runtimeDir, `${fileId}${ext}`);
        console.log(`[FileService] Жду файл на диске: ${sourcePath}`);
        const timeoutMs = 15_000;
        const stepMs = 150;
        const start = Date.now();
        while (!fs.existsSync(sourcePath)) {
            if (Date.now() - start > timeoutMs) {
                const dir = path.dirname(sourcePath);
                let dirContents = "НЕТ ДОСТУПА ИЛИ ПАПКИ";
                try {
                    if (fs.existsSync(dir))
                        dirContents = fs.readdirSync(dir).slice(0, 50).join(", ");
                }
                catch { }
                throw new Error(`TIMEOUT: Файл не появился на диске.\n` +
                    `Искал: ${sourcePath}\n` +
                    `Содержимое папки: ${dirContents}`);
            }
            await sleep(stepMs);
        }
        try {
            await fs.promises.copyFile(sourcePath, destination);
            console.log(`[FileService] ✅ Файл скопирован в runtime: ${destination}`);
            return destination;
        }
        catch (e) {
            throw new Error(`Ошибка копирования (права?): ${e?.message ?? e}`);
        }
    }
    deleteFile(filePath) {
        try {
            if (fs.existsSync(filePath))
                fs.unlinkSync(filePath);
        }
        catch { }
    }
}
