import fs         from 'fs';
import http       from 'http';
import path       from 'path';
import https      from 'https';
import express    from 'express';
import nodemailer from 'nodemailer';
import { LocalConfig }     from './config/LocalConfig.js';
import { Postgresql }      from '../shared/src/database/Postgresql.js';
import { TelegramBotCore } from '../shared/src/core/TelegramBotCore.js';
import { registerLocale } from '../shared/src/services/LocalizationService.js';
import { locales }        from './locales/index.js';


const config = new LocalConfig();
await config.validate();
Postgresql.init(config.db);


registerLocale('en', locales.en);

const botCore = new TelegramBotCore(config);
const app = express();

app.use(express.json());
app.post(config.path,botCore.getWebhookCallback());
app.get('/',(_,res)=>res.send('OK'));

const SOCKET = `/run/bots/${config.botName}.sock`;
if(fs.existsSync(SOCKET)) fs.unlinkSync(SOCKET);

http.createServer(app).listen(SOCKET,async()=>{
	
	fs.chmodSync(SOCKET,0o660);
	await botCore.init();
	
	console.log('>>> BOT STARTED <<<');
	console.log(`✅ ${config.botName} running on ${SOCKET}, webhook: ${config.path}`);
	
	startTrafficResetCron();
	
});

async function sendCrashAlert(type:string,error:unknown):Promise<void>{
	
	const errMsg = error instanceof Error ? error.message : String(error);
	const stack = error instanceof Error ? (error.stack || '').substring(0,500) : '';
	const ts = new Date().toLocaleString('en-US',{timeZone:'Asia/Jerusalem'});
	
	const plain = `🚨 BOT CRASH — ${config.botName.toUpperCase()}\n` +
	`Time (IST): ${ts}\n` +
	`Type: ${type}\n` +
	`Error: ${errMsg}\n` +
	`Stack:\n${stack}`;
	
	try{
		
		const logDir = path.resolve('logs','crashes');
		fs.mkdirSync(logDir,{recursive:true});
		fs.appendFileSync(path.join(logDir,'crash.log'),plain + '\n\n','utf-8');
		
	}catch{}
	
	try{
		
		const transporter = nodemailer.createTransport({
			host:config.smtp.host,
			port:config.smtp.port,
			secure:false,
			requireTLS:true,
			auth:{user:config.smtp.user,pass:config.smtp.password},
			connectionTimeout:5_000,
			greetingTimeout:5_000
		});
		
		await Promise.allSettled([
			'alexanderlamdan1@proton.me',
            'alexanderlamdan@tuta.io',
            'alexanderlamdan2@zohomail.com',
            'alexanderlamdan2@outlook.com',
            'alexanderlamdan01@gmail.com',
		].map(to => transporter.sendMail({
			
			from: `"${config.botName} Crash" <${config.smtp.user}>`,
			to,
			subject:`🚨 BOT CRASH — ${config.botName.toUpperCase()}`,
			text:plain
			
		})));
		
	}catch{}
	
	try{
		
		const body = JSON.stringify({
			chat_id:config.channelLogId,
			text: `🚨 <b>BOT CRASH — ${config.botName.toUpperCase()}</b>\n\n` +
			`🕐 ${ts} IST\n` +
			`⚡️ <b>Type:</b> ${type}\n` +
			`❌ <b>Error:</b> ${errMsg}`,
		   parse_mode:'HTML'
		});
		
		const urlObj = new URL(`https://api.telegram.org/bot${config.token}/sendMessage`);
		await new Promise<void>((resolve)=>{
			
			const req = https.request({
				
				hostname:urlObj.hostname,
				port:443,
				path:urlObj.pathname,
				method:'POST',
				headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}
				
			},()=>resolve());
			
			req.setTimeout(5_000,()=>{req.destroy();resolve();});
			req.on('error',()=>resolve());
			req.write(body);
			req.end();
			
		});
		
	}catch{}
	
}

