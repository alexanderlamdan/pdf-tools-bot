import { BaseRepository } from './BaseRepository.js';
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
export class FeedbackRepository extends BaseRepository {
    constructor() {
        super('feedbacks');
    }
    async getLastByUser(userId) {
        const res = await this.query(`SELECT * FROM feedbacks WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`, [userId]);
        return this.normalize(res)[0];
    }
    async canSubmit(userId) {
        const last = await this.getLastByUser(userId);
        if (!last)
            return { allowed: true, remainMs: 0 };
        const elapsed = Date.now() - last.createdAt;
        const remainMs = Math.max(0, COOLDOWN_MS - elapsed);
        return { allowed: remainMs === 0, remainMs };
    }
    async submit(data) {
        return this.create({
            ...data,
            createdAt: Date.now()
        });
    }
}
