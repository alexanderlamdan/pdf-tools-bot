import type { BotContext } from '../types/BotContext.js';

export async function handleProcessingTimeout(
    ctx:      BotContext,
    handler:  any,
    action:   string,
    fileName: string,
): Promise<void>{

    const i18n = handler.getI18n();

    await handler.logger.logAction(
        `${action}:timeout`,
        ctx.from!,
        'Processing killed — exceeded 20 minutes',
        `File: ${fileName}`,
    );

    await ctx.api.sendMessage(ctx.chat!.id, i18n.errors.processing_timeout, {parse_mode: 'HTML'});

}

export async function handleServerBusy(
    ctx:      BotContext,
    handler:  any,
    action:   string,
    fileName: string,
): Promise<void>{

    const i18n = handler.getI18n();

    await handler.logger.logAction(
        `${action}:server_busy`,
        ctx.from!,
        'Rejected — insufficient memory headroom after 5min wait',
        `File: ${fileName}`,
    );

    await ctx.api.sendMessage(ctx.chat!.id, i18n.errors.server_busy, {parse_mode: 'HTML'});

}

export async function handleDuplicateCall(
    ctx:      BotContext,
    handler:  any,
    action:   string,
): Promise<void>{

    await handler.logger.logAction(
        `${action}:duplicate`,
        ctx.from!,
        'Ignored — duplicate webhook delivery of same action',
        '',
    );

}

export async function handleUserCancelled(
    ctx:      BotContext,
    handler:  any,
    action:   string,
    fileName: string,
): Promise<void>{

    await handler.logger.logAction(
        `${action}:cancelled`,
        ctx.from!,
        'Killed by user via Cancel confirmation — no message sent, already handled',
        `File: ${fileName}`,
    );

}

export async function handleWorkerTechnicalError(
    ctx:      BotContext,
    handler:  any,
    action:   string,
    fileName: string,
): Promise<void>{

    const i18n = handler.getI18n();

    await handler.logger.logAction(
        `${action}:error`,
        ctx.from!,
        'Worker technical error (details in worker log file)',
        `File: ${fileName}`,
    );

    await ctx.api.sendMessage(ctx.chat!.id, i18n.errors.worker_technical_error, {parse_mode: 'HTML'});

}

export async function handlePageOutOfRange(
    ctx:      BotContext,
    handler:  any,
    action:   string,
    fileName: string,
    rawError: string,
): Promise<void>{

    const i18n  = handler.getI18n();
    const parts = rawError.split('|');
    const page  = parts[1] || '?';
    const total = parts[2] || '?';

    await handler.logger.logAction(
        `${action}:page_out_of_range`,
        ctx.from!,
        'Rejected — requested page out of range',
        `File: ${fileName} | Page: ${page} | Total: ${total}`,
    );

    const message = i18n.errors.page_out_of_range
        .replace('{{page}}', page)
        .replace('{{total}}', total);

    await ctx.api.sendMessage(ctx.chat!.id, message, {parse_mode: 'HTML'});

}
