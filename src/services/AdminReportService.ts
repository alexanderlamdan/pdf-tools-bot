import fs   from 'fs';
import path from 'path';
import os   from 'os';
import { Postgresql }      from '../database/Postgresql.js';
import { InputFile }       from 'grammy';
import type { Api }        from 'grammy';
import type { RawApi }     from 'grammy';
import type { IBotConfig } from '../config/interfaces/IBotConfig.js';
import { SUBSCRIPTION_LIMITS, GIGABYTE } from '../utils/SubscriptionUtils.js';
import { formatDate, formatDateTime, getTimezone } from '../utils/LocalizedTime.js';

const MB = 1024 * 1024;

export class AdminReportService {

    private readonly db = Postgresql.getInstance();

    constructor(
        private readonly config: IBotConfig,
        private readonly api:    Api<RawApi>,
    ) {}

    private getUserLimit(user: any): number {
        if (user.is_vip) return Infinity;
        return SUBSCRIPTION_LIMITS[user.sub_type] ?? SUBSCRIPTION_LIMITS['free'];
    }

    private getUserPct(user: any): number {
        const limit = this.getUserLimit(user);
        if (limit === Infinity) return 0;
        return Math.min(100, Math.round(Number(user.monthly_traffic || 0) / limit * 100));
    }

    public async sendFullReport(): Promise<void> {

        const ts = formatDateTime(Date.now(), this.config.forceLang);

        const [users, actionStats, totalTraffic] = await Promise.all([
            this.getAllUsers(),
            this.db.query(`SELECT action_type, COUNT(*) as count FROM activity_logs GROUP BY action_type ORDER BY count DESC`),
            this.db.query(`SELECT SUM(monthly_traffic) as total FROM users WHERE id != $1`, [this.config.adminId]),
        ]);

        const total     = users.length;
        const active24h = users.filter(u => Number(u.last_active_at || 0) > Date.now() - 24 * 60 * 60 * 1000).length;
        const trafficGB = (Number(totalTraffic[0]?.total || 0) / GIGABYTE).toFixed(2);
        const subCounts = this.calcSubCounts(users);
        const segments  = this.calcTrafficSegments(users);

        const top10 = await this.db.query(`
            SELECT u.id, u.username, u.first_name, u.last_active_at, u.joined_at,
                   u.monthly_traffic, u.sub_type, u.is_vip,
                   COUNT(l.id) as actions_count
            FROM users u
            LEFT JOIN activity_logs l ON l.user_id = u.id AND l.created_at > $1
            WHERE u.id != $2
            GROUP BY u.id
            ORDER BY actions_count DESC
            LIMIT 10
        `, [Date.now() - 7 * 24 * 60 * 60 * 1000, this.config.adminId]);

        const actionsText = actionStats.map((r: any) =>
            `  • ${r.action_type}: <b>${r.count}</b>`
        ).join('\n');

        const top10Text = top10.map((u: any, i: number) => {
            const name       = u.username ? `@${u.username}` : (u.first_name || `ID:${u.id}`);
            const lastSeen   = this.fmtDate(u.last_active_at);
            const joined     = this.fmtDate(u.joined_at);
            const nextReset  = this.calcNextResetDate(u.joined_at);
            const usedMB     = (Number(u.monthly_traffic || 0) / MB).toFixed(0);
            const pct        = this.getUserPct(u);
            const plan       = u.is_vip ? 'VIP' : (u.sub_type || 'free');
            return (
                `${i + 1}. ${name} (ID: <code>${u.id}</code>)\n` +
                `   📅 Joined: ${joined} | Last: ${lastSeen}\n` +
                `   ♻️ Next reset: ${nextReset}\n` +
                `   💾 ${usedMB}MB (${pct}%) | ${plan} | actions: ${u.actions_count}`
            );
        }).join('\n\n');

        const report =
            `📊 <b>ADMIN REPORT — ${this.config.botName.toUpperCase()}</b>\n` +
            `🕐 ${ts} (${getTimezone(this.config.forceLang)})\n\n` +
            `👥 <b>Users:</b> ${total} total | 🟢 ${active24h} active (24h)\n\n` +
            `💎 <b>Subscriptions:</b>\n` +
            `  VIP: ${subCounts.vip} | Starter: ${subCounts.starter} | Pro: ${subCounts.pro} | Ultra: ${subCounts.ultra}\n\n` +
            `📈 <b>Global activity:</b>\n${actionsText}\n\n` +
            `💾 <b>Total traffic:</b> ${trafficGB} GB\n\n` +
            `📊 <b>Traffic usage (относительно лимита КАЖДОГО плана):</b>\n` +
            `  🔴 >80% used:  ${segments.critical} users\n` +
            `  🟡 50–80%:     ${segments.warning} users\n` +
            `  🟢 &lt;50%:    ${segments.normal} users\n` +
            `  ⚫ Not used:   ${segments.unused} users\n\n` +
            `🏆 <b>Top 10 (last 7 days):</b>\n\n${top10Text}`;

        await this.api.sendMessage(this.config.channelLogId, report, { parse_mode: 'HTML' });

        const csvPath = await this.generateCsv(users);
        try {
            await this.api.sendDocument(
                this.config.channelLogId,
                new InputFile(csvPath, `users_${new Date().toISOString().slice(0, 10)}.csv`),
                { caption: `📋 Full user list — ${total} users | ${ts} UTC` }
            );
        } finally {
            fs.unlink(csvPath, () => {});
        }

    }

