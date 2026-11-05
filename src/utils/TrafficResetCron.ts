import type { IBotConfig }       from '../config/interfaces/IBotConfig.js';
import { Postgresql }             from '../database/Postgresql.js';
import { sendToLogChannel }       from './TelegramSender.js';
import { sendCrashAlert }         from './CrashAlert.js';
import { resetTrafficForUsers }   from './TrafficResetService.js';
import { formatDate } from './LocalizedTime.js';

export function startTrafficResetCron(config:IBotConfig,locales:any):void{
    
    const CHECK_INTERVAL_MS = 60 * 60 * 1000;
    
    setInterval(async ()=>{
        
        try{
            
            const db = Postgresql.getInstance();
            const now = new Date();
            
            const startOfMonth = new Date(now.getFullYear(),now.getMonth(),1,0,0,0,0).getTime();
            
            const todayDay = now.getDate();

            const lastDayOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const isLastDayOfMonth   = todayDay === lastDayOfThisMonth;
            
            const usersToReset = await db.query(
                `SELECT id, username, first_name,monthly_traffic, lang_code, joined_at, sub_type, is_vip
                 FROM users
                 WHERE (
                     EXTRACT(DAY FROM to_timestamp(joined_at / 1000.0)) = $1
                     OR ($3 = true AND EXTRACT(DAY FROM to_timestamp(joined_at / 1000.0)) > $1)
                 )
                 AND joined_at < $2
                 AND (last_reset_at IS NULL OR last_reset_at < $2)`,
                [todayDay,startOfMonth,isLastDayOfMonth],
            );
            
            if(usersToReset.length === 0) return;
            
            const ts = formatDate(now.getTime(), config.forceLang);
            console.log(`[Cron] ✅ Traffic reset for ${usersToReset.length} users (day=${todayDay}${isLastDayOfMonth ? ', end-of-month clamp active' : ''}) at ${ts}`);
            
            const {reset, notified} = await resetTrafficForUsers(config,locales,usersToReset,'CRON',true);
            console.log(`[Cron] 📨 Notified ${notified} users`);
            
            await sendToLogChannel(
				config.token,
				config.channelLogId,
				`♻️ <b>Traffic reset complete</b>\n` +
				`🕐 ${ts} IST\n` +
				`👥 Reset: <b>${reset}</b> users\n` +
				`📨 Notified: <b>${notified}</b> active users\n` +
				`😴 Silent: <b>${reset - notified}</b> inactive`,
			);
            
        }catch(e){
            
            console.error('[Cron] ❌ Traffic reset failed:', e);
			await sendCrashAlert(config, 'TrafficResetCron', e);
            
        }
        
    },CHECK_INTERVAL_MS);
    
    console.log(`[Cron] Personal traffic reset scheduler started`);
    
}
