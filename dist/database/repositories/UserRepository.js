import { BaseRepository } from './BaseRepository.js';
export class UserRepository extends BaseRepository {
    constructor() {
        super('users');
    }
    async findByUsername(username) {
        return this.findOne({ username });
    }
    async findVIPs() {
        return this.findAll({ is_vip: true });
    }
    async incrementTraffic(userId, bytes) {
        await this.query(`UPDATE users SET monthlyTraffic = COALESCE(monthlyTraffic,0) + $1 WHERE id=$2`, [bytes, userId]);
    }
    async countActive(minutes) {
        const time = Date.now() - minutes * 60 * 1000;
        const res = await this.query(`SELECT COUNT(*) as c FROM users WHERE lastActiveAt > $1`, [time]);
        return Number(res[0].c);
    }
}
