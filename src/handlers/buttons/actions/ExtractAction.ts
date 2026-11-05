import type { BotContext }          from '../../../types/BotContext.js';
import { InputFile }                from 'grammy';
import { initialSession }           from '../../../types/SessionData.js';
import { FileNameUtils }            from '../../../utils/FileNameUtils.js';
import { isDuplicateCall }          from '../../../utils/BusyGuard.js';
import { handleProcessingTimeout, handleServerBusy, handleUserCancelled, handleWorkerTechnicalError } from '../../../utils/ProcessingTimeoutHelper.js';
import { maskSensitiveAndEscape, escapeHtml } from '../../../utils/SensitiveDataMasker.js';
import { sendPreActionInfo, sendTrafficUsedSummary } from '../../../utils/PreActionInfo.js';
import fs                           from 'fs';

export class ExtractAction{

    constructor(
        private readonly ctx:     BotContext,
        private readonly handler: any,
    ){}

    async showModeMenu(): Promise<void>{

        const { ctx, handler } = this;
        const i18n = handler.getI18n();

        await handler.logger.logAction('ExtractAction:showModeMenu', ctx.from!, 'Extract', 'Showing mode menu');

        ctx.session.currentAction = 'extract';

        await ctx.reply(i18n.messages.actions.extract.ask_extract_mode, {
            parse_mode:   'HTML',
            reply_markup: {
                keyboard: [
                    [{text: i18n.messages.actions.extract.buttons.btn_extract_text}],
                    [{text: i18n.messages.actions.extract.buttons.btn_extract_images}],
                    [{text: i18n.messages.actions.extract.buttons.btn_extract_search}],
                    [{text: i18n.messages.actions.extract.buttons.btn_extract_wordcount}],
                    [{text: i18n.messages.user.buttons.common.btn_back}],
                ],
                resize_keyboard: true,
            },
        });

    }

    async extractText(): Promise<void>{

        const { ctx, handler } = this;
        const i18n    = handler.getI18n();
        const isAdmin = handler.isAdmin(ctx);

        ctx.session.currentAction = 'extract';

        if(isDuplicateCall(ctx, handler)) return;

        const filePath      = ctx.session.filePaths[0];
        const originalName  = ctx.session.tempParams?.originalName || 'document.pdf';

        if(!filePath){

            await ctx.reply(i18n.errors.file_lost);
            ctx.session = initialSession();
            return;

        }

        const sizeBytes = fs.statSync(filePath).size;

        await sendPreActionInfo(
            ctx, handler,
            i18n.messages.actions.extract.rule_text,
            i18n.messages.actions.extract.availability,
        );

        await handler.logger.logAction('ExtractAction:extractText', ctx.from!, 'Extract text started', `File: ${originalName}`);

        const statusMsg = await ctx.reply(i18n.messages.actions.extract.extracting_text, {parse_mode: 'HTML', reply_markup: handler.keyboards.getCancelOnlyMenu()});

        setImmediate(async () => {

            try{

                const resultPath = await handler.worker.extractText(ctx, filePath, sizeBytes);

                await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});

                const safeName = FileNameUtils.getSafeName(originalName, '_extracted').replace(/\.pdf$/i, '.txt');
                const isPaidResult = await handler.isPaidUser(ctx);

                await ctx.replyWithDocument(new InputFile(resultPath, safeName), {
                    caption:      i18n.messages.actions.extract.success_extract_text,
                    parse_mode:   'HTML',
                    reply_markup: handler.keyboards.getFileActionsMenu([], isPaidResult),
                });

                await handler.logger.logAction('ExtractAction:extractText', ctx.from!, 'Extract text result', `File: ${originalName}`, 'Success');

                await handler.db.logAction(ctx.from!.id, 'extract_text', 0);

                await sendTrafficUsedSummary(ctx, handler, 0);

                await handler.fileService.deleteFile(resultPath).catch(() => {});

            }catch(e: any){

                await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});

