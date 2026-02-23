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
        const res = await this.query(`SELECT id FROM users WHERE lang_code = $1`, [lang]);
        return res.map((row) => Number(row.id));
    }
    async setVipStatus(userId, status) {
        await this.update({ id: userId }, { is_vip: status });
    }
    async getTotalTrafficExcludingAdmin(adminId) {
        const res = await this.query(`SELECT SUM(monthly_traffic) as total FROM users WHERE id != $1`, [adminId]);
        return Number(res[0]?.total || 0);
    }
    async setVipStatusWithExpiry(userId, expiresAtMs) {
        await this.update({ id: userId }, {
            isVip: true,
            subType: 'vip',
            subPeriod: 'yearly',
            subExpiresAt: expiresAtMs,
            monthlyTraffic: 0
        });
    }
    async getZeroTrafficVips() {
        return this.findAll({ isVip: true, monthly_traffic: 0 });
    }
    async getExpiredVips(nowMs) {
        const res = await this.query(`SELECT * FROM users WHERE is_vip = true AND sub_expires_at > 0 AND sub_expires_at < $1`, [nowMs]);
        return this.normalize(res);
    }
    async getExpiringSubscriptions(startMs, endMs) {
        const res = await this.query(`SELECT * FROM users WHERE sub_type != 'free' AND is_vip = false AND sub_expires_at BETWEEN 1$ AND $2`, [startMs, endMs]);
        return this.normalize(res);
    }
    async getExpiredSubscriptions(nowMs) {
        const res = await this.query(`SELECT * FROM users WHERE sub_type != 'free' AND is_vip = false AND sub_expires_at > 0 AND sub_expires_at < $1`, [nowMs]);
        return this.normalize(res);
    }
    async downgradeToFree(userId) {
        await this.update({ id: userId }, {
            subType: 'free',
            isVip: false,
            subExpiresAt: 0,
            monthlyTraffic: 0
        });
    }
}
