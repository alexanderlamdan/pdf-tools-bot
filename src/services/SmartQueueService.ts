import type { Api } from 'grammy';
import type { RawApi } from 'grammy';
import type { BotContext } from '../types/BotContext.js';
import { LocalizationService } from './LocalizationService.js';
import { DatabaseService } from './DatabaseService.js';
import { PLAN_QUEUE_PRIORITY } from '../utils/SubscriptionPlans.js';

export type TaskWeight = 'light' | 'medium' | 'heavy' | 'exclusive';
export type UserRole = 'free' | 'starter' | 'pro' | 'ultra' | 'business' | 'vip';

interface QueueTask {

    id:            string;
    userId:        number;
    chatId:        number;
    role:          UserRole;
    weight:        TaskWeight;
    execute:       () => Promise<any>;
    resolve:       (val: any) => void;
    reject:        (err: any) => void;
    addedAt:       number;
    priorityScore: number;

}

const VIP_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
const VIP_ACTIVITY_TTL_MS     = 30 * 60 * 1000;

export class SmartQueueService {

    private queue:                  QueueTask[] = [];
    private activeHeavyTasks:       number      = 0;
    private readonly MAX_CONCURRENT_HEAVY       = 4;
    private static instance:        SmartQueueService;
    private api:                    Api<RawApi> | null = null;

    private activeUsers = new Set<number>();

    private vipActivity = new Map<number, {
        timestamps:  number[];
        warned:      boolean;
        blocked:     boolean;
        blockedUntil:number;
    }>();

    constructor(
        private readonly localization: LocalizationService,
        private readonly db:           DatabaseService,
    ) {

        setInterval(() => this.cleanVipActivity(), VIP_CLEANUP_INTERVAL_MS);

    }

    public static getInstance(localization: LocalizationService, db: DatabaseService): SmartQueueService {

        if (!SmartQueueService.instance) {
            SmartQueueService.instance = new SmartQueueService(localization, db);
        }

        return SmartQueueService.instance;

    }

    public setApi(api: Api<RawApi>): void {
        this.api = api;
    }

    public isUserBusy(userId: number): boolean {
        return this.activeUsers.has(userId);
    }

    public cancelUser(userId: number): boolean {

        const idx = this.queue.findIndex(t => t.userId === userId);

        if (idx === -1) return false;

        const [task] = this.queue.splice(idx, 1);
        task.reject(new Error('USER_CANCELLED'));

        return true;

    }

    public calculateWeight(action: string, sizeBytes: number): TaskWeight {

        const sizeMB = sizeBytes / 1024 / 1024;

        if (['info', 'encrypt', 'decrypt'].includes(action)) return 'light';

        if (sizeMB < 15)                    return 'light';
        if (sizeMB >= 15 && sizeMB <= 50)   return 'medium';

        return 'heavy';

    }

    private getBasePriority(role: UserRole): number {

        switch (role) {
            case 'vip':     return 100;
            case 'business': return 90;
            case 'ultra':   return 70;
            case 'pro':     return 60;
            case 'starter': return 50;
            case 'free':    return 10;
            default:        return 10;
        }

    }

