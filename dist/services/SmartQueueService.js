import { LocalizationService } from './LocalizationService.js';
import { DatabaseService } from './DatabaseService.js';
export class SmartQueueService {
    localization;
    db;
    queue = [];
    activeHeavyTasks = 0;
    MAX_CONCURRENT_HEAVY = 2;
    static instance;
    compressActive = false;
    vipActivity = new Map();
    constructor(localization, db) {
        this.localization = localization;
        this.db = db;
    }
    static getInstance(localization, db) {
        if (!SmartQueueService.instance) {
            SmartQueueService.instance = new SmartQueueService(localization, db);
        }
        return SmartQueueService.instance;
    }
    calculateWeight(action, sizeBytes) {
        const sizeMB = sizeBytes / 1024 / 1024;
        if (['info', 'encrypt', 'decrypt'].includes(action))
            return 'light';
        if (action === 'crack')
            return 'heavy';
        if (sizeMB < 15)
            return 'light';
        if (sizeMB >= 15 && sizeMB <= 50)
            return 'medium';
        return 'heavy';
    }
    getBasePriority(role) {
        switch (role) {
            case 'vip': return 100;
            case 'sovereign_protocol': return 90;
            case 'enterprise': return 80;
            case 'premium': return 60;
            case 'pro': return 40;
            case 'free': return 10;
            default: return 10;
        }
    }
    async notifyQueueAboutCompress(lang) {
        const i18n = this.localization.get(lang);
        const waitingTasks = this.queue.filter(t => t.weight === 'heavy' || t.weight === 'medium');
        for (const task of waitingTasks) {
            try {
            }
            catch { }
        }
    }
    async enqueue(ctx, action, sizeBytes, taskFn) {
        const userId = ctx.from.id;
        const user = await this.db.getUser(userId);
        const lang = this.localization.getUserLanguage(ctx.from?.language_code).lang;
        const i18n = this.localization.get(lang);
        let role = user?.subType || 'free';
        if (user?.isVip)
            role = 'vip';
        const weight = this.calculateWeight(action, sizeBytes);
        if (role === 'vip') {
            const abuseStatus = await this.handleVipAbuse(ctx, userId, lang);
            if (abuseStatus === 'blocked') {
                throw new Error("VIP_BLOCKED");
            }
            else if (abuseStatus === 'warned') {
                role = 'free';
            }
        }
        if (weight === 'light') {
            return taskFn();
        }
        if (weight === 'medium' && (role === 'enterprise' || role === 'sovereign_protocol' || role === 'vip') && !this.compressActive) {
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
        return new Promise((resolve, reject) => {
            const task = {
                id: Math.random().toString(36).substr(2, 9),
                userId,
                role,
                weight,
                execute: taskFn,
                resolve,
                reject,
                addedAt: Date.now(),
                priorityScore: weight === 'exclusive' ? 999 : this.getBasePriority(role)
            };
            this.queue.push(task);
            this.queue.sort((a, b) => b.priorityScore - a.priorityScore);
            const position = this.queue.findIndex(t => t.id === task.id) + 1;
            if (weight !== 'exclusive') {
                const positionText = i18n.messages.queue.position.replace('{{position}}', position.toString());
                ctx.reply(positionText, { parse_mode: 'HTML' }).catch(() => { });
            }
            this.processQueue();
        });
    }
    processQueue() {
        if (this.queue.length === 0)
            return;
        const nextTask = this.queue[0];
        if (nextTask.weight === 'exclusive') {
            if (this.activeHeavyTasks > 0)
                return;
            this.queue.shift();
            this.compressActive = true;
            this.activeHeavyTasks += 2;
            nextTask.execute().then(res => nextTask.resolve(res)).catch(err => nextTask.reject(err)).finally(() => {
                this.activeHeavyTasks -= 2;
                this.compressActive = false;
                this.processQueue();
            });
            return;
        }
        if (this.compressActive)
            return;
        if (this.activeHeavyTasks >= this.MAX_CONCURRENT_HEAVY)
            return;
        const task = this.queue.shift();
        if (!task)
            return;
        this.activeHeavyTasks++;
        task.execute()
            .then(res => task.resolve(res))
            .catch(err => task.reject(err))
            .finally(() => {
            this.activeHeavyTasks--;
            this.processQueue();
        });
    }
    async handleVipAbuse(ctx, userId, lang) {
        const i18n = this.localization.get(lang);
        const now = Date.now();
        if (!this.vipActivity.has(userId)) {
            this.vipActivity.set(userId, { timestamps: [], warned: false, blocked: false, blockedUntil: 0 });
        }
        const tracker = this.vipActivity.get(userId);
        if (tracker.blockedUntil > now) {
            const minutesLeft = Math.ceil((tracker.blockedUntil - now) / 1000 / 60);
            if (now % 60000 < 5000) {
                await ctx.reply(`${i18n.messages.queue.vip_message_notice} ${minutesLeft}`, { parse_mode: 'HTML' }).catch(() => { });
            }
            return 'blocked';
        }
        else if (tracker.blockedUntil > 0 && tracker.blockedUntil <= now) {
            tracker.blockedUntil = 0;
            tracker.warned = false;
            tracker.timestamps = [];
            await ctx.reply(`${i18n.messages.queue.vip_unblock_notice}`);
        }
        tracker.timestamps = tracker.timestamps.filter(t => now - t < 5 * 60 * 1000);
        tracker.timestamps.push(now);
        if (tracker.blocked)
            return 'blocked';
        const count = tracker.timestamps.length;
        if (count >= 5 && !tracker.warned) {
            tracker.warned = true;
            await ctx.reply(i18n.messages.queue.vip_warning, { parse_mode: 'HTML' });
            return 'warned';
        }
        if (count >= 8) {
            const BLOCK_DURATION = 15 * 60 * 1000;
            tracker.blockedUntil = now + BLOCK_DURATION;
            await ctx.reply(i18n.messages.queue.vip_blocked, { parse_mode: 'HTML', reply_markup: { remove_keyboard: true } });
            return 'blocked';
        }
        return tracker.warned ? 'warned' : 'ok';
    }
}
