import { InputFile } from 'grammy';
import { BaseHandler } from '../base/BaseHandler.js';
import { MergeAction } from '../buttons/actions/MergeAction.js';
import { initialSession } from '../../types/SessionData.js';
import { FileNameUtils } from '../../utils/FileNameUtils.js';
import { notifyTrafficAfterResult } from '../../utils/TrafficNotifier.js';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
const ARCHIVE_MIMES = new Set([
    'application/zip', 'application/x-zip-compressed',
    'application/x-rar-compressed', 'application/vnd.rar',
    'application/x-7z-compressed',
    'application/x-tar', 'application/gzip', 'application/x-gzip', 'application/x-bzip2',
    'application/octet-stream',
]);
const ARCHIVE_EXTENSIONS = new Set(['.zip', '.rar', '.7z', '.tar', '.gz', 'tgz']);
export class MergeArchiveHandler extends BaseHandler {
    isArchive(ctx) {
        const doc = ctx.message?.document;
        if (!doc)
            return false;
        const mime = doc.mime_type || '';
        const ext = path.extname(doc.file_name || '').toLowerCase();
        const fullName = (doc.file_name || '').toLowerCase();
        if (fullName.endsWith('.tar.gz') || fullName.endsWith('.tar.xz') || fullName.endsWith('.tar.bz2'))
            return true;
        return ARCHIVE_MIMES.has(mime) || ARCHIVE_EXTENSIONS.has(ext);
    }
    async handle(ctx) {
        const lang = this.getLang(ctx);
        const i18n = this.getI18n(ctx);
        const isAdmin = this.isAdmin(ctx);
        const doc = ctx.message?.document;
        await this.logger.logAction('MergeArchiveHandler:handle', ctx.from, 'Archive received', `${doc.file_name} (${doc.mime_type})`);
        const statusMsg = await ctx.reply(i18n.messages.common.wait, { parse_mode: 'HTML' });
        let archivePath = null;
        let tempDir = null;
        try {
            archivePath = await this.fileService.downloadFile(ctx, doc.file_id);
            tempDir = await fs.promises.mkdtemp('/srv/runtime/merge_archive');
            await this.extract(archivePath, tempDir, doc.file_name || '');
            const pdfFiles = await this.collectPdfs(tempDir);
            await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => { });
            if (pdfFiles.length === 0) {
                await ctx.reply(i18n.errors.pdf_archive, { parse_mode: 'HTML' });
                return;
            }
            if (pdfFiles.length === 1) {
                await ctx.reply(i18n.errors.single_pdf_archive, { parse_mode: 'HTML' });
                return;
            }
            await this.logger.logAction('MergeArchiveHandler:handle', ctx.from, 'Archive extracted', `Found ${pdfFiles.length} PDFs`);
            let totalSize = 0;
            for (const f of pdfFiles)
                totalSize += (await fs.promises.stat(f)).size;
            await this.logger.logAction('MergeArchiveHandler:handle', ctx.from, 'Sending to merge', `Paths: ${pdfFiles.join(', ')}`);
            const result = await this.worker.merge(ctx, pdfFiles, totalSize);
            const archiveName = FileNameUtils.getSafeName(doc.file_name || 'archived', '_merged');
            if (result.isFallback) {
                await new MergeAction(ctx, this).deliverFallback(result, lang, isAdmin, i18n);
            }
            else {
                const safeName = archiveName.replace(/\.[^.]+$/, '') + '_merged.pdf';
                await this.logger.logAction('MergeArchiveHandler:handle', ctx.from, 'Archive merged', `${pdfFiles.length} PDFs`, 'success');
                await ctx.replyWithDocument(new InputFile(result.path, safeName), {
                    caption: `${i18n.messages.actions.merged_from_archive} ${pdfFiles.length}`,
                    parse_mode: 'HTML',
                    reply_markup: this.keyboards.getMainMenu(lang, isAdmin)
                });
                await this.db.logAction(ctx.from.id, 'merge', totalSize);
                await this.fileService.deleteFile(result.path);
                await notifyTrafficAfterResult(ctx, lang, this.localization, this.keyboards, this.logger);
            }
            ctx.session = initialSession();
        }
        catch (e) {
            await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => { });
            await this.logger.error('MergeArchiveHandler:handle', e, { user: ctx.from, message: ctx.message });
            await ctx.reply(`${i18n.errors.error_proccesing_archive} ${e.message}`, { parse_mode: 'HTML' });
            ctx.session = initialSession();
        }
        finally {
            if (archivePath)
                await this.fileService.deleteFile(archivePath).catch(() => { });
            if (tempDir)
                await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => { });
        }
    }
    async extract(archivePath, targetDir, fileName) {
        const lower = fileName.toLowerCase();
        const run = (cmd) => execSync(cmd, { timeout: 300_000 });
        if (lower.endsWith('.tar.gz') || lower.endsWith('.tgz'))
            run(`tar -xzf "${archivePath}" -C "${targetDir}"`);
        else if (lower.endsWith('.tar.xz'))
            run(`tar -xJf "${archivePath}" -C "${targetDir}"`);
        else if (lower.endsWith('.tar.bz2'))
            run(`tar -xjf "${archivePath}" -C "${targetDir}"`);
        else if (lower.endsWith('.tar'))
            run(`tar -xf "${archivePath}" -C "${targetDir}"`);
        else if (lower.endsWith('.zip'))
            run(`unzip -q "${archivePath}" -d "${targetDir}"`);
        else if (lower.endsWith('.7z'))
            run(`7z x "${archivePath}" -o"${targetDir}" -y`);
        else if (lower.endsWith('.rar')) {
            try {
                run(`unrar x -y "${archivePath}" "${targetDir}/"`);
            }
            catch {
                run(`bsdtar -xf "${archivePath}" -C "${targetDir}"`);
            }
        }
        else {
            run(`bsdtar -xf "${archivePath}" -C "${targetDir}"`);
        }
    }
    async collectPdfs(dir) {
        const result = [];
        const walk = async (current) => {
            const entries = await fs.promises.readdir(current, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(current, entry.name);
                if (entry.isDirectory())
                    await walk(fullPath);
                else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf'))
                    result.push(fullPath);
            }
        };
        await walk(dir);
        result.sort((a, b) => path.basename(a).toLowerCase().localeCompare(path.basename(b).toLowerCase(), undefined, { numeric: true, sensitivity: 'base' }));
        const safePaths = [];
        for (let i = 0; i < result.length; i++) {
            const safePath = path.join(path.dirname(result[i]), `__safe_${i + 1}.pdf`);
            await fs.promises.rename(result[i], safePath);
            safePaths.push(safePath);
        }
        return safePaths;
    }
}
