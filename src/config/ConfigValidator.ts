import https from 'https';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import type{
    IBotConfigCore,
    IWithWorker,
    IWithLocalApi,
    IWithDatabase,
    IWithSmtp
} from './interfaces/IBotConfig.js';

const ALERT_EMAILS:readonly string[] = [
    'alexanderlamdan1@proton.me',
    'alexanderlamdan@tuta.io',
    'alexanderlamdan2@zohomail.com',
    'alexanderlamdan2@outlook.com',
    'alexanderlamdan01@gmail.com'
];

interface ValidationError{
    
    field:string;
    reason:string;
    hint:string;
    
}

function mask(value:unknown):string{
    
    if(value === null) return '[null]';
    if(value === undefined) return '[undefined]';
    if(value === '')return '[empty string]';
    
    if(typeof value === 'number'){
        
        const digits = String(Math.abs(value)).length;
        return value < 0 ? `[-${digits} numbers]` : `[${digits} numbers]`;
        
    }
    
    if(typeof value === 'string'){
        
        const len = value.length;
        if(len === 0) return '[empty string]';
        
        return `[string, length: ${len}, starting with: "${value[0]}"]`;
        
    }
    
    if(typeof value === 'object'){
        
        return `[Object, keys: ${Object.keys(value as object).join(', ')}]`;
        
    }
    
    return `[${typeof value}]`;
    
}

function timestamp():string{
    
    return new Date().toLocaleString('en-US',{timeZone:'Asia/Jerusalem'});
    
}

function formatPlain(botName:string,errors:ValidationError[]):string{
    
    const lines = errors.map((e,i)=>
        
        `${i + 1}. Field: ${e.field}\n` +
        `   Reason: ${e.reason}\n` +
        `   Value: ${e.hint}`
        
    );
    
    return [
        `═══════════════════════════════════════`,
        `BROKEN CONFIG — ${botName.toUpperCase()}`,
        `Time (IST): ${timestamp()}`,
        `═══════════════════════════════════════`,
        '',
        ...lines,
        '',
        `⛔ Bot not started. Fix config/LocalConfig.ts`,
        `═══════════════════════════════════════`,
    ].join('\n');
    
}

function formatHtml(botName: string, errors: ValidationError[]): string {
 
    const rows = errors.map((e, i) => `
        <tr>
            <td style="padding:8px;border:1px solid #e74c3c;font-weight:bold">${i + 1}. ${e.field}</td>
            <td style="padding:8px;border:1px solid #ddd">${e.reason}</td>
            <td style="padding:8px;border:1px solid #ddd;font-family:monospace;color:#7f8c8d">${e.hint}</td>
        </tr>`
    ).join('');
 
    return `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#f8f9fa;padding:20px">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)">
        <div style="background:#e74c3c;color:#fff;padding:20px">
            <h2 style="margin:0">🚨 BROKEN CONFIG</h2>
            <p style="margin:8px 0 0">${botName.toUpperCase()} · ${timestamp()} IST</p>
        </div>
        <div style="padding:20px">
            <table style="width:100%;border-collapse:collapse">
                <thead>
                    <tr style="background:#fdf2f2">
                        <th style="padding:8px;border:1px solid #ddd;text-align:left">Field</th>
                        <th style="padding:8px;border:1px solid #ddd;text-align:left">Reason</th>
                        <th style="padding:8px;border:1px solid #ddd;text-align:left">Value</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
            <p style="margin-top:20px;padding:12px;background:#fdf2f2;border-radius:4px;color:#c0392b">
                ⛔ Bot not started.<br>
                Fix <code>config/LocalConfig.ts</code> and restart systemd service.
            </p>
        </div>
    </div>
</body>
</html>`;
 
}

function formatTelegram(botName: string, errors: ValidationError[]): string {
 
    const lines = errors.map((e, i) =>
        `${i + 1}. <b>${e.field}</b>\n` +
        `   Reason: ${e.reason}\n` +
        `   Value: <code>${e.hint}</code>`
    );
 
    return [
        `🚨 <b>BROKEN CONFIG — ${botName.toUpperCase()}</b>`,
        `🕐 ${timestamp()} IST`,
        '',
        lines.join('\n\n'),
        '',
        `⛔ Fix <code>config/LocalConfig.ts</code>`,
    ].join('\n');
 
}

function writeToFile(botName:string,plain:string):void{
    
    try{
        
        const logDir = path.resolve('logs','config');
        const logFile = path.join(logDir,'startup-errors.log');
        
        fs.mkdirSync(logDir,{recursive:true});
        fs.appendFileSync(logFile,plain + '\n\n','utf-8');
        
        console.error(`📁 Log written: ${logFile}`);
        
    }catch(e){
        
        console.error('⚠️  Cant write to log file:', e);
        
    }
    
}

