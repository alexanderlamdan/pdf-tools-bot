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
        await this.query(`UPDATE users SET monthly_traffic = COALESCE(monthly_traffic,0) + $1 WHERE id=$2`, [bytes, userId]);
    }
    async countActive(minutes) {
        const time = Date.now() - minutes * 60 * 1000;
        const res = await this.query(`SELECT COUNT(*) as c FROM users WHERE last_active_at > $1`, [time]);
        return Number(res[0].c);
    }
    async findIdsByLanguage(lang) {
        const res = await this.query(`SELECT id, FROM users WHERE lang_code = $1`, [lang]);
        return res.map((row) => Number(row.id));
    }
    async setVipStatus(userId, status) {
        await this.update({ id: userId }, { is_vip: status });
    }
}
