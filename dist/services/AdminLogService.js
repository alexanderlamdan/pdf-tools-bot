import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
const execAsync = promisify(exec);
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const CLEAN_SIZE_THRESHOLD = 45 * 1024 * 1024;
export class AdminLogService {
    config;
    botLogDir;
    workerLogDir;
    constructor(config) {
        this.config = config;
        this.botLogDir = `/srv/runtime/${config.botName}/logs`;
        this.workerLogDir = path.join(process.cwd(), '..', 'worker-go', 'logs');
    }
    async collectAndArchive() {
        const tmpDir = path.join(os.tmpdir(), `pdf-bot-logs-${Date.now()}`);
        fs.mkdirSync(tmpDir, { recursive: true });
        const allFiles = this.gatherLogFiles();
        if (allFiles.length === 0) {
            fs.rmdirSync(tmpDir, { recursive: true });
            throw new Error('No logs found on the server');
        }
        for (const file of allFiles) {
            const dest = path.join(tmpDir, file.label);
            try {
                fs.copyFileSync(file.fullPath, dest);
            }
            catch (e) {
                console.warn(`[AdminLogService] Could not copy ${file.fullPath}: ${e}`);
            }
        }
        const archiveName = `logs_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
        const archivePath = path.join(os.tmpdir(), archiveName);
        try {
            await execAsync(`zip -r "${archivePath}" .`, { cwd: tmpDir });
        }
        catch (e) {
            const tarPath = archivePath.replace('.zip', '.tar.gz');
            await execAsync(`tar -czf "${tarPath}" .`, { cwd: tmpDir });
            await execAsync(`rm -rf "${tmpDir}"`);
            const report = this.buildReport(allFiles);
            this.cleanOldLogs(allFiles);
            return { archivePath: tarPath, report };
        }
        await execAsync(`rm -rf "${tmpDir}`);
        const report = this.buildReport(allFiles);
        this.cleanOldLogs(allFiles);
        return { archivePath, report };
    }
    gatherLogFiles() {
        const result = [];
        this.scanDir(this.botLogDir, 'bot', result);
        this.scanDir(this.workerLogDir, 'worker', result);
        return result;
    }
    scanDir(dir, prefix, result) {
        if (!fs.existsSync(dir)) {
            console.log(`[AdminLogService] Directory not found, skipping: ${dir}`);
            return;
        }
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    this.scanDir(fullPath, `${prefix}/${entry.name}`, result);
                }
                else if (entry.isFile()) {
                    try {
                        const stat = fs.statSync(fullPath);
                        const label = `${prefix}/${entry.name}`.replace(/\//g, '_');
                        const isOldEnough = (Date.now() - stat.mtimeMs) >= ONE_WEEK_MS;
                        const isBigEnough = stat.size >= CLEAN_SIZE_THRESHOLD;
                        result.push({
                            fullPath,
                            label,
                            sizeBytes: stat.size,
                            mtimeMs: stat.mtimeMs,
                            shouldClean: isOldEnough && isBigEnough
                        });
                    }
                    catch (e) {
                        console.warn(`[AdminLogService] Can't stat file ${fullPath}: ${e}`);
                    }
                }
            }
        }
        catch (e) {
            console.warn(`[AdminLogService] Can't read dir ${dir}: ${e}`);
        }
    }
    cleanOldLogs(files) {
        let cleaned = 0;
        for (const file of files) {
            if (file.shouldClean) {
                try {
                    fs.unlinkSync(file.fullPath);
                    console.log(`[AdminLogService] Cleaned old log: ${file.fullPath} (${this.formatSize(file.sizeBytes)}, ${this.formatAge(file.mtimeMs)})`);
                    cleaned++;
                }
                catch (e) {
                    console.error(`[AdminLogService] Failed to delete ${file.fullPath}:${e}`);
                }
            }
        }
        console.log(`[AdminLogService] Cleaned ${cleaned} old log files`);
    }
    buildReport(files) {
        const now = Date.now();
        let totalSize = 0;
        let cleanedCount = 0;
        let cleanedSize = 0;
        const lines = [];
        for (const f of files) {
            totalSize += f.sizeBytes;
            const age = this.formatAge(f.mtimeMs);
            const size = this.formatSize(f.sizeBytes);
            const cleanMark = f.shouldClean ? ' (will be removed)' : '';
            lines.push(`• <code>${f.label}</code>\n  💾 ${size} | 📅 ${age}${cleanMark}`);
            if (f.shouldClean) {
                cleanedCount++;
                cleanedSize += f.sizeBytes;
            }
        }
        let report = `📋 <b>Server logs</b>\n`;
        report += `📦 Files: <b>${files.length}</b> | Summary: <b>${this.formatSize(totalSize)}</b>\n`;
        if (cleanedCount > 0) {
            report += `🗑 Cleaned (>7days и >45MB): <b>${cleanedCount}</b> files (${this.formatSize(cleanedSize)})\n`;
        }
        else {
            report += `✅ No files for cleanup (<7d or <45MB)\n`;
        }
        report += `\n<b>Files:</b>\n${lines.join('\n')}`;
        return report;
    }
    formatSize(bytes) {
        if (bytes < 1024)
            return `${bytes}B`;
        if (bytes < 1024 * 1024)
            return `${(bytes / 1024).toFixed(1)}KB`;
        return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
    }
    formatAge(mtimeMs) {
        const diffMs = Date.now() - mtimeMs;
        const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
        const hours = Math.floor(diffMs % (24 * 60 * 60 * 1000) / (60 * 60 * 1000));
        if (days > 0)
            return `${days}d ${hours}h`;
        return `${hours}h`;
    }
}