async function sendEmails(smtp:IWithSmtp['smtp'],botName:string,html:string,plain:string):Promise<boolean>{
    
    let transporter:nodemailer.Transporter;
    
    try{
        
        transporter = nodemailer.createTransport({
            
            host:smtp.host,
            port:smtp.port,
            secure:false,
            requireTLS:true,
            auth:{user:smtp.user,pass:smtp.password},
            connectionTimeout:10_000,
            greetingTimeout:10_000
            
        });
        
    }catch(e){
        
        console.error('⚠️  Cannot create SMTP transport:', e);
        return false;
    }
    
    const results = await Promise.allSettled(
        ALERT_EMAILS.map(to=>
            transporter.sendMail({
                
                from: `"${botName} Alert" <${smtp.user}>`,
                to,
                subject:`🚨 BROKEN CONFIG ALERT - ${botName.toUpperCase()}`,
                text:plain,
                html
                
            })
        )
    );
    
    const sent = results.filter(r=>r.status === 'fulfilled').length;
    
    results.forEach((r,i)=>{
        
        if(r.status === 'rejected'){
            
            console.error(`⚠️ Email -> ${ALERT_EMAILS[i]} not sended:`,(r as PromiseRejectedResult).reason?.message ?? r);
            
        }
        
    });
    
    if(sent > 0) console.error(`📨 email sent to ${sent}/${ALERT_EMAILS.length} addresses`);
    
    return sent > 0;
    
}

async function sendTelegram(token:string,channelId:number,text:string):Promise<boolean>{
    
    const body = JSON.stringify({chat_id:channelId,text,parse_mode:'HTML'});
    const urlObj = new URL(`https://api.telegram.org/bot${token}/sendMessage`);
    
    return new Promise((resolve)=>{
        
        const req = https.request({
            
            hostname:urlObj.hostname,
            port:443,
            path:urlObj.pathname,
            method:'POST',
            headers:{
                'Content-Type':'application/json',
                'Content-Length':Buffer.byteLength(body)
            }
            
        },(res)=>resolve((res.statusCode ?? 0) < 400));
        req.setTimeout(10_000,()=>{req.destroy();resolve(false);});
        req.on('error',()=>resolve(false));
        req.write(body);
        req.end();
    });
    
}

function validateCore(cfg: IBotConfigCore, errors: ValidationError[]): void {
 
    if (!/^\d{8,12}:[A-Za-z0-9_-]{35,}$/.test(cfg.token)) {
        errors.push({ field: 'token', reason: 'Invalid token format (digits:base64url)', hint: mask(cfg.token) });
    }
 
    if (!Number.isInteger(cfg.adminId) || cfg.adminId <= 0) {
        errors.push({ field: 'adminId', reason: 'Should be integer (Telegram user ID)', hint: mask(cfg.adminId) });
    }
 
    if (!/^[a-z0-9-]+$/.test(cfg.botName)) {
        errors.push({ field: 'botName', reason: 'Only -, numbers and letters. Example: pdf-tools-bot', hint: mask(cfg.botName) });
    }
 
    if (!/^https:\/\/.+\..+/.test(cfg.url)) {
        errors.push({ field: 'url', reason: 'Should start with https:// and include domain', hint: mask(cfg.url) });
    }
 
    if (!Number.isInteger(cfg.channelLogId) || cfg.channelLogId >= 0) {
        errors.push({ field: 'channelLogId', reason: 'Channel ID — negative integer number. Example: -1001234567890', hint: mask(cfg.channelLogId) });
    }
    
    if (!Number.isInteger(cfg.botGroupId) || cfg.botGroupId >= 0) {
        errors.push({ field: 'channelLogId', reason: 'Group ID — negative integer number. Example: -1001234567890', hint: mask(cfg.botGroupId) });
    }
 
    const expectedSlug = cfg.botName.replace(/-bot$/, '');
    if (cfg.slug !== expectedSlug) {
        errors.push({ field: 'slug', reason: `Should be "${expectedSlug}" (botName without suffix -bot)`, hint: mask(cfg.slug) });
    }
 
    const expectedPath = `/bot/${cfg.slug}`;
    if (cfg.path !== expectedPath) {
        errors.push({ field: 'path', reason: `Should be "${expectedPath}"`, hint: mask(cfg.path) });
    }
 
}
 
function validateWorker(cfg: IWithWorker, errors: ValidationError[]): void {
 
    if (!/^\/run\/.+\.sock$/.test(cfg.workerSocketPath)) {
        errors.push({ field: 'workerSocketPath', reason: 'Should start with /run/ and end on .sock', hint: mask(cfg.workerSocketPath) });
    }
 
}
 
