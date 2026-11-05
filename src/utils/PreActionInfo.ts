import type { BotContext } from '../types/BotContext.js';
import { GIGABYTE, getUserLimit } from './SubscriptionUtils.js';
import { formatBytes, formatBytesPair } from './LocalizedUnits.js';

export async function sendPreActionInfo(
    ctx:          BotContext,
    handler:      any,
    rulesText:    string,
    availability: string,
    replyMarkup?: any,
): Promise<void>{

    try{

        const i18n = handler.getI18n();

        await ctx.reply(rulesText, { parse_mode: 'HTML' });

        await new Promise(resolve => setTimeout(resolve, 1500));

        const user  = await handler.db.getUser(ctx.from!.id);
        if(!user) return;

        const isVip = user?.isVip === 1;
        const plan  = isVip ? 'VIP' : (user?.subType || 'Free');

        const limitBytes = getUserLimit(user);
        const pair = limitBytes === Infinity
            ? { used: formatBytes(user?.totalTrafficBytes || 0, i18n.messages.actions.shared.units), limit: '∞' }
            : formatBytesPair(user?.totalTrafficBytes || 0, limitBytes, i18n.messages.actions.shared.units);

        const name     = (ctx.from?.first_name || '').trim() || '—';
        const username = ctx.from?.username || '—';

        const msg = i18n.messages.actions.shared.pre_action_info
            .replaceAll('{{name}}', name)
            .replaceAll('{{username}}', username)
            .replaceAll('{{id}}', String(ctx.from!.id))
            .replaceAll('{{plan}}', plan)
            .replaceAll('{{used}}', pair.used)
            .replaceAll('{{limit}}', pair.limit)
            .replaceAll('{{availability}}', availability)
            .replaceAll('{{supportEmail}}', handler.config?.supportEmail ?? 'support@lmdnbot.com');

        await ctx.reply(msg, { parse_mode: 'HTML', ...(replyMarkup ? { reply_markup: replyMarkup } : {}) });

    }catch(e:any){

        console.error(`[PreActionInfo] sendPreActionInfo failed (non-critical): ${e.message}`);

    }

}

export async function sendTrafficUsedSummary(
    ctx:        BotContext,
    handler:    any,
    sizeBytes:  number,
): Promise<void>{

    try{

        const i18n = handler.getI18n();

        const msg = sizeBytes > 0
            ? i18n.messages.actions.shared.traffic_used_summary
                .replaceAll('{{amount}}', formatBytes(sizeBytes, i18n.messages.actions.shared.units))
            : i18n.messages.actions.shared.free_action_note;

        await ctx.reply(msg, {
            parse_mode:   'HTML',
            reply_markup: {
                inline_keyboard: [[
                    { text: i18n.messages.actions.shared.btn_need_more, callback_data: 'buy_package_menu' },
                ]],
            },
        });

    }catch(e:any){

        console.error(`[PreActionInfo] sendTrafficUsedSummary failed (non-critical): ${e.message}`);

    }

}