                if(e.message === 'PROCESSING_TIMEOUT'){

                    await handleProcessingTimeout(ctx, handler, 'ExtractText', originalName);

                }else if(e.message === 'SERVER_BUSY'){

                    await handleServerBusy(ctx, handler, 'ExtractText', originalName);

                }else if(e.message === 'USER_CANCELLED'){

                    await handleUserCancelled(ctx, handler, 'ExtractText', originalName);

                }else if(e.message === 'FILE_TOO_LARGE_FOR_EXTRACT'){

                    await ctx.api.sendMessage(ctx.chat!.id, i18n.messages.actions.extract.errors.extract_file_too_large, {parse_mode: 'HTML'});
                    await handler.logger.logAction('ExtractAction:extractText', ctx.from!, 'Extract text result', `File: ${originalName}`, 'Failed - file too large');

                }else if(e.message === 'OUTPUT_TOO_LARGE'){

                    await ctx.api.sendMessage(ctx.chat!.id, i18n.messages.actions.extract.errors.extract_output_too_large, {parse_mode: 'HTML'});
                    await handler.logger.logAction('ExtractAction:extractText', ctx.from!, 'Extract text result', `File: ${originalName}`, 'Failed - output too large');

                }else if(e.message === 'No extractable text found'){

                    await ctx.api.sendMessage(ctx.chat!.id, i18n.messages.actions.extract.errors.extract_no_text, {parse_mode: 'HTML'});
                    await handler.logger.logAction('ExtractAction:extractText', ctx.from!, 'Extract text result', `File: ${originalName}`, 'Failed - no text found');

                }else{

                    await handleWorkerTechnicalError(ctx, handler, 'ExtractText', originalName);
                    await handler.logger.logAction('ExtractAction:extractText', ctx.from!, 'Extract text result', `File: ${originalName} | Error: ${e.message}`, 'Failed');

                }

