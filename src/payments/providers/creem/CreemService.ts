import https  from 'https';
import crypto from 'crypto';
import type { IPaymentProvider, ICheckoutParams, ICheckoutResult, IPaymentEvent } from '../../interfaces/IPaymentProvider.js';

export class CreemService implements IPaymentProvider{

    constructor(
        private readonly apiKey:    string,
        private readonly secret:    string,
        private readonly testMode:  boolean = false,
    ){}

    private get apiBase(): string{
        return this.testMode ? 'https://test-api.creem.io' : 'https://api.creem.io';
    }

    async createCheckout(params: ICheckoutParams): Promise<ICheckoutResult>{

        const body = JSON.stringify({
            product_id:  params.productId,
            success_url: params.successUrl,
            ...(params.userEmail ? { customer: { email: params.userEmail } } : {}),
            metadata:{
                telegram_user_id: String(params.userId),
                bot_lang:         params.botLang,
            },
        });

        const data = await this.request('POST', '/v1/checkouts', body);

        return{
            checkoutUrl: data.checkout_url,
            checkoutId:  data.checkout_id,
        };

    }

    verifyWebhook(rawBody: string, signature: string): boolean{
        
        const computed = crypto.createHmac('sha256', this.secret).update(rawBody).digest('hex');
        return computed === signature;
    }

    parseEvent(rawBody: string): IPaymentEvent | null{

        try{

            const event    = JSON.parse(rawBody);
            const eventType = event.eventType as string;
            const obj      = event.object;
            const metadata = obj?.metadata || obj?.customer?.metadata || event.metadata || {};
            const order    = obj?.order;
            const customer = obj?.customer;

            const telegramUserId = Number(metadata?.telegram_user_id);
            if(!telegramUserId || isNaN(telegramUserId)) return null;

            const typeMap: Record<string, IPaymentEvent['type']> = {
                'checkout.completed':    'checkout.completed',
                'subscription.active':   'subscription.paid',
                'subscription.paid':     'subscription.paid',
                'subscription.canceled': 'subscription.expired',
                'subscription.expired':  'subscription.expired',
                'subscription.past_due': 'subscription.past_due',
            };

            const type = typeMap[eventType];
            if(!type) return null;

            const productId =
                order?.product_id   ||  
                order?.product      ||  
                obj?.product_id     ||
                obj?.product?.id    || 
                obj?.product        ||  
                '';

            const subscriptionId =
                obj?.subscription?.id   ||
                order?.subscription_id  ||
                undefined;

            const amount =
                order?.amount_paid  ||
                order?.amount       ||
                order?.total_amount ||
                0;

            return{
                type,
                telegramUserId,
                productId:      String(productId),
                orderId:        order?.id   || obj?.id   || '',
                customerId:     customer?.id                 ?? undefined,
                subscriptionId: subscriptionId               ?? undefined,
                customerEmail:  customer?.email              ?? undefined,
                amount,
                currency:       order?.currency || 'USD',
            };

        }catch{
            return null;
        }

    }

    private request(method: string, path: string, body?: string): Promise<any>{

        return new Promise((resolve, reject) => {

            const urlObj  = new URL(`${this.apiBase}${path}`);
            const headers: Record<string, string | number> = {
                'x-api-key':      this.apiKey,
                'Content-Type':   'application/json',
            };

            if(body) headers['Content-Length'] = Buffer.byteLength(body);

            const req = https.request({
                hostname: urlObj.hostname,
                port:     443,
                path:     urlObj.pathname,
                method,
                headers,
            }, (res) => {
                let raw = '';
                res.on('data', chunk => raw += chunk);
                res.on('end', () => {
                    try{
                        const data = JSON.parse(raw);
                        if(res.statusCode && res.statusCode >= 400){
                            reject(new Error(`Creem ${res.statusCode}: ${JSON.stringify(data)}`));
                        }else{
                            resolve(data);
                        }
                    }catch{
                        reject(new Error(`Creem invalid JSON: ${raw.slice(0, 200)}`));
                    }
                });
            });

            req.setTimeout(15_000, () => { req.destroy(); reject(new Error('Creem timeout')); });
            req.on('error', reject);
            if(body) req.write(body);
            req.end();

        });

    }

}