process.on('uncaughtException',async(err)=>{
	
	console.error('[FATAL] uncaughtException:',err);
	await sendCrashAlert('uncaughtException',err);
	process.exit(1);
	
});

process.on('unhandledRejection',async(reason)=>{
	
	console.error('[FATAL] unhandledRejection:',reason);
	await sendCrashAlert('unhandledRejection',reason);
	process.exit(1);
	
});


async function sendToUser(userId:number,text:string):Promise<void>{
	
	const body = JSON.stringify({chat_id:userId,text,parse_mode:'HTML'});
	const urlObj = new URL(`https://api.telegram.org/bot${config.token}/sendMessage`);
	
	await new Promise<void>((resolve)=>{
		const req = https.request({
            hostname: urlObj.hostname,
            port:     443,
            path:     urlObj.pathname,
            method:   'POST',
            headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        }, () => resolve());
        req.setTimeout(8_000, () => { req.destroy(); resolve(); });
        req.on('error', () => resolve());
        req.write(body);
        req.end();
	});
	
}

function startTrafficResetCron():void{
	
	const CHECK_INTERVAL_MS = 60 * 60 * 1000;
	setInterval(async ()=>{
		
		try{
			
			const db = Postgresql.getInstance();
			const now = new Date();
			
			const startOfMonth = new Date(
				now.getFullYear(),
				now.getMonth(),
				1,0,0,0,0,
			).getTime();
			
			const todayDay = now.getDate();
			const usersToReset = await db.query(
				`SELECT id, username, first_name, monthly_traffic, lang_code, joined_at
                FROM users
                WHERE
                    EXTRACT(DAY FROM to_timestamp(joined_at / 1000)) = $1
                    AND (last_reset_at IS NULL OR last_reset_at < $2)
            `,[todayDay,startOfMonth]
			);
			
			if(usersToReset.length === 0) return;
			
			const ids = usersToReset.map((u:any)=>u.id);
			await db.query(`
                UPDATE users
                SET monthly_traffic = 0, last_reset_at = $1
                WHERE id = ANY($2::bigint[])`,[Date.now(),ids]);
			
			const ts = now.toLocaleString('en-US',{timeZone:'Asia/Jerusalem'});
			console.log(`[Cron] ✅ Traffic reset for ${usersToReset.length} users (day=${todayDay}) at ${ts}`);
 
			const logDir = path.resolve('logs', 'traffic_resets');
			fs.mkdirSync(logDir, {recursive: true});
			const logFile = path.join(logDir, `reset_${now.toISOString().slice(0,10)}.log`);
 
			for(const user of usersToReset){
 
				const usedMB     = (Number(user.monthly_traffic) / 1024 / 1024).toFixed(2);
				const username   = user.username  ? `@${user.username}` : '—';
				const firstName  = user.first_name || '—';
				const joinedStr  = user.joined_at
					? new Date(Number(user.joined_at)).toLocaleDateString('en-US', {timeZone:'Asia/Jerusalem'})
					: '—';
					
				const logLine = `[${ts}] RESET | ID: ${user.id} | ${username} | ${firstName} | Joined: ${joinedStr} | Was: ${usedMB}MB → Now: 0 MB / 2048 MB`;
				fs.appendFileSync(logFile, logLine + '\n', 'utf-8');
 
				if(Number(user.monthly_traffic) > 0){
 
					const tgBody = JSON.stringify({
						chat_id:    config.channelLogId,
						text:       `♻️ <b>Traffic reset</b>\n\n` +
						            `👤 ${username} (ID: <code>${user.id}</code>)\n` +
						            `📛 Name: ${firstName}\n` +
						            `📅 Joined: ${joinedStr}\n` +
						            `💾 Was: <b>${usedMB} MB</b> → Now: <b>0 MB / 2 GB</b>`,
						parse_mode: 'HTML',
					});
 
					const urlObjLog = new URL(`https://api.telegram.org/bot${config.token}/sendMessage`);
					await new Promise<void>((resolve) => {
						const req = https.request({
							hostname: urlObjLog.hostname,
							port:     443,
							path:     urlObjLog.pathname,
							method:   'POST',
							headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(tgBody) },
						}, () => resolve());
						req.setTimeout(5_000, () => { req.destroy(); resolve(); });
						req.on('error', () => resolve());
						req.write(tgBody);
						req.end();
					});
 
					await new Promise(r => setTimeout(r, 300)); // антифлуд
 
				}
 
			}
 
			const activeUsers = usersToReset.filter((u:any) => Number(u.monthly_traffic) > 0);
			for(const user of activeUsers){
				try{
					const lang = user.lang_code || 'en';
					const msg  = getResetMessage(lang);
					await sendToUser(Number(user.id), msg);
					await new Promise(r => setTimeout(r, 100));
				}catch{}
			}
 
			console.log(`[Cron] 📨 Notified ${activeUsers.length} active users`);

			const body = JSON.stringify({
				chat_id:    config.channelLogId,
				text:       `♻️ <b>Traffic reset complete</b>\n` +
				            `🕐 ${ts} IST\n` +
				            `👥 Reset: <b>${usersToReset.length}</b> users\n` +
				            `📨 Notified: <b>${activeUsers.length}</b> active users\n` +
				            `😴 Silent: <b>${usersToReset.length - activeUsers.length}</b> inactive`,
				parse_mode: 'HTML',
			});
 
			const urlObj = new URL(`https://api.telegram.org/bot${config.token}/sendMessage`);
            await new Promise<void>((resolve) => {
                const req = https.request({
                    hostname: urlObj.hostname,
                    port:     443,
                    path:     urlObj.pathname,
                    method:   'POST',
                    headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
                }, () => resolve());
                req.setTimeout(5_000, () => { req.destroy(); resolve(); });
                req.on('error', () => resolve());
                req.write(body);
                req.end();
            });
 
		}catch(e){
			
			console.error('[Cron] ❌ Traffic reset failed:', e);
            await sendCrashAlert('TrafficResetCron', e);
			
		}
		
	},CHECK_INTERVAL_MS);
	
	console.log(`[Cron] Personal traffic reset scheduler started`);
	
}