                await handler.fileService.deleteFile(filePath).catch(() => {});
                Object.assign(ctx.session, initialSession());

            }

        });

    }

    async extractImages(): Promise<void>{

        const { ctx, handler } = this;
        const i18n    = handler.getI18n();
        const isAdmin = handler.isAdmin(ctx);

        ctx.session.currentAction = 'extract';

        if(isDuplicateCall(ctx, handler)) return;

        const filePath      = ctx.session.filePaths[0];
        const originalName  = ctx.session.tempParams?.originalName || 'document.pdf';

        if(!filePath){

            await ctx.reply(i18n.errors.file_lost);
            ctx.session = initialSession();
            return;

        }

        const sizeBytes = fs.statSync(filePath).size;

        await sendPreActionInfo(
            ctx, handler,
            i18n.messages.actions.extract.rule_images,
            i18n.messages.actions.extract.availability,
        );

        await handler.logger.logAction('ExtractAction:extractImages', ctx.from!, 'Extract images started', `File: ${originalName}`);

        const statusMsg = await ctx.reply(i18n.messages.actions.extract.extracting_images, {parse_mode: 'HTML', reply_markup: handler.keyboards.getCancelOnlyMenu()});

        setImmediate(async () => {

            try{

                const zipPath = await handler.worker.extractImages(ctx, filePath, sizeBytes);

                await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});

                const safeName = FileNameUtils.getSafeName(originalName, '_images').replace(/\.pdf$/i, '.zip');
                const isPaidResult = await handler.isPaidUser(ctx);

                await ctx.replyWithDocument(new InputFile(zipPath, safeName), {
                    caption:      i18n.messages.actions.extract.success_extract_images,
                    parse_mode:   'HTML',
                    reply_markup: handler.keyboards.getFileActionsMenu([], isPaidResult),
                });

                await handler.logger.logAction('ExtractAction:extractImages', ctx.from!, 'Extract images result', `File: ${originalName}`, 'Success');

                await handler.db.logAction(ctx.from!.id, 'extract_images', 0);

                await sendTrafficUsedSummary(ctx, handler, 0);

                await handler.fileService.deleteFile(zipPath).catch(() => {});

            }catch(e: any){

                await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});

                if(e.message === 'PROCESSING_TIMEOUT'){

                    await handleProcessingTimeout(ctx, handler, 'ExtractImages', originalName);

                }else if(e.message === 'SERVER_BUSY'){

                    await handleServerBusy(ctx, handler, 'ExtractImages', originalName);

                }else if(e.message === 'USER_CANCELLED'){

                    await handleUserCancelled(ctx, handler, 'ExtractImages', originalName);

                }else if(e.message === 'FILE_TOO_LARGE_FOR_EXTRACT'){

                    await ctx.api.sendMessage(ctx.chat!.id, i18n.messages.actions.extract.errors.extract_file_too_large, {parse_mode: 'HTML'});
                    await handler.logger.logAction('ExtractAction:extractImages', ctx.from!, 'Extract images result', `File: ${originalName}`, 'Failed - file too large');

                }else if(e.message === 'SCANNED_PDF_NO_IMAGES'){

                    await ctx.api.sendMessage(ctx.chat!.id, i18n.messages.actions.extract.errors.extract_scanned_no_images, {parse_mode: 'HTML'});
                    await handler.logger.logAction('ExtractAction:extractImages', ctx.from!, 'Extract images result', `File: ${originalName}`, 'Failed - scanned PDF');

                }else if(e.message === 'No images found in this PDF'){

                    await ctx.api.sendMessage(ctx.chat!.id, i18n.messages.actions.extract.errors.extract_no_images, {parse_mode: 'HTML'});
                    await handler.logger.logAction('ExtractAction:extractImages', ctx.from!, 'Extract images result', `File: ${originalName}`, 'Failed - no images found');

                }else{

                    await handleWorkerTechnicalError(ctx, handler, 'ExtractImages', originalName);
                    await handler.logger.logAction('ExtractAction:extractImages', ctx.from!, 'Extract images result', `File: ${originalName} | Error: ${e.message}`, 'Failed');

                }

                await handler.fileService.deleteFile(filePath).catch(() => {});
                Object.assign(ctx.session, initialSession());

            }

        });

    }

    async askSearchQuery(): Promise<void>{

        const { ctx, handler } = this;
        const i18n = handler.getI18n();

        ctx.session.currentAction = 'extract';

        await sendPreActionInfo(
            ctx, handler,
            i18n.messages.actions.extract.rule_search,
            i18n.messages.actions.extract.availability,
        );

        await handler.logger.logAction('ExtractAction:askSearchQuery', ctx.from!, 'Search', 'Waiting for query');

        ctx.session.step = 'waiting_for_search_query';

        await ctx.reply(i18n.messages.actions.extract.ask_search_query, {
            parse_mode:   'HTML',
            reply_markup: handler.keyboards.getBackOnlyMenu(),
        });

    }

    async performSearch(query: string): Promise<void>{

        const { ctx, handler } = this;
        const i18n    = handler.getI18n();
        const isAdmin = handler.isAdmin(ctx);

        if(isDuplicateCall(ctx, handler)) return;

        if(!query || query.trim().length === 0){

            await ctx.reply(i18n.messages.actions.extract.errors.search_empty_query, {parse_mode: 'HTML', reply_markup: handler.keyboards.getBackOnlyMenu()});
            return;

        }

        const filePath      = ctx.session.filePaths[0];
        const originalName  = ctx.session.tempParams?.originalName || 'document.pdf';

        if(!filePath){

            await ctx.reply(i18n.errors.file_lost);
            ctx.session = initialSession();
            return;

        }

        const sizeBytes = fs.statSync(filePath).size;

        const maskedQuery = '*'.repeat(Math.min(query.trim().length, 30));

        await handler.logger.logAction('ExtractAction:performSearch', ctx.from!, `User searching: ${maskedQuery}`, `File: ${originalName}`);

        const statusMsg = await ctx.reply(i18n.messages.actions.extract.searching_text, {parse_mode: 'HTML', reply_markup: handler.keyboards.getCancelOnlyMenu()});

        setImmediate(async () => {

            try{

                const result = await handler.worker.searchText(ctx, filePath, query, sizeBytes);

                await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});

                const isPaidResult = await handler.isPaidUser(ctx);

                if(result.total === 0){

                    await ctx.api.sendMessage(ctx.chat!.id, i18n.messages.actions.extract.search_no_matches, {
                        parse_mode:   'HTML',
                        reply_markup: handler.keyboards.getFileActionsMenu([], isPaidResult),
                    });

                }else{

                    const plural = result.total === 1 ? '' : 'es';

                    let header = i18n.messages.actions.extract.search_results_header
                        .replace('{{total}}', String(result.total))
                        .replace('{{plural}}', plural);

                    if(result.truncated){

                        header += i18n.messages.actions.extract.search_truncated_note
                            .replace('{{shown}}', String(result.matches.length));

                    }

                    const lines = result.matches.map((m: string, i: number) => `${i + 1}. ${maskSensitiveAndEscape(m)}`);

                    const fullText = `${header}\n\n${lines.join('\n\n')}`;

                    for(const chunk of this.splitMessage(fullText, 4096)){

                        await ctx.api.sendMessage(ctx.chat!.id, chunk, {parse_mode: 'HTML'});

                    }

                    await ctx.api.sendMessage(ctx.chat!.id, i18n.messages.commands.start, {
                        reply_markup: handler.keyboards.getFileActionsMenu([], isPaidResult),
                    });

                }

                await handler.logger.logAction('ExtractAction:performSearch', ctx.from!, `Search: ${maskedQuery}`, `File: ${originalName} | Matches: ${result.total}`, 'Success');

                await handler.db.logAction(ctx.from!.id, 'search', 0);

                await sendTrafficUsedSummary(ctx, handler, 0);

            }catch(e: any){

                await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});

                if(e.message === 'PROCESSING_TIMEOUT'){

                    await handleProcessingTimeout(ctx, handler, 'SearchText', originalName);

                }else if(e.message === 'SERVER_BUSY'){

                    await handleServerBusy(ctx, handler, 'SearchText', originalName);

                }else if(e.message === 'USER_CANCELLED'){

                    await handleUserCancelled(ctx, handler, 'SearchText', originalName);

                }else if(e.message === 'FILE_TOO_LARGE_FOR_EXTRACT'){

                    await ctx.api.sendMessage(ctx.chat!.id, i18n.messages.actions.extract.errors.extract_file_too_large, {parse_mode: 'HTML'});
                    await handler.logger.logAction('ExtractAction:performSearch', ctx.from!, `Search: ${maskedQuery}`, `File: ${originalName}`, 'Failed - file too large');

                }else if(e.message === 'OUTPUT_TOO_LARGE'){

                    await ctx.api.sendMessage(ctx.chat!.id, i18n.messages.actions.extract.errors.extract_output_too_large, {parse_mode: 'HTML'});
                    await handler.logger.logAction('ExtractAction:performSearch', ctx.from!, `Search: ${maskedQuery}`, `File: ${originalName}`, 'Failed - output too large');

                }else{

                    await handleWorkerTechnicalError(ctx, handler, 'SearchText', originalName);
                    await handler.logger.logAction('ExtractAction:performSearch', ctx.from!, `Search: ${maskedQuery}`, `File: ${originalName} | Error: ${e.message}`, 'Failed');

                }

                Object.assign(ctx.session, initialSession());

            }

        });

    }

    async countWords(): Promise<void>{

        const { ctx, handler } = this;
        const i18n    = handler.getI18n();
        const isAdmin = handler.isAdmin(ctx);

        ctx.session.currentAction = 'extract';

        if(isDuplicateCall(ctx, handler)) return;

        const filePath      = ctx.session.filePaths[0];
        const originalName  = ctx.session.tempParams?.originalName || 'document.pdf';

        if(!filePath){

            await ctx.reply(i18n.errors.file_lost);
            ctx.session = initialSession();
            return;

        }

        const sizeBytes = fs.statSync(filePath).size;

        await sendPreActionInfo(
            ctx, handler,
            i18n.messages.actions.extract.rule_wordcount,
            i18n.messages.actions.extract.availability,
        );

        await handler.logger.logAction('ExtractAction:countWords', ctx.from!, 'Word count started', `File: ${originalName}`);

        const statusMsg = await ctx.reply(i18n.messages.actions.extract.counting_words, {parse_mode: 'HTML', reply_markup: handler.keyboards.getCancelOnlyMenu()});

        setImmediate(async () => {

            try{

                const result = await handler.worker.countWords(ctx, filePath, sizeBytes);

                await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});

                const isPaidResult = await handler.isPaidUser(ctx);

                const message = i18n.messages.actions.extract.word_count_result
                    .replace('{{words}}', result.words.toLocaleString())
                    .replace('{{chars}}', result.chars.toLocaleString())
                    .replace('{{lines}}', result.lines.toLocaleString());

                await ctx.api.sendMessage(ctx.chat!.id, message, {
                    parse_mode:   'HTML',
                    reply_markup: handler.keyboards.getFileActionsMenu([], isPaidResult),
                });

                await handler.logger.logAction('ExtractAction:countWords', ctx.from!, 'Word count result', `File: ${originalName} | Words: ${result.words}`, 'Success');

                await handler.db.logAction(ctx.from!.id, 'word_count', 0);

                await sendTrafficUsedSummary(ctx, handler, 0);

                await handler.fileService.deleteFile(filePath);

            }catch(e: any){

                await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});

                if(e.message === 'PROCESSING_TIMEOUT'){

                    await handleProcessingTimeout(ctx, handler, 'WordCount', originalName);

                }else if(e.message === 'SERVER_BUSY'){

                    await handleServerBusy(ctx, handler, 'WordCount', originalName);

                }else if(e.message === 'USER_CANCELLED'){

                    await handleUserCancelled(ctx, handler, 'WordCount', originalName);

                }else if(e.message === 'FILE_TOO_LARGE_FOR_EXTRACT'){

                    await ctx.api.sendMessage(ctx.chat!.id, i18n.messages.actions.extract.errors.extract_file_too_large, {parse_mode: 'HTML'});

                }else if(e.message === 'OUTPUT_TOO_LARGE'){

                    await ctx.api.sendMessage(ctx.chat!.id, i18n.messages.actions.extract.errors.extract_output_too_large, {parse_mode: 'HTML'});

                }else if(e.message === 'No extractable text found'){

                    await ctx.api.sendMessage(ctx.chat!.id, i18n.messages.actions.extract.errors.extract_no_text, {parse_mode: 'HTML'});

                }else{

                    await handleWorkerTechnicalError(ctx, handler, 'WordCount', originalName);

                }

                await handler.fileService.deleteFile(filePath);
                Object.assign(ctx.session, initialSession());

            }

        });

    }

    private splitMessage(text: string, maxLen: number): string[]{

        const chunks: string[] = [];
        let remaining = text;

        while(remaining.length > maxLen){

            let cut = remaining.lastIndexOf('\n\n', maxLen);
            if(cut <= 0) cut = maxLen;

            chunks.push(remaining.slice(0, cut));
            remaining = remaining.slice(cut);

        }

        if(remaining.length > 0) chunks.push(remaining);

        return chunks;

    }

}