    public async sendUserDetails(targetId: number): Promise<void> {

        const ts = formatDateTime(Date.now(), this.config.forceLang);

        const [userRows, stats] = await Promise.all([
            this.db.query(`SELECT id, username, first_name, lang_code, is_vip, sub_type, monthly_traffic, joined_at, last_active_at FROM users WHERE id = $1`, [targetId]),
            this.db.query(
                `SELECT action_type, COUNT(*) as count FROM activity_logs WHERE user_id = $1 GROUP BY action_type ORDER BY count DESC`,
                [targetId]
            ),
        ]);

        if (!userRows.length) {
            await this.api.sendMessage(
                this.config.channelLogId,
                `❌ User <code>${targetId}</code> not found.`,
                { parse_mode: 'HTML' }
            );
            return;
        }

        const u        = userRows[0];
        const name     = u.username ? `@${u.username}` : (u.first_name || '').trim();
        const joined   = u.joined_at
            ? formatDate(Number(u.joined_at), this.config.forceLang)
            : 'unknown';
        const lastSeen = u.last_active_at
            ? formatDateTime(Number(u.last_active_at), this.config.forceLang)
            : 'never';
        const lastReset = u.last_reset_at ? this.fmtDate(u.last_reset_at) : 'never';
        const nextReset = this.calcNextResetDate(u.joined_at);
        const usedMB    = (Number(u.monthly_traffic || 0) / MB).toFixed(2);
        const pct       = this.getUserPct(u);
        const plan      = u.is_vip ? 'VIP' : (u.sub_type || 'free');

        const limitBytes = this.getUserLimit(u);
        const limitStr   = limitBytes === Infinity ? '∞' : `${(limitBytes / MB).toFixed(0)} MB`;

        const statsText = stats.length
            ? stats.map((s: any) => `  • ${s.action_type}: <b>${s.count}</b>`).join('\n')
            : '  No activity';

        const bar = this.trafficBar(pct);

        const msg =
                        `👤 <b>USER DETAILS</b>\n` +
            `🕐 ${ts} (${getTimezone(this.config.forceLang)})\n\n` +
            `🆔 ID: <code>${u.id}</code>\n` +
            `👤 Name: ${name}\n` +
            `🌐 Lang: ${u.lang_code || 'unknown'}\n` +
            `💎 Plan: ${plan}\n\n` +
            `📅 <b>Dates:</b>\n` +
            `  Joined:      ${joined}\n` +
            `  Last seen:   ${lastSeen}\n` +
            `  Last reset:  ${lastReset}\n` +
            `  Next reset:  ${nextReset}\n\n` +
            `💾 <b>Traffic this month:</b>\n` +
            `${bar} ${usedMB} MB / ${limitStr} (${pct}%)\n\n` +
            `📈 <b>All-time activity:</b>\n${statsText}`;

        await this.api.sendMessage(this.config.channelLogId, msg, { parse_mode: 'HTML' });

    }

