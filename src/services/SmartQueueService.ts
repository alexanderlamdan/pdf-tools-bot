import type { Api } from 'grammy';
import type { RawApi } from 'grammy';
import type { BotContext } from '../types/BotContext.js';
import { LocalizationService } from './LocalizationService.js';
import { DatabaseService } from './DatabaseService.js';

export type TaskWeight = 'light' | 'medium' | 'heavy' | 'exclusive';
export type UserRole = 'free' | 'pro' | 'premium' | 'enterprise' | 'sovereign_protocol' | 'vip';

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
    private readonly MAX_CONCURRENT_HEAVY       = 2;
    private static instance:        SmartQueueService;
    private compressActive:         boolean     = false;
    private api:                    Api<RawApi> | null = null;

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

    public calculateWeight(action: string, sizeBytes: number): TaskWeight {

        const sizeMB = sizeBytes / 1024 / 1024;

        if (['info', 'encrypt', 'decrypt'].includes(action)) return 'light';
        if (action === 'crack') return 'heavy';

        if (sizeMB < 15)                    return 'light';
        if (sizeMB >= 15 && sizeMB <= 50)   return 'medium';

        return 'heavy';

    }

    private getBasePriority(role: UserRole): number {

        switch (role) {
            case 'vip':               return 100;
            case 'sovereign_protocol':return 90;
            case 'enterprise':        return 80;
            case 'premium':           return 60;
            case 'pro':               return 40;
            case 'free':              return 10;
            default:                  return 10;
        }

    }

    private async notifyQueueAboutCompress(): Promise<void> {

        if (!this.api) return;

        const waitingTasks = this.queue.filter(t =>
            t.weight === 'heavy' || t.weight === 'medium'
        );

        if (waitingTasks.length === 0) return;

        const i18n = this.localization.get(this.localization.getDefaultLang());

        for (const task of waitingTasks) {

            try {

                await this.api.sendMessage(
                    task.chatId,
                    i18n.messages.queue.compress_active_warning,
                    { parse_mode: 'HTML' }
                );

            } catch {
                
            }

        }

    }

    public async enqueue<T>(ctx: BotContext, action: string, sizeBytes: number, taskFn: () => Promise<T>): Promise<T> {

        const userId = ctx.from!.id;
        const chatId = ctx.chat!.id;
        const user   = await this.db.getUser(userId);
        const lang   = this.localization.getUserLanguage(ctx.from?.language_code).lang;
        const i18n   = this.localization.get(lang);

        let role: UserRole = user?.subType as UserRole || 'free';
        if (user?.isVip) role = 'vip';

        const weight = this.calculateWeight(action, sizeBytes);

        if (role === 'vip') {

            const abuseStatus = await this.handleVipAbuse(ctx, userId, lang);

            if (abuseStatus === 'blocked') {
                throw new Error('VIP_BLOCKED');
            } else if (abuseStatus === 'warned') {
                role = 'free';
            }

        }

        if (weight === 'light') return taskFn();

        // Средние для топ-ролей — без очереди если compress не активен
        if (weight === 'medium' &&
            (role === 'enterprise' || role === 'sovereign_protocol' || role === 'vip') &&
            !this.compressActive
        ) {
            return taskFn();
        }

        if (this.compressActive && weight !== 'exclusive') {
            await ctx.reply(i18n.messages.queue.compress_active_warning, { parse_mode: 'HTML' });
        }

        if (weight === 'heavy') {
            await ctx.reply(i18n.messages.queue.heavy_task_warning, { parse_mode: 'HTML' });
        }

        if (weight === 'exclusive') {
            await ctx.reply(i18n.messages.queue.compress_exclusive_start, { parse_mode: 'HTML' });
        }

        return new Promise<T>((resolve, reject) => {

            const task: QueueTask = {
                id:            Math.random().toString(36).substring(2, 9),
                userId,
                chatId,
                role,
                weight,
                execute:       taskFn,
                resolve,
                reject,
                addedAt:       Date.now(),
                priorityScore: weight === 'exclusive' ? 999 : this.getBasePriority(role),
            };

            this.queue.push(task);
            this.queue.sort((a, b) => b.priorityScore - a.priorityScore);

            const position = this.queue.findIndex(t => t.id === task.id) + 1;

            if (weight !== 'exclusive') {
                const positionText = i18n.messages.queue.position.replace('{{position}}', position.toString());
                ctx.reply(positionText, { parse_mode: 'HTML' }).catch(() => {});
            }

            this.processQueue();

        });

    }
    
    private processQueue(): void {

        if (this.queue.length === 0) return;

        const nextTask = this.queue[0];

        if (nextTask.weight === 'exclusive') {

            if (this.activeHeavyTasks > 0) return;

            this.queue.shift();
            this.compressActive   = true;
            this.activeHeavyTasks += 2;

            this.notifyQueueAboutCompress().catch(() => {});

            nextTask.execute()
                .then(res  => nextTask.resolve(res))
                .catch(err => nextTask.reject(err))
                .finally(() => {
                    this.activeHeavyTasks -= 2;
                    this.compressActive    = false;
                    this.processQueue();
                });

            return;

        }

        if (this.compressActive) return;
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

    private async handleVipAbuse(ctx: BotContext, userId: number, lang: string): Promise<'ok' | 'warned' | 'blocked'> {

        const i18n = this.localization.get(lang);
        const now  = Date.now();

        if (!this.vipActivity.has(userId)) {
            this.vipActivity.set(userId, { timestamps: [], warned: false, blocked: false, blockedUntil: 0 });
        }

        const tracker = this.vipActivity.get(userId)!;

        if (tracker.blockedUntil > now) {

            const minutesLeft = Math.ceil((tracker.blockedUntil - now) / 1000 / 60);

            if (now % 60000 < 5000) {
                await ctx.reply(`${i18n.messages.queue.vip_message_notice} ${minutesLeft}`, { parse_mode: 'HTML' }).catch(() => {});
            }

            return 'blocked';

        } else if (tracker.blockedUntil > 0 && tracker.blockedUntil <= now) {

            tracker.blockedUntil = 0;
            tracker.warned       = false;
            tracker.timestamps   = [];
            await ctx.reply(i18n.messages.queue.vip_unblock_notice).catch(() => {});

        }

        tracker.timestamps = tracker.timestamps.filter(t => now - t < 5 * 60 * 1000);
        tracker.timestamps.push(now);

        if (tracker.blocked) return 'blocked';

        const count = tracker.timestamps.length;

        if (count >= 5 && !tracker.warned) {
            tracker.warned = true;
            await ctx.reply(i18n.messages.queue.vip_warning, { parse_mode: 'HTML' });
            return 'warned';
        }

        if (count >= 8) {
            const BLOCK_DURATION  = 15 * 60 * 1000;
            tracker.blockedUntil  = now + BLOCK_DURATION;
            await ctx.reply(i18n.messages.queue.vip_blocked, { parse_mode: 'HTML', reply_markup: { remove_keyboard: true } });
            return 'blocked';
        }

        return tracker.warned ? 'warned' : 'ok';

    }

}
