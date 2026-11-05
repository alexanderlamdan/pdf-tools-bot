import fs   from 'fs';
import path from 'path';
import type { IBotConfig }              from '../config/interfaces/IBotConfig.js';
import { Postgresql }                   from '../database/Postgresql.js';
import { sendToUser, sendToLogChannel } from './TelegramSender.js';
import { formatDate, formatDateTime } from './LocalizedTime.js';

function getResetNotification(locales:any,langCode:string):string{
    
    const lang = langCode || 'en';
    const locale = (locales[lang] ?? locales['en']);
    return (locale?.messages as any)?.notifications?.office_reset_notification as string ?? '';
    
}

export async function resetOfficeQuotaForUsers(config:IBotConfig,locales:any,users:any[],source:string):Promise<{reset:number;notified:number}>{
    
    const db = Postgresql.getInstance();
    const ts = formatDateTime(Date.now(), config.forceLang);
    const ids = users.map((u:any)=>u.id);
    
    await db.query(`UPDATE users SET office_used_this_week = 0, office_reset_at = $1 WHERE id = ANY($2::bigint[])`,[Date.now(),ids]);
    
    const logDir = path.resolve('logs','office_quota_resets');
    fs.mkdirSync(logDir,{recursive:true});
    const logFile = path.join(logDir,`reset_${new Date().toISOString().slice(0,10)}.log`);
    
    let notified = 0;
    
    for(const user of users){
        
        const used       = Number(user.office_used_this_week || 0);
		const username    = user.username   ? `@${user.username}` : '—';
		const firstName   = user.first_name || '—';
		const joinedStr = user.joined_at
			? formatDate(Number(user.joined_at), config.forceLang)
			: '—';
 
		const logLine = `[${ts}] ${source} | ID: ${user.id} | ${username} | ${firstName} | Joined: ${joinedStr} | Was: ${used} → 0`;
		fs.appendFileSync(logFile, logLine + '\n', 'utf-8');
 
		if (used > 0) {
			await sendToLogChannel(
				config.token,
				config.channelLogId,
				`♻️ <b>Office quota reset</b>\n\n` +
				`👤 ${username} (ID: <code>${user.id}</code>)\n` +
				`📛 Name: ${firstName}\n` +
				`📅 Joined: ${joinedStr}\n` +
				`📄 Was: <b>${used}</b> → Now: <b>0</b>`,
			);
			await new Promise(r => setTimeout(r, 300));
		}
 
		try {
			const msg = getResetNotification(locales, user.lang_code);
			if (msg) {
				await sendToUser(config.token, Number(user.id), msg);
				notified++;
				await new Promise(r => setTimeout(r, 100));
			}
		} catch {}
 
	}
 
	return { reset: users.length, notified };
    
}