    private async getAllUsers(): Promise<any[]> {
        return this.db.query(`
            SELECT id, username, first_name, lang_code,
                   is_vip, sub_type, monthly_traffic, joined_at, last_active_at
            FROM users WHERE id != $1
            ORDER BY joined_at DESC
        `, [this.config.adminId]);
    }

    private calcSubCounts(users: any[]): Record<string, number> {
        return {
            vip:     users.filter(u => u.is_vip).length,
            starter: users.filter(u => !u.is_vip && u.sub_type === 'starter').length,
            pro:     users.filter(u => !u.is_vip && u.sub_type === 'pro').length,
            ultra:   users.filter(u => !u.is_vip && u.sub_type === 'ultra').length,
        };
    }

    private calcTrafficSegments(users: any[]): Record<string, number> {
        let critical = 0, warning = 0, normal = 0, unused = 0;
        for (const u of users) {
            const traffic = Number(u.monthly_traffic || 0);
            const limit   = this.getUserLimit(u);
            if (traffic === 0) { unused++; continue; }
            if (limit === Infinity) { normal++; continue; }
            const pct = traffic / limit;
            if (pct >= 0.8)      critical++;
            else if (pct >= 0.5) warning++;
            else                 normal++;
        }
        return { critical, warning, normal, unused };
    }

    private trafficBar(pct: number): string {
        const filled = Math.round(pct / 10);
        return '█'.repeat(filled) + '░'.repeat(10 - filled);
    }

    private calcNextResetDate(joinedAt: number | string): string {

        if (!joinedAt) return '-';

        const joinedAtNum = Number(joinedAt);
        if (isNaN(joinedAtNum)) return '-';

        const joinDay = new Date(joinedAtNum).getUTCDate();
        const now = new Date();
        const nowDay = now.getUTCDate();

        let resetYear = now.getUTCFullYear();
        let resetMonth = now.getUTCMonth();

        if (nowDay >= joinDay) {

            resetMonth += 1;
            if (resetMonth > 11) { resetMonth = 0; resetYear += 1; }

        }

        const resetDate = new Date(Date.UTC(resetYear, resetMonth, joinDay));
        return formatDate(resetDate.getTime(), this.config.forceLang);

    }

    private fmtDate(ts:number | null):string{

        if(!ts) return '-';

        return formatDate(Number(ts), this.config.forceLang);

    }

    private fmtDateTime(ts: number | null): string {
        if (!ts) return '—';
        return formatDateTime(Number(ts), this.config.forceLang);
    }

    private async generateCsv(users: any[]): Promise<string> {
         const header = 'ID,Username,FirstName,Lang,Plan,TrafficMB,TrafficPct,JoinedAt,LastSeenAt,LastResetAt,NextResetAt\n';
        const rows   = users.map(u => {
            const usedMB    = (Number(u.monthly_traffic || 0) / MB).toFixed(2);
            const pct       = this.getUserPct(u);
            const plan      = u.is_vip ? 'VIP' : (u.sub_type || 'free');
            const joined    = u.joined_at      ? new Date(Number(u.joined_at)).toISOString().slice(0, 10)      : '';
            const lastSeen  = u.last_active_at ? new Date(Number(u.last_active_at)).toISOString().slice(0, 10) : '';
            const lastReset = u.last_reset_at  ? new Date(Number(u.last_reset_at)).toISOString().slice(0, 10)  : '';
            const nextReset = this.calcNextResetDate(u.joined_at);

            return [
                u.id,
                u.username  || '',
                u.first_name || '',
                u.lang_code || '',
                plan,
                usedMB,
                pct + '%',
                joined,
                lastSeen,
                lastReset,
                nextReset,
            ].join(',');
        });
        const csv     = header + rows.join('\n');
        const tmpFile = path.join(os.tmpdir(), `users_${Date.now()}.csv`);
        fs.writeFileSync(tmpFile, csv, 'utf-8');
        return tmpFile;
    }

}
