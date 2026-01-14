import fs from 'fs';
import path from 'path';
import { Context } from 'grammy';
import type { IBotConfig } from '../config/interfaces/IBotConfig.js';

// Функция ожидания (чтобы дать серверу время дописать файл)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class FileService {
    // Куда будем копировать файлы для обработки
    private readonly runtimeDir = '/srv/runtime';

    constructor(private readonly config: IBotConfig) {
        if (!fs.existsSync(this.runtimeDir)) {
            try { fs.mkdirSync(this.runtimeDir, { recursive: true }); } catch (e) {}
        }
    }

    async downloadFile(ctx: Context, fileId: string): Promise<string> {
        // 1. Получаем информацию о файле от API
        const fileInfo = await ctx.api.getFile(fileId);
        if (!fileInfo.file_path) throw new Error('API не вернул file_path');

        console.log(`[FileService] API path: ${fileInfo.file_path}`);

        // 2. Строим АБСОЛЮТНЫЙ путь к файлу на сервере
        // Если путь от API уже абсолютный (начинается с /), используем его.
        // Иначе собираем: ROOT + TOKEN + RELATIVE_PATH
        let sourcePath: string;
        if (path.isAbsolute(fileInfo.file_path)) {
            sourcePath = fileInfo.file_path;
        } else {
            sourcePath = path.join(
                this.config.apiStorageRoot, // /srv/telegram-bot-api
                this.config.token,          // 78496...
                fileInfo.file_path          // documents/file_xx.pdf
            );
        }

        const destination = path.join(this.runtimeDir, `${fileId}${path.extname(sourcePath)}`);

        console.log(`[FileService] Пытаюсь взять файл: ${sourcePath}`);

        // 3. ЦИКЛ ОЖИДАНИЯ (Wait Loop)
        // Сервер API может вернуть ответ до того, как файл физически записался на диск.
        // Ждем до 5 секунд.
        let attempts = 0;
        while (attempts < 50) { // 50 * 100ms = 5 sec
            if (fs.existsSync(sourcePath)) break;
            attempts++;
            await sleep(100);
        }

        // 4. ДИАГНОСТИКА ЕСЛИ НЕ НАШЛИ
        if (!fs.existsSync(sourcePath)) {
            const dir = path.dirname(sourcePath);
            let dirContents = 'НЕТ ДОСТУПА ИЛИ ПАПКИ';
            try {
                if (fs.existsSync(dir)) {
                    dirContents = fs.readdirSync(dir).join(', ');
                }
            } catch (e) {}
            
            throw new Error(`Файл не найден на диске!\nИскал: ${sourcePath}\nВ папке лежит: ${dirContents}`);
        }

        // 5. КОПИРУЕМ
        try {
            await fs.promises.copyFile(sourcePath, destination);
            console.log(`[FileService] ✅ Файл скопирован: ${destination}`);
            return destination;
        } catch (e: any) {
            throw new Error(`Ошибка копирования (права?): ${e.message}`);
        }
    }

    deleteFile(filePath: string): void {
        try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) {}
    }
}
