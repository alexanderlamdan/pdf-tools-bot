import type { IBotConfig }         from '../config/interfaces/IBotConfig.js';
import { Postgresql }              from '../database/Postgresql.js';
import { sendToLogChannel }        from './TelegramSender.js';
import { sendCrashAlert }          from './CrashAlert.js';
import { resetOfficeQuotaForUsers } from './OfficeQuotaResetService.js';
import { formatDate } from './LocalizedTime.js';

export function startOfficeQuotaResetCron(config:IBotConfig,locales:any):void{

    const CHECK_INTERVAL_MS = 60 * 60 * 1000;

    setInterval(async ()=>{

        try{

            const db = Postgresql.getInstance();
            const now = new Date();

            const startOfWeek = new Date(now);
            startOfWeek.setUTCDate(now.getUTCDate() - now.getUTCDay());
            startOfWeek.setUTCHours(0,0,0,0);
            const startOfWeekMs = startOfWeek.getTime();

            const todayDow = now.getUTCDay();

            const usersToReset = await db.query(
                `SELECT id, username, first_name, office_used_this_week, lang_code, joined_at
                 FROM users
                 WHERE EXTRACT(DOW FROM to_timestamp(joined_at / 1000.0)) = $1
                 AND joined_at < $2
                 AND (office_reset_at IS NULL OR office_reset_at < $2)`,
                [todayDow,startOfWeekMs],
            );

            if(usersToReset.length === 0) return;

            const ts = formatDate(now.getTime(), config.forceLang);
            console.log(`[Cron] ✅ Office quota reset for ${usersToReset.length} users (dow=${todayDow}) at ${ts}`);

            const {reset, notified} = await resetOfficeQuotaForUsers(config,locales,usersToReset,'CRON');
            console.log(`[Cron] 📨 Notified ${notified} users`);

            await sendToLogChannel(
				config.token,
				config.channelLogId,
				`♻️ <b>Office quota reset complete</b>\n` +
				`🕐 ${ts} IST\n` +
				`👥 Reset: <b>${reset}</b> users\n` +
				`📨 Notified: <b>${notified}</b> active users\n` +
				`😴 Silent: <b>${reset - notified}</b> inactive`,
			);

        }catch(e){

            console.error('[Cron] ❌ Office quota reset failed:', e);
			await sendCrashAlert(config, 'OfficeQuotaResetCron', e);

        }

    },CHECK_INTERVAL_MS);

    console.log(`[Cron] Weekly office quota reset scheduler started`);

}
