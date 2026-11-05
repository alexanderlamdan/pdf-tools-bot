import type { IBotConfig }          from '../config/interfaces/IBotConfig.js';
import type { LocalizationService } from '../services/LocalizationService.js';
import type { IPaymentEvent }       from './interfaces/IPaymentProvider.js';
import { Postgresql }               from '../database/Postgresql.js';
import { sendToUser }               from '../utils/TelegramSender.js';
import { SUBSCRIPTION_LIMITS, GIGABYTE } from '../utils/SubscriptionUtils.js';
import { PRODUCT_TO_PLAN, getPeriodDurationMs, SUBSCRIPTION_PLANS } from '../utils/SubscriptionPlans.js';
import type { ProviderName }        from '../utils/SubscriptionPlans.js';
import { PRODUCT_TO_PACKAGE }       from '../utils/TrafficPackagesConfig.js';
import { formatDate as localizedFormatDate } from '../utils/LocalizedTime.js';

export abstract class BaseWebhookHandler{
    
    constructor(private readonly config: IBotConfig,private readonly localization: LocalizationService){}
    
    private get providerName():ProviderName|null{
        
        if(this.config.creemApiKey && this.config.creemWebhookSecret) return 'creem';
        if(this.config.dodoApiKey && this.config.dodoWebhookSecret) return 'dodo';
        return null;
        
    }
    
    private findPlan(productId:string):{plan:string;period:string}|null{
        
        const provider = this.providerName;
        if(!provider) return null;
        
        const withPrefix = PRODUCT_TO_PLAN[`${provider}:${productId}`];
        if(withPrefix) return withPrefix;
        
        const direct = PRODUCT_TO_PLAN[productId];
        if(direct) return direct;
        
        return null;
        
    }
    
    private findPackage(productId:string){
        
        const provider = this.providerName;
        if(!provider) return null;
        
        return PRODUCT_TO_PACKAGE[`${provider}:${productId}`] ?? null;
        
    }
    
    protected async processEvent(event:IPaymentEvent):Promise<void>{
        
        switch (event.type) {
            case 'checkout.completed':    await this.onCheckoutCompleted(event); break;
            case 'subscription.paid':     await this.onSubscriptionPaid(event);  break;
            case 'subscription.expired':  await this.onSubscriptionExpired(event); break;
            case 'subscription.past_due': await this.onSubscriptionPastDue(event); break;
        }
        
    }
    
    private async onCheckoutCompleted(event:IPaymentEvent):Promise<void>{
        
        const pkg = this.findPackage(event.productId);
        
        if(pkg){
            
            await this.onPackagePurchased(event, pkg);
            return;
            
        }
        
        const product = this.findPlan(event.productId);
        
        if(!product){
            
            console.warn(`[PaymentWebhook] Unknown product_id: ${event.productId} (provider: ${this.providerName})`);
            return;
            
        }
        
        const {plan,period} = product;
        const db = Postgresql.getInstance();
        const now = Date.now();
        const expiresAt = now + getPeriodDurationMs(plan,period);
        
        const users = await db.query('SELECT id FROM users WHERE id = $1',[event.telegramUserId]);
        if(users.length === 0){
            
            console.warn(`[PaymentWebhook] User ${event.telegramUserId} not found in DB`);
            return;
            
        }
        
        await db.query('UPDATE users SET sub_type = $1, sub_period = $2, sub_expires_at = $3, sub_started_at = $4, creem_customer_id = $5, creem_subscription_id = $6, email = COALESCE($7,email), last_active_at = $4 WHERE id = $8',[plan,period,expiresAt,now,event.customerId ?? null,event.subscriptionId ?? null,event.customerEmail ?? null,event.telegramUserId]);
        
        await db.query(`INSERT INTO payments (user_id,creem_order_id,creem_customer_id,creem_subscription_id,product_id,plan,period,amount,currency,status,email,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'paid',$10,$11) ON CONFLICT (creem_order_id) DO NOTHING`,[event.telegramUserId,event.orderId,event.customerId ?? null,event.subscriptionId ?? null,event.productId,plan,period,event.amount,event.currency,event.customerEmail ?? null,now]);
        
        console.log(`[PaymentWebhook] ✅ ${plan}/${period} activated for user ${event.telegramUserId} via ${this.providerName}`);
        
        await this.notifyActivated(event.telegramUserId,plan,now,expiresAt);
        await this.sendStatusMessage(event.telegramUserId, plan, period, now, expiresAt);
    }
    
    private async onPackagePurchased(event:IPaymentEvent, pkg: {id:string; sizeBytes:number; priceCents:number; label:string}):Promise<void>{
        
        const db  = Postgresql.getInstance();
        const now = Date.now();
        
        const users = await db.query('SELECT id FROM users WHERE id = $1',[event.telegramUserId]);
        if(users.length === 0){
            
            console.warn(`[PaymentWebhook] User ${event.telegramUserId} not found in DB (package purchase)`);
            return;
            
        }
        
        await db.query(
            'INSERT INTO traffic_packages (user_id, label, size_bytes, used_bytes, price_cents, purchased_at) VALUES ($1, $2, $3, 0, $4, $5)',
            [event.telegramUserId, pkg.label, pkg.sizeBytes, pkg.priceCents, now],
        );
        
        console.log(`[PaymentWebhook] ✅ Package ${pkg.label} added for user ${event.telegramUserId} via ${this.providerName}`);
        
        const n   = this.localization.get().messages.packages_traffic as any;
        const gb  = (pkg.sizeBytes / GIGABYTE).toFixed(0);
        const usd = (pkg.priceCents / 100).toFixed(2);
        
        const msg = (n.package_purchased as string | undefined)
            ?.replace('{{gb}}', gb)
            ?.replace('{{price}}', usd)
            ?? `✅ Payment received — ${gb}GB added to your account.`;
        
        await sendToUser(this.config.token, event.telegramUserId, msg);
        
    }
    
