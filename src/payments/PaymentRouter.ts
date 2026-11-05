import type { IBotConfig }          from '../config/interfaces/IBotConfig.js';
import type { LocalizationService } from '../services/LocalizationService.js';
import { CreemWebhookHandler }      from './providers/creem/CreemWebhookHandler.js';
import {DodoWebhookHandler} from './providers/dodo/DodoWebhookHandler.js';

export class PaymentRouter{
    
    constructor(private readonly config:IBotConfig,private readonly localization:LocalizationService){}
    
    registerRoutes(app:any):void{
        
        let registered = 0;
        
        if(this.config.creemApiKey && this.config.creemWebhookSecret){
            
            const handler = new CreemWebhookHandler(this.config,this.localization);
            app.post('/payments/creem',(req:any,res:any)=>handler.handle(req,res));
            console.log('[PaymentRouter] Creem registered -> POST /payments/creem');
            registered++;
            
        }
        
        if(this.config.dodoApiKey && this.config.dodoWebhookSecret){
            
            const handler = new DodoWebhookHandler(this.config,this.localization);
            app.post('/payments/dodo',(req:any,res:any)=>handler.handle(req,res));
            console.log('[PaymentRouter] Dodo registered -> POST /payments/dodo');
            registered++;
            
        }
        
        if(registered === 0){
            
            console.log('[PaymentRouter] ℹ️  No payment provider configured — payments disabled');
            
        }
        
    }
    
}
