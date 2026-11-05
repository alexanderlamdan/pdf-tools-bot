import https  from 'https';
import crypto from 'crypto';
import type { IPaymentProvider, ICheckoutParams, ICheckoutResult, IPaymentEvent } from '../../interfaces/IPaymentProvider.js';

export class DodoService implements IPaymentProvider{
    
    constructor(private readonly apiKey:string,private readonly secret:string,private readonly testMode:boolean = false){}
    
    private get apiBase():string{
        
        return this.testMode ? 'https://test.dodopayments.com' : 'https://live.dodopayments.com';
        
    }
    
    async createCheckout(params:ICheckoutParams):Promise<ICheckoutResult>{
        
        const body = JSON.stringify({
            
            product_cart:[{product_id:params.productId, quantity:1}],
            return_url:params.successUrl,
            ...(params.userEmail ? {customer:{email:params.userEmail}} : {}),
            metadata:{
                
                telegram_user_id:String(params.userId),
                bot_lang:params.botLang
                
            }
            
        });
        
        const data = await this.request('POST','/checkouts',body);
        return{
            
            checkoutUrl:data.checkout_url,
            checkoutId:data.session_id ?? data.checkout_id ?? data.id ?? ''
            
        };
        
    }
    
    verifyWebhook(rawBody:string,signature:string,extra?:{webhookId?:string,timestamp?:string}):boolean{
        
        if(!extra?.webhookId || !extra?.timestamp) return false;
        
        const signedContent = `${extra.webhookId}.${extra.timestamp}.${rawBody}`;
        
        const secretVariants:Buffer[] = [];
        if(this.secret.startsWith('whsec_')){
            
            try{ secretVariants.push(Buffer.from(this.secret.slice(6),'base64')); }catch{}
            
        }
        secretVariants.push(Buffer.from(this.secret));
        
        const providedSigs = signature
            .split(' ')
            .map(part => part.includes(',') ? part.split(',')[1] : part)
            .filter(Boolean);
        
        for(const secretBuf of secretVariants){
            
            const computed = crypto.createHmac('sha256',secretBuf).update(signedContent).digest('base64');
            
            for(const provided of providedSigs){
                
                try{
                    
                    const a = Buffer.from(computed);
                    const b = Buffer.from(provided);
                    if(a.length === b.length && crypto.timingSafeEqual(a,b)) return true;
                    
                }catch{}
                
            }
            
        }
        
        return false;
        
    }
    
    parseEvent(rawBody:string):IPaymentEvent | null{
        
        try{
            
            const event = JSON.parse(rawBody);
            const eventType = event.type ?? event.eventType as string;
            const metadata = event.metadata ?? event.object?.metadata ?? {};
            
            const telegramUserId = Number(metadata?.telegram_user_id);
            if(!telegramUserId || isNaN(telegramUserId)) return null;
            
            const typeMap:Record<string,IPaymentEvent['type']> = {
                
                'checkout.completed':    'checkout.completed',
                'subscription.active':   'subscription.paid',
                'subscription.paid':     'subscription.paid',
                'subscription.canceled': 'subscription.expired',
                'subscription.expired':  'subscription.expired',
                'subscription.past_due': 'subscription.past_due',
                
            };
            
            const type = typeMap[eventType];
            if(!type) return null;
            
            return{
                
                type,
                telegramUserId,
                productId:event.product_id ?? event.object?.product_id ?? '',
                orderId:event.order_id ?? event.object?.id ?? '',
                subscriptionId:event.subscription_id ?? undefined,
                customerEmail:event.customer?.email ?? undefined,
                amount:event.amount ?? 0,
                currency:event.currency ?? 'USD'
                
            };
            
        }catch{
            return null;
        }
        
    }
    
    private request(method:string,path:string,body?:string):Promise<any>{
        
        return new Promise((resolve,reject)=>{
            
            const urlObj = new URL(`${this.apiBase}${path}`);
            const headers:Record<string,string|number>={
                
                'Authorization':`Bearer ${this.apiKey}`,
                'Content-Type':'application/json'
                
            };
            
            if(body) headers['Content-Length'] = Buffer.byteLength(body);
            
            const req = https.request({
                hostname:urlObj.hostname,
                port:443,
                path:urlObj.pathname,
                method,
                headers
            },(res)=>{
                let raw = '';
                res.on('data',chunk=>raw += chunk);
                res.on('end',()=>{
                    
                    try{
                        
                        const data = JSON.parse(raw);
                        if(res.statusCode && res.statusCode >= 400){
                            
                            reject(new Error(`Dodo ${res.statusCode}: ${JSON.stringify(data)}`));
                            
                        }else{
                            
                            resolve(data);
                            
                        }
                        
                    }catch{
                        
                        reject(new Error(`Dodo invalid JSON: ${raw.slice(0,200)}`));
                        
                    }
                    
                });
            });
            
            req.setTimeout(15_000,()=>{req.destroy();reject(new Error('Dodo timeout'))});
            req.on('error',reject);
            if(body)req.write(body);
            req.end();
            
        });
        
    }
    
}