function getResetMessage(lang: string): string {
 
    switch (lang) {
 
        case 'ru':
            return (
                `♻️ <b>Ваш лимит трафика обновлён!</b>\n\n` +
                `Теперь вам снова доступны <b>2 GB</b> бесплатного трафика.\n\n` +
                `Спасибо что пользуетесь нашим ботом! 🙏\n\n` +
                `Если вы часто упираетесь в лимит — рассмотрите одну из наших подписок. ` +
                `Больше трафика, свой водяной знак и приоритет в очереди.\n\n` +
                `👉 Нажмите 👤 <b>Мой статус</b> чтобы посмотреть планы.`
            );
 
        case 'he':
            return (
                `♻️ <b>מכסת התעבורה שלך עודכנה!</b>\n\n` +
                `כעת יש לך שוב <b>2 GB</b> של תעבורה חינמית.\n\n` +
                `תודה שאתם משתמשים בבוט שלנו! 🙏\n\n` +
                `אם אתם מגיעים לגבול מהר — שקלו אחת מהמנויים שלנו. ` +
                `יותר תעבורה, סימן מים משלכם ועדיפות בתור.\n\n` +
                `👉 לחצו 👤 <b>המצב שלי</b> כדי לראות את התוכניות.`
            );
 
        default: // en
            return (
                `♻️ <b>Your traffic limit has been reset!</b>\n\n` +
                `You now have <b>2 GB</b> of free traffic again.\n\n` +
                `Thank you for using PDF Tools Bot! 🙏\n\n` +
                `If you find yourself hitting the limit often — consider one of our plans. ` +
                `More traffic, your own watermark and priority queue.\n\n` +
                `👉 Tap 👤 <b>My Status</b> to view available plans.`
            );
 
    }
 
}