    private async onSubscriptionPaid(event:IPaymentEvent):Promise<void>{
        
        const product = this.findPlan(event.productId);
        if(!product) return;
        
        const {plan,period} = product;
        const db = Postgresql.getInstance();
        const now = Date.now();
        const expiresAt = now + getPeriodDurationMs(plan,period);
        
        await db.query(`UPDATE users SET sub_type = $1, sub_expires_at = $2, last_active_at = $3 WHERE id = $4`,[plan,expiresAt,now,event.telegramUserId]);
        
        console.log(`[PaymentWebhook] ✅ Renewed ${plan} for user ${event.telegramUserId}`);
        
    }
    
    private async onSubscriptionExpired(event: IPaymentEvent): Promise<void> {
 
        const db  = Postgresql.getInstance();
        const now = Date.now();
 
        await db.query(`
            UPDATE users SET
                sub_type              = NULL,
                sub_period            = NULL,
                sub_expires_at        = 0,
                sub_started_at        = 0,
                creem_subscription_id = NULL,
                last_active_at        = $1
            WHERE id = $2
        `, [now, event.telegramUserId]);
 
        console.log(`[PaymentWebhook] ❌ Subscription expired for user ${event.telegramUserId}`);
 
        const n   = this.localization.get().messages.notifications as any;
        const msg = n.subscription_expired as string;
        if (msg) await sendToUser(this.config.token, event.telegramUserId, msg);
 
    }
    
    private async onSubscriptionPastDue(event: IPaymentEvent): Promise<void> {
 
        const n   = this.localization.get().messages.notifications as any;
        const msg = n.subscription_past_due as string;
        if (msg) await sendToUser(this.config.token, event.telegramUserId, msg);
 
    }
    
    private async notifyActivated(
        userId:    number,
        plan:      string,
        startedAt: number,
        expiresAt: number,
    ): Promise<void> {
        
        const i18n = this.localization.get();
        const n          = i18n.messages.notifications as any;
        const features   = ((i18n.messages.subscriptions_desc.subscription_features as any) as Record<string, string>)[plan] ?? '';
        const roleLabel = (i18n.messages.user.subscriptions as any)[`${plan}_role`] ?? plan;
        const startedStr = this.formatDate(startedAt);
        const expiresStr = this.formatDate(expiresAt);
 
        const msg = (n.subscription_activated as string)
            .replace('{{plan}}',     roleLabel)
            .replace('{{features}}', features)
            .replace('{{started}}',  startedStr)
            .replace('{{expires}}',  expiresStr);
 
        await sendToUser(this.config.token, userId, msg);
 
    }
    
    private async sendStatusMessage(userId:number,plan:string,period:string,startedAt:number,expiresAt:number):Promise<void>{
        
        try{
            
            const i18n = this.localization.get();
            const st = i18n.messages.user;
            const subs = st.subscriptions as any;
            const db = Postgresql.getInstance();
            
            const rows = await db.query(`SELECT first_name, monthly_traffic, joined_at FROM users WHERE id = $1`,[userId]);
            
            if(rows.length === 0) return;
            
            const user = rows[0];
            const limitBytes = SUBSCRIPTION_LIMITS[plan] ?? SUBSCRIPTION_LIMITS['free'];
            const usedMB = (Number(user.monthly_traffic || 0) / 1024 / 1024).toFixed(2);
            const limitGB = limitBytes === Infinity ? '∞' : (limitBytes / GIGABYTE).toFixed(0);
            const roleLabel = subs[`${plan}_role`] ?? plan;
            const periodLabel = SUBSCRIPTION_PLANS[plan]?.periods[period]?.label ?? period;
            
            const msg =
            (st.status.title as string) +
            `📛 <b>${st.status.name}:</b> ${user.first_name || '—'}\n` +
            `🏷 <b>${st.status.role}:</b> ${roleLabel}\n` +
            `📅 <b>${st.status.joined}:</b> ${this.formatDate(Number(user.joined_at))}\n` +
            `💾 <b>${st.status.usage}:</b>\n${usedMB} MB / ${limitGB} GB\n` +
            `📅 <b>${st.status.sub_started}:</b> ${this.formatDate(startedAt)}\n` +
            `📅 <b>${st.status.sub_expires}:</b> ${this.formatDate(expiresAt)}\n` +
            `💳 <b>${st.status.plan}:</b> ${roleLabel} (${periodLabel})`;

            
            await sendToUser(this.config.token,userId,msg);
            
        }catch(e:any){
            
            console.error(`[PaymentWebhook] sendStatusMessage failed: ${e.message}`);
            
        }
        
    }
    
    protected formatDate(ts: number): string {
        if (!ts) return '—';
        return localizedFormatDate(ts, this.localization.getLang());
    }
    
}
