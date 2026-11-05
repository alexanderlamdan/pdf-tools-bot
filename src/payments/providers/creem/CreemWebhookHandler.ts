import type { Request, Response }    from 'express';
import type { IBotConfig }           from '../../../config/interfaces/IBotConfig.js';
import type { LocalizationService }  from '../../../services/LocalizationService.js';
import { CreemService }              from './CreemService.js';
import { BaseWebhookHandler }        from '../../BaseWebhookHandler.js';

export class CreemWebhookHandler extends BaseWebhookHandler{
    
    private readonly creem:CreemService;
    
    constructor(config:IBotConfig,localization:LocalizationService){
        
        super(config,localization);
        this.creem = new CreemService(
            config.creemApiKey!,
            config.creemWebhookSecret!,
            config.creemTestMode ?? false
        );
        
    }
    
    async handle(req:Request,res:Response):Promise<void>{
        
        const rawBody = (req as any).rawBody as string;
        const signature = req.headers['creem-signature'] as string;
        
        if(!rawBody || !signature){
            
            res.status(400).json({ok:false,error:'Missing body or signature'});
            return;
            
        }
        
        if(!this.creem.verifyWebhook(rawBody,signature)){
            
            console.warn('[CreemWebhook] Invalid signature - rejected');
            res.status(401).json({ok:false,error:'Invalid signature'});
            return;
            
        }
        
        const event = this.creem.parseEvent(rawBody);
        
        if(!event){
            
            const raw = JSON.parse(rawBody);
            console.log(`[CreemWebhook] Skipped event: ${raw.eventType}`);
            res.status(200).json({ok:true});
            return;
            
        }
        
        console.log(`[CreemWebhook] Received: ${event.type} | user: ${event.telegramUserId}`);
        
        res.status(200).json({ok:true});
        
        setImmediate(async ()=>{
            
            try{
                
                await this.processEvent(event);
                
            }catch(e:any){
                
                console.error(`[CreemWebhook] Error: `,e.message);
                
            }
            
        })
        
    }
    
}
