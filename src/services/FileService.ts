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

  deleteFile(filePath: string) {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e: any) {
      console.error(`Error to delete file: ${e?.message ?? e}`);
    }
  }
}
