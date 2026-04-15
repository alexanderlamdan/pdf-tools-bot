import fs   from 'fs';
import path from 'path';
import os   from 'os';
import { Postgresql }      from '../database/Postgresql.js';
import { InputFile }       from 'grammy';
import type { Api }        from 'grammy';
import type { RawApi }     from 'grammy';
import type { IBotConfig } from '../config/interfaces/IBotConfig.js';

const GB         = 1024 * 1024 * 1024;
const MB         = 1024 * 1024;
const FREE_LIMIT = 2 * GB;

export class AdminReportService {

    private readonly db = Postgresql.getInstance();

    constructor(
        private readonly config: IBotConfig,
        private readonly api:    Api<RawApi>,
    ) {}

    public async sendFullReport(): Promise<void> {

        const ts = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' });

        const [users, actionStats, totalTraffic] = await Promise.all([
            this.getAllUsers(),
            this.db.query(`SELECT action_type, COUNT(*) as count FROM activity_logs GROUP BY action_type ORDER BY count DESC`),
            this.db.query(`SELECT SUM(monthly_traffic) as total FROM users WHERE id != $1`, [this.config.adminId]),
        ]);

        const total     = users.length;
        const active24h = users.filter(u => Number(u.last_active_at || 0) > Date.now() - 24 * 60 * 60 * 1000).length;
        const trafficGB = (Number(totalTraffic[0]?.total || 0) / GB).toFixed(2);
        const subCounts = this.calcSubCounts(users);
        const segments  = this.calcTrafficSegments(users);

        const top10 = await this.db.query(`
            SELECT u.id, u.username, u.first_name, u.last_active_at,
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
            const name     = u.username ? `@${u.username}` : (u.first_name || `ID:${u.id}`);
            const lastSeen = u.last_active_at
                ? new Date(Number(u.last_active_at)).toLocaleDateString('en-US', { timeZone: 'Asia/Jerusalem' })
                : 'never';
            const usedMB   = (Number(u.monthly_traffic || 0) / MB).toFixed(0);
            const pct      = Math.min(100, Math.round(Number(u.monthly_traffic || 0) / FREE_LIMIT * 100));
            const plan     = u.is_vip ? 'VIP' : (u.sub_type || 'free');
            return (
                `${i + 1}. ${name} (ID: <code>${u.id}</code>)\n` +
                `   Last: ${lastSeen} | ${usedMB}MB (${pct}%) | ${plan} | actions: ${u.actions_count}`
            );
        }).join('\n\n');

        const report =
            `📊 <b>ADMIN REPORT — ${this.config.botName.toUpperCase()}</b>\n` +
            `🕐 ${ts} IST\n\n` +
            `👥 <b>Users:</b> ${total} total | 🟢 ${active24h} active (24h)\n\n` +
            `💎 <b>Subscriptions:</b>\n` +
            `  VIP: ${subCounts.vip} | Pro: ${subCounts.pro} | Premium: ${subCounts.premium}\n` +
            `  Enterprise: ${subCounts.enterprise} | Sovereign: ${subCounts.sovereign}\n\n` +
            `📈 <b>Global activity:</b>\n${actionsText}\n\n` +
            `💾 <b>Total traffic:</b> ${trafficGB} GB\n\n` +
            `📊 <b>Traffic usage:</b>\n` +
            `  🔴 >80% used:  ${segments.critical} users\n` +
            `  🟡 50–80%:     ${segments.warning} users\n` +
            `  🟢 &lt;50%:    ${segments.normal} users\n` +
            `  ⚫ Not used:   ${segments.unused} users\n\n` +
            `🏆 <b>Top 10 (last 7 days):</b>\n\n${top10Text}`;

        await this.api.sendMessage(this.config.channelLogId, report, { parse_mode: 'HTML' });

        // CSV
        const csvPath = await this.generateCsv(users);
        try {
            await this.api.sendDocument(
                this.config.channelLogId,
                new InputFile(csvPath, `users_${new Date().toISOString().slice(0, 10)}.csv`),
                { caption: `📋 Full user list — ${total} users | ${ts} IST` }
            );
        } finally {
            fs.unlink(csvPath, () => {});
        }

    }

    public async sendUserDetails(targetId: number): Promise<void> {

        const ts = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' });

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

        const u       = userRows[0];
        const name    = u.username ? `@${u.username}` : (u.first_name || '').trim();
        const joined  = u.joined_at
            ? new Date(Number(u.joined_at)).toLocaleDateString('en-US', { timeZone: 'Asia/Jerusalem' })
            : 'unknown';
        const lastSeen = u.last_active_at
            ? new Date(Number(u.last_active_at)).toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' })
            : 'never';
        const usedMB  = (Number(u.monthly_traffic || 0) / MB).toFixed(2);
        const pct     = Math.min(100, Math.round(Number(u.monthly_traffic || 0) / FREE_LIMIT * 100));
        const plan    = u.is_vip ? 'VIP' : (u.sub_type || 'free');

        const statsText = stats.length
            ? stats.map((s: any) => `  • ${s.action_type}: <b>${s.count}</b>`).join('\n')
            : '  No activity';

        const bar = this.trafficBar(pct);

        const msg =
            `👤 <b>USER DETAILS</b>\n` +
            `🕐 ${ts} IST\n\n` +
            `🆔 ID: <code>${u.id}</code>\n` +
            `👤 Name: ${name}\n` +
            `🌐 Lang: ${u.lang_code || 'unknown'}\n` +
            `💎 Plan: ${plan}\n` +
            `📅 Joined: ${joined}\n` +
            `🕐 Last seen: ${lastSeen}\n\n` +
            `💾 <b>Traffic this month:</b>\n` +
            `${usedMB} MB / 2048 MB (${pct}%)\n\n` +
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
            vip:        users.filter(u => u.is_vip).length,
            pro:        users.filter(u => u.sub_type === 'pro').length,
            premium:    users.filter(u => u.sub_type === 'premium').length,
            enterprise: users.filter(u => u.sub_type === 'enterprise').length,
            sovereign:  users.filter(u => u.sub_type === 'sovereign_protocol').length,
        };
    }

    private calcTrafficSegments(users: any[]): Record<string, number> {
        let critical = 0, warning = 0, normal = 0, unused = 0;
        for (const u of users) {
            const traffic = Number(u.monthly_traffic || 0);
            const pct     = traffic / FREE_LIMIT;
            if (traffic === 0)   unused++;
            else if (pct >= 0.8) critical++;
            else if (pct >= 0.5) warning++;
            else                 normal++;
        }
        return { critical, warning, normal, unused };
    }

    private trafficBar(pct: number): string {
        const filled = Math.round(pct / 10);
        return '█'.repeat(filled) + '░'.repeat(10 - filled);
    }

    private async generateCsv(users: any[]): Promise<string> {
        const header = 'ID,Username,FirstName,Lang,Plan,TrafficMB,TrafficPct,JoinedAt,LastSeenAt\n';
        const rows   = users.map(u => {
            const usedMB   = (Number(u.monthly_traffic || 0) / MB).toFixed(2);
            const pct      = Math.min(100, Math.round(Number(u.monthly_traffic || 0) / FREE_LIMIT * 100));
            const plan     = u.is_vip ? 'VIP' : (u.sub_type || 'free');
            const joined   = u.joined_at   ? new Date(Number(u.joined_at)).toISOString().slice(0, 10)   : '';
            const lastSeen = u.last_active_at ? new Date(Number(u.last_active_at)).toISOString().slice(0, 10) : '';
            return [u.id, u.username || '', u.first_name || '', u.lang_code || '', plan, usedMB, pct + '%', joined, lastSeen].join(',');
        });
        const csv     = header + rows.join('\n');
        const tmpFile = path.join(os.tmpdir(), `users_${Date.now()}.csv`);
        fs.writeFileSync(tmpFile, csv, 'utf-8');
        return tmpFile;
    }

}
