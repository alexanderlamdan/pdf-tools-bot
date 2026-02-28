import type {BotContext} from '../types/BotContext.js';
import type {LocalizationService} from '../services/LocalizationService.js';
import type {Keyboards} from '../services/Keyboards.js';
import type {LoggerService} from '../services/LoggerService.js';
import {initialSession} from '../types/SessionData.js';

export async function notifyTrafficAfterResult(ctx:BotContext,lang:string,localization:LocalizationService,keyboards:Keyboards,logger:LoggerService):Promise<void>{
    
    const params = ctx.session.tempParams as any;
    const i18n = localization.get(lang);
    
    if(params?.willExceedLimit === 'true'){
        
        await logger.logAction(
            'TrafficNotifier',
            ctx.from!,
            'Limit reached after file delivery',
            'Showing subscription offer'
        );
        
    }
    
}
