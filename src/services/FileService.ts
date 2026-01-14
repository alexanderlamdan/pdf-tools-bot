import fs from "fs";
import path from "path";
import { Context, Api} from "grammy";
import type { IBotConfig } from "../config/interfaces/IBotConfig.js";
import type { RawApi } from "grammy";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class FileService {
  private readonly runtimeDir = "/srv/runtime";

  constructor(
    private readonly config: IBotConfig,
    private readonly localApi: Api<RawApi>, // ✅ тот самый localApi из TelegramBotCore
  ) {
    if (!fs.existsSync(this.runtimeDir)) {
      try {
        fs.mkdirSync(this.runtimeDir, { recursive: true });
      } catch {}
    }
  }

  async downloadFile(ctx: Context, fileId: string): Promise<string> {
    // 1) Получаем file_path через LOCAL Bot API
    const fileInfo = await this.localApi.getFile(fileId);
    if (!fileInfo.file_path) throw new Error("API не вернул file_path");

    // ВАЖНО: не логируй токен/полные пути с токеном
    console.log(`[FileService] file_path: ${fileInfo.file_path}`);

    // 2) Строим путь к файлу на диске
    // В local-mode file_path может быть абсолютным. Если относительный — собираем через --dir + token + file_path
    const sourcePath = path.isAbsolute(fileInfo.file_path)
      ? fileInfo.file_path
      : path.join(
          this.config.apiStorageRoot, // то, что у тебя в --dir (например /srv/telegram-bot-api)
          this.config.token,          // токен (да, так устроена структура хранения)
          fileInfo.file_path,
        );

    // 3) Назначение: runtime
    const ext = path.extname(fileInfo.file_path) || ".bin";
    const destination = path.join(this.runtimeDir, `${fileId}${ext}`);

    console.log(`[FileService] Жду файл на диске: ${sourcePath}`);

    // 4) Ждём появления (увеличил до 15с — 5с часто мало под нагрузкой)
    const timeoutMs = 15_000;
    const stepMs = 150;
    const start = Date.now();

    while (!fs.existsSync(sourcePath)) {
      if (Date.now() - start > timeoutMs) {
        // Диагностика каталога
        const dir = path.dirname(sourcePath);
        let dirContents = "НЕТ ДОСТУПА ИЛИ ПАПКИ";
        try {
          if (fs.existsSync(dir)) dirContents = fs.readdirSync(dir).slice(0, 50).join(", ");
        } catch {}
        throw new Error(
          `TIMEOUT: Файл не появился на диске.\n` +
          `Искал: ${sourcePath}\n` +
          `Содержимое папки: ${dirContents}`
        );
      }
      await sleep(stepMs);
    }

    // 5) Копируем в runtime
    try {
      await fs.promises.copyFile(sourcePath, destination);
      console.log(`[FileService] ✅ Файл скопирован в runtime: ${destination}`);
      return destination;
    } catch (e: any) {
      throw new Error(`Ошибка копирования (права?): ${e?.message ?? e}`);
    }
  }

  deleteFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {}
  }
}
