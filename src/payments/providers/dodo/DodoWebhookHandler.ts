import type { Request, Response }   from 'express';
import type { IBotConfig }          from '../../../config/interfaces/IBotConfig.js';
import type { LocalizationService } from '../../../services/LocalizationService.js';
import { DodoService }              from './DodoService.js';
import { BaseWebhookHandler }       from '../../BaseWebhookHandler.js';

export class DodoWebhookHandler extends BaseWebhookHandler{
    
    private readonly dodo:DodoService;
    
    constructor(config:IBotConfig,localization:LocalizationService){
        
        super(config,localization);
        this.dodo = new DodoService(
            config.dodoApiKey!,
            config.dodoWebhookSecret!,
            config.dodoTestMode ?? false
        );
        
    }
    
    async handle(req:Request,res:Response):Promise<void>{
        
        const rawBody = (req as any).rawBody as string;
        const signature = req.headers['dodo-signature'] as string ?? req.headers['webhook-signature'] as string;
        const webhookId = req.headers['webhook-id'] as string;
        const timestamp = req.headers['webhook-timestamp'] as string;
        
        if(!rawBody || !signature){
            
            res.status(400).json({ok:false,error:'Missing body or signature'});
            return;
            
        }
        
        if(!this.dodo.verifyWebhook(rawBody,signature,{webhookId,timestamp})){
            
            console.warn('[DodoWebhook] Invalid signature - rejected');
            res.status(401).json({ok:false,error:'Invalid signature'});
            return;
            
        }
        
        const event = this.dodo.parseEvent(rawBody);
        
        if(!event){
            
            const raw = JSON.parse(rawBody);
            console.log(`[DodoWebhook] Skipped event: ${raw.type ?? raw.eventType}`);
            res.status(200).json({ok:true});
            return;
            
        }
        
        console.log(`[DodoWebhook] Received: ${event.type} | user: ${event.telegramUserId}`);
        res.status(200).json({ok:true});
        
        setImmediate(async ()=>{
            
            try{
                
                await this.processEvent(event);
                
            }catch(e:any){
                
                console.error('[DodoWebhook] Error: ',e.message);
                
            }
            
        })
        
    }
    
}