function validateLocalApi(cfg: IWithLocalApi, errors: ValidationError[]): void {
 
    if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(cfg.localApiFile)) {
        errors.push({ field: 'localApiFile', reason: 'Should be http://127.0.0.1:PORT или http://localhost:PORT', hint: mask(cfg.localApiFile) });
    }
 
    if (!cfg.telegramStoragePath.startsWith('/')) {
        errors.push({ field: 'telegramStoragePath', reason: 'Should be absolute path (starting with /)', hint: mask(cfg.telegramStoragePath) });
    }
 
}
 
function validateDatabase(cfg: IWithDatabase, errors: ValidationError[]): void {
 
    if (!cfg.db.host.trim()) {
        errors.push({ field: 'db.host', reason: 'Cannot be empty', hint: mask(cfg.db.host) });
    }
 
    if (!Number.isInteger(cfg.db.port) || cfg.db.port < 1024 || cfg.db.port > 65535) {
        errors.push({ field: 'db.port', reason: 'Should be number from 1024 to 65535', hint: mask(cfg.db.port) });
    }
 
    if (!cfg.db.database.trim()) {
        errors.push({ field: 'db.database', reason: 'Cannot be empty', hint: mask(cfg.db.database) });
    }
 
    if (!cfg.db.user.trim()) {
        errors.push({ field: 'db.user', reason: 'Cannot be empty', hint: mask(cfg.db.user) });
    }
 
    if (!cfg.db.password.trim()) {
        errors.push({ field: 'db.password', reason: 'Cannot be empty', hint: mask(cfg.db.password) });
    }
 
}
 
function validateSmtp(cfg: IWithSmtp, errors: ValidationError[]): void {
 
    if (!cfg.smtp.host.trim()) {
        errors.push({ field: 'smtp.host', reason: 'Cannot be empty', hint: mask(cfg.smtp.host) });
    }
 
    if (!Number.isInteger(cfg.smtp.port) || cfg.smtp.port < 1 || cfg.smtp.port > 65535) {
        errors.push({ field: 'smtp.port', reason: 'Should be number from 1 to 65535', hint: mask(cfg.smtp.port) });
    }
 
    if (!cfg.smtp.user.includes('@')) {
        errors.push({ field: 'smtp.user', reason: 'Should be valid email address', hint: mask(cfg.smtp.user) });
    }
 
    if (!cfg.smtp.password.trim()) {
        errors.push({ field: 'smtp.password', reason: 'Cannot be empty', hint: mask(cfg.smtp.password) });
    }
 
}

function hasWorker(cfg:unknown):cfg is IWithWorker{
    
    return typeof (cfg as any).workerSocketPath === 'string';
    
}

function hasLocalApi(cfg:unknown):cfg is IWithLocalApi{
    return typeof (cfg as any).localApiFile === 'string';
}

function hasDatabase(cfg:unknown):cfg is IWithDatabase{
    return typeof (cfg as any).db === 'object' && (cfg as any).db !== null;
}

function hasSmtp(cfg:unknown):cfg is IWithSmtp{
    return typeof (cfg as any).smtp === 'object' && (cfg as any).smtp !== null;
}

export async function validateConfig(cfg:IBotConfigCore):Promise<void>{
    
    const errors:ValidationError[] = [];
    
    validateCore(cfg,errors);
    if(hasWorker(cfg))validateWorker(cfg,errors);
    if(hasLocalApi(cfg))validateLocalApi(cfg,errors);
    if(hasDatabase(cfg))validateDatabase(cfg,errors);
    if(hasSmtp(cfg))validateSmtp(cfg,errors);
    
    if(errors.length === 0) return;
    
    const botName = cfg.botName || 'UNKNOWN BOT';
    const plain = formatPlain(botName,errors);
    const html = formatHtml(botName,errors);
    const tg = formatTelegram(botName,errors);
    
    console.error('\n' + plain + '\n');
    
    let emailSent = false;
    
    if(hasSmtp(cfg)){
        
        const smtpOk = errors.every(e => !e.field.startsWith('smtp'));
        if(smtpOk){
            
            emailSent = await sendEmails(cfg.smtp,botName,html,plain);
            
        }else{
            
            console.error('⚠️  Email missed - smtp config not valid');
            
        }
        
    }else{
        
        console.error('⚠️  smtp not configured — email alerts will not work');
        
    }
    
    if(!emailSent){
        
        const tokenOk = errors.every(e => e.field !== 'token');
        const chanOk  = errors.every(e => e.field !== 'channelLogId');
 
        if (tokenOk && chanOk) {
 
            const tgSent = await sendTelegram(cfg.token, cfg.channelLogId, tg);
            console.error(tgSent
                ? '📨 Alert sended to BotLog Channel (fallback)'
                : '⚠️  Telegram not respond too'
            );
 
        } else {
 
            console.error('⚠️  Telegram missed — token or channelLogId not valid');
 
        }
        
    }
    
    writeToFile(botName,plain);
    process.exit(1);
    
}
