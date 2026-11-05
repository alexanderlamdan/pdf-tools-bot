import type { BotContext } from '../types/BotContext.js';

export function isDuplicateCall(ctx: BotContext, handler: any): boolean{

    return handler.worker.isUserBusy(ctx.from!.id);

}
