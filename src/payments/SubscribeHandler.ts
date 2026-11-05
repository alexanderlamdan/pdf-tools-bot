import { InlineKeyboard }           from 'grammy';
import type { BotContext }          from '../types/BotContext.js';
import type { IBotConfig }          from '../config/interfaces/IBotConfig.js';
import type {IPaymentProvider} from './interfaces/IPaymentProvider.js';
import type { LocalizationService } from '../services/LocalizationService.js';
import { LoggerService }            from '../services/LoggerService.js';
import { DatabaseService }          from '../services/DatabaseService.js';
import { CreemService }             from './providers/creem/CreemService.js';
import {DodoService} from './providers/dodo/DodoService.js';
import { SUBSCRIPTION_PLANS,getProductId }       from '../utils/SubscriptionPlans.js';
import type {ProviderName} from '../utils/SubscriptionPlans.js';
import { isProviderReady, getProviderForCurrency} from '../utils/CurrencyProvideMap.js';

export class SubscribeHandler {

    private readonly logger: LoggerService;
    private readonly db: DatabaseService;

    private readonly providers: Partial<Record<ProviderName, IPaymentProvider>> = {};

    constructor(
        private readonly config:       IBotConfig,
        private readonly localization: LocalizationService,
    ) {
        this.logger = new LoggerService(config);
        this.db     = new DatabaseService(this.logger);

        if(config.creemApiKey && config.creemWebhookSecret){

            this.providers.creem = new CreemService(config.creemApiKey,config.creemWebhookSecret,config.creemTestMode ?? false);

        }

        if(config.dodoApiKey && config.dodoWebhookSecret){

            this.providers.dodo = new DodoService(config.dodoApiKey,config.dodoWebhookSecret,config.dodoTestMode ?? false);

        }
    }

    private needsCurrencyPicker(): boolean {

        return this.config.enableCurrencyPicker === true;

    }

    private getCurrencyList(): readonly string[] {

        return this.config.availableCurrencies ?? [];

    }

    async handlePlanPeriods(ctx: BotContext, plan: string): Promise<void> {

        await ctx.answerCallbackQuery();

        const i18n     = this.localization.get();
        const planData = SUBSCRIPTION_PLANS[plan];
        const planText = (i18n.messages.subscriptions_desc.plans as any)[plan] as string;
        const subs     = i18n.messages.user.buttons.subscription;

        if (!planText || !planData) {
            await ctx.reply(i18n.errors.plan_not_available as string);
            return;
        }

        if(this.needsCurrencyPicker()){

            const user = await this.db.getUser(ctx.from!.id);

            if(!user?.preferredCurrency){

                ctx.session.pendingSubscribePlan = plan;
                await this.showCurrencyPicker(ctx);
                return;

            }

        }

        const providerName = await this.resolveProviderName(ctx);

        if(!providerName){

            await ctx.reply(i18n.errors.payments_not_available as string);
            return;

        }

        if(!isProviderReady(providerName)){

            await ctx.reply((i18n.messages.subscriptions as any).currency_coming_soon as string ?? '⏳ This payment method is coming soon — I\'ll let you know when it\'s ready.');
            return;

        }

        const kb = new InlineKeyboard();
        for(const [periodKey,period] of Object.entries(planData.periods)){

            const productId = getProductId(plan,periodKey,providerName);
            if(period.available && productId){

                kb.text(period.label,`subscribe:${plan}:${periodKey}`).row();

            }

        }

        kb.text(subs.back,'sub_info_back').row();

        await ctx.reply(planText, { parse_mode: 'HTML', reply_markup: kb });

    }

    async showCurrencyPicker(ctx: BotContext): Promise<void> {

        const i18n = this.localization.get();
        const sc   = i18n.messages.subscriptions as any;

        const kb = new InlineKeyboard();
        for(const code of this.getCurrencyList()){

            const label = (sc.currency_labels as any)?.[code] ?? code;
            kb.text(label, `set_currency:${code}`).row();

        }

        await ctx.reply(sc.currency_ask as string ?? 'Which currency works best for you?', {
            parse_mode:   'HTML',
            reply_markup: kb,
        });

    }

    async handleCurrencySelected(ctx: BotContext, currency: string): Promise<void> {

        await ctx.answerCallbackQuery();

        await this.db.setPreferredCurrency(ctx.from!.id, currency);

        const pendingPlan = ctx.session.pendingSubscribePlan;
        ctx.session.pendingSubscribePlan = undefined;

        if(pendingPlan){

            await this.handlePlanPeriods(ctx, pendingPlan);
            return;

        }

        const i18n = this.localization.get();
        await ctx.reply((i18n.messages.subscriptions as any).currency_saved as string ?? '✅ Saved. Open 👤 My Account to subscribe.');

    }

    private async resolveProviderName(ctx: BotContext): Promise<ProviderName | null> {

        if(!this.needsCurrencyPicker()){

            if(this.providers.creem) return 'creem';
            if(this.providers.dodo)  return 'dodo';
            return null;

        }

        const user = await this.db.getUser(ctx.from!.id);
        if(!user?.preferredCurrency) return null;

        return getProviderForCurrency(user.preferredCurrency, Object.keys(this.providers) as ProviderName[]);

    }

    async handleSubscribeCallback(ctx: BotContext, plan: string, period: string): Promise<void> {

        await ctx.answerCallbackQuery();

        const i18n       = this.localization.get();
        const sc         = i18n.messages.subscriptions as any;
        const subs       = i18n.messages.user.buttons.subscription;
        const planData   = SUBSCRIPTION_PLANS[plan];
        const periodData = planData?.periods[period];

        if (!periodData?.available) {
            await ctx.reply(i18n.errors.period_not_available as string);
            return;
        }

        const providerName = await this.resolveProviderName(ctx);
        const provider = providerName ? this.providers[providerName] : undefined;

        if(!provider || !providerName || !isProviderReady(providerName)){

            await ctx.reply(sc.subscribe_checkout_error as string);
            return;

        }

        const productId = getProductId(plan,period,providerName);
        if(!productId){

            await ctx.reply(i18n.errors.current_payment_not_available as string);
            return;
        }

        const userId    = ctx.from!.id;
        const statusMsg = await ctx.reply(sc.subscribe_checkout_loading as string);

        try {

            const result = await provider.createCheckout({
                productId,
                userId,
                successUrl: `https://t.me/${ctx.me.username}`,
                botLang:    this.config.forceLang,
            });

            await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});

            const kb = new InlineKeyboard()
                .url(
                    subs.buy.replace('{{name}}', periodData.label),
                    result.checkoutUrl,
                );

            await ctx.reply(sc.subscribe_checkout_ready as string, {
                parse_mode:   'HTML',
                reply_markup: kb,
            });

            await this.logger.logAction(
                'SubscribeHandler', ctx.from!,
                'Checkout created',
                `Provider: ${providerName} | Plan: ${plan} | Period: ${period} | Product: ${productId}`,
            );

        } catch (e: any) {

            await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
            console.error('[SubscribeHandler] Checkout error:', e.message);
            await ctx.reply(sc.subscribe_checkout_error as string);

        }

    }

}
