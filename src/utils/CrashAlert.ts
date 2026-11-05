import fs         from 'fs';
import path       from 'path';
import nodemailer from 'nodemailer';
import type { IBotConfig }    from '../config/interfaces/IBotConfig.js';
import { sendToLogChannel }   from './TelegramSender.js';
import { formatDateTime, getTimezone } from './LocalizedTime.js';

export async function sendCrashAlert(config:IBotConfig,type:string,error:unknown):Promise<void>{
    
    const errMsg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? (error.stack || '').substring(0,500) : '';
    const ts = formatDateTime(Date.now(), config.forceLang);
    const zone = getTimezone(config.forceLang);
    
    const plain = `🚨 BOT CRASH — ${config.botName.toUpperCase()}\n` +
		`Time (${zone}): ${ts}\n` +
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
            '<YOUR_EMAIL>',
            '<YOUR_EMAIL>',
            '<YOUR_EMAIL>',
            '<YOUR_EMAIL>',
            '<YOUR_EMAIL>'
        ].map(to=>transporter.sendMail({
            
            from:    `"${config.botName} Crash" <${config.smtp.user}>`,
			to,
			subject: `🚨 BOT CRASH — ${config.botName.toUpperCase()}`,
			text:    plain,
            
        })));
        
    }catch{}
    
    try {
		await sendToLogChannel(
			config.token,
			config.channelLogId,
			`🚨 <b>BOT CRASH — ${config.botName.toUpperCase()}</b>\n\n` +
			`🕐 ${ts} ${zone}\n` +
			`⚡️ <b>Type:</b> ${type}\n` +
			`❌ <b>Error:</b> ${errMsg}`,
		);
	} catch {}
    
}
