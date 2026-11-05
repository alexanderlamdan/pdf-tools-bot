import {Context} from 'grammy';
import type {BotContext} from '../types/BotContext.js';

export class AntiSpamService{

    constructor(){}

    public async check(ctx:BotContext):Promise<boolean>{

        const now = Date.now();
        const lastTime = ctx.session.lastRequestTime || 0;
        const timeDiff = now - lastTime;

        if(ctx.callbackQuery){

            ctx.session.lastRequestTime = now;
            return true;

        }

        if(ctx.message?.text){
            ctx.session.lastRequestTime = now;
            return true;
        }

        const bulkSteps = [
            'waiting_for_merge_bulk',
            'waiting_for_merge_files',
            'waiting_for_long_image_bulk',
            'waiting_for_long_image_files',
        ];
        if(ctx.message?.document && bulkSteps.includes(ctx.session.step)){
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
