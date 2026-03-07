import { Context } from 'grammy';
export class AntiSpamService {
    constructor() { }
    async check(ctx) {
        const now = Date.now();
        const lastTime = ctx.session.lastRequestTime || 0;
        const timeDiff = now - lastTime;
        if (ctx.callbackQuery) {
            ctx.session.lastRequestTime = now;
            return true;
        }
        const waitingSteps = [
            'waiting_for_password',
            'waiting_for_split_pages',
            'waiting_for_merge_confirm',
            'waiting_for_merge_files',
            'waiting_for_merge_bulk',
            'waiting_for_merge_archive',
        ];
        if (waitingSteps.includes(ctx.session.step)) {
            ctx.session.lastRequestTime = now;
            return true;
        }
        if (timeDiff < 1500) {
            return false;
        }
        ctx.session.lastRequestTime = now;
        return true;
    }
}
