import fs   from 'fs';
import path from 'path';
import type { IBotConfig }         from '../config/interfaces/IBotConfig.js';
import { Postgresql }              from '../database/Postgresql.js';
import { sendToUser, sendToLogChannel } from './TelegramSender.js';
import { SUBSCRIPTION_LIMITS, GIGABYTE } from './SubscriptionUtils.js';
import { formatDate, formatDateTime } from './LocalizedTime.js';

function getResetNotification(locales: any, langCode: string): string {
	const lang   = langCode || 'en';
	const locale = (locales[lang] ?? locales['en'])!;
	return (locale?.messages as any)?.notifications?.traffic_reset_notification as string ?? '';
}

function getUserLimitLabel(user: any): string {
	if (user.is_vip) return '∞';
	const limitBytes = SUBSCRIPTION_LIMITS[user.sub_type] ?? SUBSCRIPTION_LIMITS['free'];
	if (limitBytes === Infinity) return '∞';
	return `${(limitBytes / GIGABYTE).toFixed(0)} GB`;
}

export async function resetTrafficForUsers(
	config:          IBotConfig,
	locales:         any,
	users:           any[],
	source:          string,
	updateLastReset: boolean = true,
): Promise<{ reset: number; notified: number }> {

	const db  = Postgresql.getInstance();
	const ts  = formatDateTime(Date.now(), config.forceLang);
	const ids = users.map((u: any) => u.id);

	if (updateLastReset) {
		await db.query(
			`UPDATE users SET monthly_traffic = 0, last_reset_at = $1 WHERE id = ANY($2::bigint[])`,
			[Date.now(), ids],
		);
	} else {
		await db.query(
			`UPDATE users SET monthly_traffic = 0 WHERE id = ANY($1::bigint[])`,
			[ids],
		);
	}

	const logDir  = path.resolve('logs', 'traffic_resets');
	fs.mkdirSync(logDir, { recursive: true });
	const logFile = path.join(logDir, `reset_${new Date().toISOString().slice(0, 10)}.log`);

	let notified = 0;

	for (const user of users) {

		const usedMB    = (Number(user.monthly_traffic) / 1024 / 1024).toFixed(2);
		const username   = user.username   ? `@${user.username}` : '—';
		const firstName  = user.first_name || '—';
		const limitLabel = getUserLimitLabel(user);
		const planLabel  = user.is_vip ? 'VIP' : (user.sub_type || 'free');
		const joinedStr = user.joined_at
			? formatDate(Number(user.joined_at), config.forceLang)
			: '—';

		const logLine = `[${ts}] ${source} | ID: ${user.id} | ${username} | ${firstName} | Joined: ${joinedStr} | Plan: ${planLabel} | Was: ${usedMB}MB → 0 MB`;
		fs.appendFileSync(logFile, logLine + '\n', 'utf-8');

		if (Number(user.monthly_traffic) > 0) {
			await sendToLogChannel(
				config.token,
				config.channelLogId,
				`♻️ <b>Traffic reset</b>\n\n` +
				`👤 ${username} (ID: <code>${user.id}</code>)\n` +
				`📛 Name: ${firstName}\n` +
				`📅 Joined: ${joinedStr}\n` +
				`💎 Plan: ${planLabel}\n` +
				`💾 Was: <b>${usedMB} MB</b> → Now: <b>0 MB / ${limitLabel}</b>`,
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