    public async enqueue<T>(ctx: BotContext, action: string, sizeBytes: number, taskFn: () => Promise<T>): Promise<T> {

        const userId = ctx.from!.id;
        const chatId = ctx.chat!.id;
        const i18n   = this.localization.get();

        if(this.activeUsers.has(userId)){
            
            throw new Error('DUPLICATE_CALL');
        }

        this.activeUsers.add(userId);
        let released = false;
        const release = () => {
            if(!released){
                released = true;
                this.activeUsers.delete(userId);
            }
        };

        try{

            const user = await this.db.getUser(userId);

            let role: UserRole = user?.subType as UserRole || 'free';
            if (user?.isVip) role = 'vip';

            const weight = this.calculateWeight(action, sizeBytes);

            if (role === 'vip') {

                const abuseStatus = await this.handleVipAbuse(ctx, userId);

                if (abuseStatus === 'blocked') {
                    release();
                    throw new Error('VIP_BLOCKED');
                } else if (abuseStatus === 'warned') {
                    role = 'free';
                }

            }

            if (weight === 'light') {
                try{
                    return await taskFn();
                }finally{
                    release();
                }
            }

            if (weight === 'medium' && (role === 'ultra' || role === 'vip')) {
                try{
                    return await taskFn();
                }finally{
                    release();
                }
            }

            if (weight === 'heavy' || action === 'compress') {
                await ctx.reply(i18n.messages.actions.shared.heavy_task_warning, { parse_mode: 'HTML' });
            }

            return await new Promise<T>((resolve, reject) => {

                const effectiveWeight: TaskWeight = action === 'compress' ? 'heavy' : weight;

                const task: QueueTask = {
                    id:            Math.random().toString(36).substring(2, 9),
                    userId,
                    chatId,
                    role,
                    weight:        effectiveWeight,
                    execute:       taskFn,
                    resolve:       (val: any) => { release(); resolve(val); },
                    reject:        (err: any) => { release(); reject(err); },
                    addedAt:       Date.now(),
                    priorityScore: this.getBasePriority(role),
                };

                this.queue.push(task);
                this.queue.sort((a, b) => b.priorityScore - a.priorityScore);

                const position = this.queue.findIndex(t => t.id === task.id) + 1;

                const positionText = i18n.messages.actions.shared.position.replace('{{position}}', position.toString());
                ctx.reply(positionText, { parse_mode: 'HTML' }).catch(() => {});

                this.processQueue();

            });

        }catch(e){

            release();
            throw e;

        }

    }

    private processQueue(): void {

        if (this.queue.length === 0) return;
        if (this.activeHeavyTasks >= this.MAX_CONCURRENT_HEAVY) return;

        const task = this.queue.shift();
        if (!task) return;

        this.activeHeavyTasks++;

        task.execute()
            .then(res  => task.resolve(res))
            .catch(err => task.reject(err))
            .finally(() => {
                this.activeHeavyTasks--;
                this.processQueue();
            });

    }

    private cleanVipActivity(): void {

        const cutoff = Date.now() - VIP_ACTIVITY_TTL_MS;

        for (const [userId, tracker] of this.vipActivity.entries()) {

            const hasRecentActivity = tracker.timestamps.some(t => t > cutoff);
            const isBlocked         = tracker.blockedUntil > Date.now();

            if (!hasRecentActivity && !isBlocked) {
                this.vipActivity.delete(userId);
            }

        }

    }

    private async handleVipAbuse(ctx: BotContext, userId: number): Promise<'ok' | 'warned' | 'blocked'> {

        const i18n = this.localization.get();
        const now  = Date.now();

        if (!this.vipActivity.has(userId)) {
            this.vipActivity.set(userId, { timestamps: [], warned: false, blocked: false, blockedUntil: 0 });
        }

        const tracker = this.vipActivity.get(userId)!;

        if (tracker.blockedUntil > now) {

            const minutesLeft = Math.ceil((tracker.blockedUntil - now) / 1000 / 60);

            if (now % 60000 < 5000) {
                await ctx.reply(`${i18n.messages.actions.shared.vip_message_notice} ${minutesLeft}`, { parse_mode: 'HTML' }).catch(() => {});
            }

            return 'blocked';

        } else if (tracker.blockedUntil > 0 && tracker.blockedUntil <= now) {

            tracker.blockedUntil = 0;
            tracker.warned       = false;
            tracker.timestamps   = [];
            await ctx.reply(i18n.messages.actions.shared.vip_unblock_notice).catch(() => {});

        }

        tracker.timestamps = tracker.timestamps.filter(t => now - t < 5 * 60 * 1000);
        tracker.timestamps.push(now);

        if (tracker.blocked) return 'blocked';

        const count = tracker.timestamps.length;

        if (count >= 5 && !tracker.warned) {
            tracker.warned = true;
            await ctx.reply(i18n.messages.actions.shared.vip_warning, { parse_mode: 'HTML' });
            return 'warned';
        }

        if (count >= 8) {
            const BLOCK_DURATION  = 15 * 60 * 1000;
            tracker.blockedUntil  = now + BLOCK_DURATION;
            await ctx.reply(i18n.messages.actions.shared.vip_blocked, { parse_mode: 'HTML', reply_markup: { remove_keyboard: true } });
            return 'blocked';
        }

        return tracker.warned ? 'warned' : 'ok';

    }

}
