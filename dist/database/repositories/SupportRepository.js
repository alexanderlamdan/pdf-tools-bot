import { BaseRepository } from './BaseRepository.js';
import { Postgresql } from '../Postgresql.js';
const TTL_MS = 14 * 24 * 60 * 60 * 1000;
export class SupportRepository extends BaseRepository {
    msgRepo;
    constructor() {
        super('support_sessions');
        this.msgRepo = new class extends BaseRepository {
            constructor() { super('support_messages'); }
        }();
    }
    async createSession(data) {
        const now = Date.now();
        return this.create({
            ...data,
            status: 'open',
            createdAt: now,
            updatedAt: now
        });
    }
    async getOpenSession(userId) {
        const cutoff = Date.now() - TTL_MS;
        const res = await this.query(`SELECT * FROM support_sessions WHERE user_id = $1 AND status='open' AND created_at > $2 ORDER BY created_at DESC LIMIT 1`, [userId, cutoff]);
        return this.normalize(res)[0];
    }
    async getActiveSessions() {
        const cutoff = Date.now() - TTL_MS;
        const res = await this.query(`SELECT * FROM support_sessions WHERE status = 'open' AND created_at >$1 ORDER BY created_at DESC`, [cutoff]);
        return this.normalize(res);
    }
    async closeSession(sessionId) {
        await this.update({ id: sessionId }, { status: 'closed', updatedAt: Date.now() });
    }
    async closeSessionByUser(userId) {
        await this.query(`UPDATE support_sessions SET status = 'closed', updated_at = $1 WHERE user_id = $2 AND status = 'open'`, [Date.now(), userId]);
    }
    async findSessionByUserIdentifier(identifier) {
        const cutoff = Date.now() - TTL_MS;
        const byUsername = await this.query(`SELECT * FROM support_sessions WHERE username = $1 AND status='open' AND created_at > $2 ORDER BY created_at  DESC LIMIT 1`, [identifier.replace('@', ''), cutoff]);
        if (byUsername.length > 0)
            return this.normalize(byUsername)[0];
        const numId = Number(identifier);
        if (!isNaN(numId)) {
            const byId = await this.query(`SELECT * FROM support_sessions WHERE user_id = $1 AND status = 'open' AND created_at > $2 ORDER BY created_at DESC LIMIT 1`, [numId, cutoff]);
            if (byId.length > 0)
                return this.normalize(byId)[0];
        }
        return undefined;
    }
    async saveMessage(sessionId, userId, adminMsgId) {
        await this.msgRepo.create({
            sessionId,
            userId,
            adminMsgId,
            createdAt: Date.now()
        });
    }
    async findUserByAdminMsg(adminMsgId) {
        const res = await this.query(`SELECT user_id, session_id FROM support_messages WHERE admin_msg_id = $1 LIMIT 1`, [adminMsgId]);
        if (!res.length)
            return undefined;
        return {
            userId: Number(res[0].user_id),
            sessionId: Number(res[0].session_id)
        };
    }
}
