import { BaseRepository } from './BaseRepository.js';
export class LogRepository extends BaseRepository {
    constructor() {
        super('activity_logs');
    }
    async log(userId, action, size = 0) {
        await this.create({
            user_id: userId,
            action_type: action,
            file_size: size,
            created_at: Date.now()
        });
    }
    async getStatsByAction() {
        const res = await this.query(`SELECT action_type, COUNT(*) as count FROM activity_logs GROUP BY action_type`, []);
        const stats = {};
        res.forEach((r) => stats[r.action_type] = Number(r.count));
        return stats;
    }
    async getUserStats(userId) {
        const res = await this.query(`SELECT action_type, COUNT(*) as count FROM activity_logs WHERE user_id = $1 GROUP BY action_type`, [userId]);
        const stats = {};
        res.forEach((r) => stats[r.action_type] = Number(r.count));
        return stats;
    }
}
