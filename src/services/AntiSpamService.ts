import {Context} from 'grammy';
import type {BotContext} from '../types/BotContext.js';

export class AntiSpamService{
    
    constructor(){}
    
    public async check(ctx:BotContext):Promise<boolean>{
        
        const now = Date.now();
        const lastTime = ctx.session.lastRequestTime || 0;
        const timeDiff = now - lastTime;
        
        if(ctx.callbackQuery || ctx.session.step === 'waiting_for_password'){
            
            ctx.session.lastRequestTime = now;
            return true;
            
        }
        
        if(timeDiff < 1500){
            
            return false;
            
        }
        
        ctx.session.lastRequestTime = now;
        return true;
        
    }
    
}
