import fs from "node:fs";
import path from "node:path";
import { Context } from "grammy";
import type { IBotConfig } from "../config/interfaces/IBotConfig.js";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export class FileService {
  private readonly runtimeDir = "/srv/runtime";
  private readonly botApiDir = "/srv/telegram-bot-api"; // у тебя так в --dir

  constructor(private readonly config: IBotConfig) {
    if (!fs.existsSync(this.runtimeDir)) fs.mkdirSync(this.runtimeDir, { recursive: true });
  }

  async downloadFile(ctx: Context, fileId: string): Promise<string> {
    const fileInfo = await ctx.api.getFile(fileId);
    if (!fileInfo.file_path) throw new Error("getFile вернул пустой file_path");

    const token = this.config.token; // подставь имя поля из своего конфига
    if (!token) throw new Error("В конфиге нет botToken");

    // 1) Превращаем file_path в локальный путь
    const localPath = path.isAbsolute(fileInfo.file_path)
      ? fileInfo.file_path
      : path.join(this.botApiDir, token, fileInfo.file_path);

    // 2) Ждём, пока telegram-bot-api докачает файл на диск
    const timeoutMs = 15_000;
    const stepMs = 250;
    const start = Date.now();

    while (!fs.existsSync(localPath)) {
      if (Date.now() - start > timeoutMs) {
        throw new Error(`TIMEOUT: Файл не появился на диске: ${localPath}`);
      }
      await sleep(stepMs);
    }

    // 3) Копируем в runtime (чтобы не зависеть от кеша bot-api)
    const baseName = path.basename(fileInfo.file_path).replace(/[^\w.\-()+ ]/g, "_");
    const outPath = path.join(this.runtimeDir, `${Date.now()}_${baseName}`);
    await fs.promises.copyFile(localPath, outPath);

    return outPath;
  }

  deleteFile(filePath: string) {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e: any) {
      console.error(`Error to delete file: ${e?.message ?? e}`);
    }
  }
}
