import { initialSession } from '../types/SessionData.js';
export async function notifyTrafficAfterResult(ctx, lang, localization, keyboards, logger) {
    const params = ctx.session.tempParams;
    const i18n = localization.get(lang);
    if (params?.willExceedLimit === 'true') {
        await logger.logAction('TrafficNotifier', ctx.from, 'Limit reached after file delivery', 'Showing subscription offer');
        await ctx.reply(i18n.messages.subscription.done_but_exceeded, {
            parse_mode: 'HTML',
            reply_markup: keyboards.getSubscriptionMenu(lang)
        });
        ctx.session.tempParams = {
            ...ctx.session.tempParams,
            willExceedLimit: undefined
        };
        ctx.session.currentAction = 'idle';
        ctx.session.step = 'idle';
        return;
    }
    if (params?.trafficWarning) {
        const remainMB = params.trafficWarning;
        await logger.logAction('TrafficNotifier', ctx.from, 'Traffic warning shown', `Remaining: ${remainMB}`);
        await ctx.reply(i18n.messages.subscription.traffic_warning.replace('{{remain}}', remainMB), {
            parse_mode: 'HTML'
        });
        ctx.session.tempParams = {
            ...ctx.session.tempParams,
            trafficWarning: undefined
        };
        return;
    }
}
