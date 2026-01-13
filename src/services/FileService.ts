import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { createWriteStream } from "fs";
import type { Context } from "grammy";
import type { IBotConfig } from "../config/interfaces/IBotConfig.js";

export class FileService {
  private readonly runtimeDir = "/srv/runtime";

  constructor(private readonly config: IBotConfig) {
    if (!fs.existsSync(this.runtimeDir)) {
      fs.mkdirSync(this.runtimeDir, { recursive: true });
    }
  }

  async downloadFile(ctx: Context, fileId: string): Promise<string> {
    const fileInfo = await ctx.api.getFile(fileId);
    if (!fileInfo.file_path) {
      throw new Error(`getFile вернул пустой file_path для file_id=${fileId}`);
    }

    // ВАЖНО: apiRoot должен указывать на твой локальный bot-api, например: http://127.0.0.1:8081
    // Ниже предполагаю, что в config у тебя есть:
    // - config.botToken (токен бота)
    // - config.apiRoot (адрес локального bot api)
    const apiRoot = this.config.apiRoot;   // например "http://127.0.0.1:8081"
    const token = this.config.token;    // токен

    if (!apiRoot || !token) {
      throw new Error("Не задан config.apiRoot или config.botToken");
    }

    // Собираем URL скачивания
    const downloadUrl = new URL(
      `/file/bot${token}/${encodeURI(fileInfo.file_path)}`,
      apiRoot
    ).toString();

    // Куда сохраняем
    const baseName = path.basename(fileInfo.file_path).replace(/[^\w.\-()+ ]/g, "_");
    const outPath = path.join(this.runtimeDir, `${Date.now()}_${baseName}`);

    const res = await fetch(downloadUrl);
    if (!res.ok || !res.body) {
      throw new Error(`Ошибка скачивания: HTTP ${res.status} ${res.statusText}`);
    }

    await pipeline(res.body as unknown as NodeJS.ReadableStream, createWriteStream(outPath));
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
