import type { BotContext }          from '../../types/BotContext.js';
import type { IBotConfig }           from '../../config/interfaces/IBotConfig.js';
import type { LocalizationService }  from '../../services/LocalizationService.js';
import { LoggerService }             from '../../services/LoggerService.js';
import { Postgresql }                from '../../database/Postgresql.js';
import { formatDate, formatDateTime } from '../../utils/LocalizedTime.js';

const INACTIVE_DAYS = 30;
const INACTIVE_MS = INACTIVE_DAYS * 24 * 60 * 60 * 1000;
const MAX_IDS = 50;

export class CleanupCommandHandler{
    
    private readonly logger:LoggerService;
    private readonly db = Postgresql.getInstance();
    
    constructor(private readonly config:IBotConfig,private readonly localization:LocalizationService){
        
        this.logger = new LoggerService(config);
        
    }
    
    async handleList(ctx:BotContext):Promise<void>{
        
        if(ctx.from?.id !== this.config.adminId)return;
        
        const cutoff = Date.now() - INACTIVE_MS;
        const ts = formatDateTime(Date.now(), this.localization.getLang());
        
        const rows = await this.db.query(`
            SELECT u.id,u.username,u.first_name,u.lang_code,u.is_vip,u.sub_type,u.joined_at,u.last_active_at,u.monthly_traffic, COUNT(l.id) AS total_actions FROM users u LEFT JOIN activity_logs l ON l.user_id = u.id WHERE u.id != $1 AND (u.last_active_at IS NULL OR u.last_active_at < $2) GROUP BY u.id ORDER BY u.last_active_at ASC NULLS FIRST LIMIT 50
        `,[Number(this.config.adminId), Number(cutoff)]);
        
        if(rows.length === 0){
            
            await ctx.reply(`✅ No inactive users (>${INACTIVE_DAYS} days) found.`);
            return;
            
        }
        
        const lines = rows.map((u:any,i:number)=>{
            
            const name = u.username ? `@${u.username}`:(u.first_name || '-');
            const lastSeen = u.last_active_at ? formatDate(Number(u.last_active_at), this.localization.getLang()) : 'never';
            
            const joined = u.joined_at ? formatDate(Number(u.joined_at), this.localization.getLang()) : '-';
            
            const plan = u.is_vip ? 'VIP' : (u.sub_type || 'free');
            const actions = Number(u.total_actions);
            const trafficMB = (Number(u.monthly_traffic || 0) / 1024 / 1024).toFixed(2);
            
            return(
                `${i + 1}. <code>${u.id}</code> ${name}\n` +
                `   📅 Joined: ${joined} | Last: ${lastSeen}\n` +
                `   📊 Actions: ${actions} | 💾 ${trafficMB}MB | ${plan}`

            );
            
        });
        
        const idList = rows.map((u:any)=>u.id).join('+');
        const msg =             `🗑 <b>Inactive users (>${INACTIVE_DAYS} days) — ${rows.length} found</b>\n` +
            `🕐 ${ts} IST\n\n` +
            `${lines.join('\n\n')}\n\n` +
            `<b>To delete selected users:</b>\n` +
            `<code>/cleanup_inactive_clean ${idList} clean</code>\n\n` +
            `<i>Edit IDs as needed before running.</i>`;
        for(const chunk of this.splitMessage(msg,4096)){
            
            await ctx.reply(chunk,{parse_mode:'HTML'});
            
        }
        
    }
    
    async handleClean(ctx:BotContext,args:string):Promise<void>{
        
        if(ctx.from?.id !== this.config.adminId) return;
        
        const parts = args.trim().split(/\s+/);
        const confirm = parts[parts.length -1];
        
        if(confirm !== 'clean'){
            
            await ctx.reply(                `⚠️ Missing confirmation word.\n\n` +
                `Usage: <code>/cleanup_inactive_clean id1+id2+id3 clean</code>`,
                {parse_mode:'HTML'}
            );
            return;
        }
        
        const rawIds = parts[0];
        if(!rawIds){
            
            await ctx.reply(`⚠️ No IDs provided.`, { parse_mode: 'HTML' });
            return;
            
        }
        
        const ids = rawIds.split('+').map(s=>Number(s.trim())).filter(n=>!isNaN(n) && n > 0);
        
        if(ids.length === 0){
            
            await ctx.reply(`⚠️ No valid IDs found in: <code>${rawIds}</code>`, { parse_mode: 'HTML' });
            return;
            
        }
        
        if(ids.includes(this.config.adminId)){
            
            await ctx.reply(`🚫 Admin ID detected in the list. Aborted.`, { parse_mode: 'HTML' });
            return;
            
        }
        
        if(ids.length > MAX_IDS){
            
            await ctx.reply(`⚠️ Too many IDs (max ${MAX_IDS}). Split into batches.`, { parse_mode: 'HTML' });
            return;
            
        }
        
        const statusMsg = await ctx.reply(`⏳ Deleting ${ids.length} users...`);
        const before = await this.db.query(`SELECT id, username, first_name, last_active_at, monthly_traffic, sub_type, is_vip
             FROM users WHERE id = ANY($1::bigint[])`,[ids]);
        
        const deleted:number[] = [];
        const notFound:number[] = [];
        const failed:Array<{id:number,error:string}> =[];
        
        for(const userId of ids){
            
            let attempt = 0;
            while(attempt < 3){
                
                try{
                    
                    const res = await this.db.query('DELETE FROM users WHERE id = $1 RETURNING id',[userId]);
                    if(res.length > 0){
                        
                        deleted.push(userId);
                        
                    }else{
                        
                        notFound.push(userId);
                        
                    }
                    
                    break;
                    
                }catch(e:any){
                    
                    attempt++;
                    console.error(`[Cleanup] Delete user ${userId} attempt ${attempt} failed:`, e.message);
                    
                    if(attempt >= 3){
                        
                        failed.push({id:userId,error:e.message});
                        
                    }else{
                        
                        await new Promise(r=>setTimeout(r,500*attempt));
                        
                    }
                    
                }
                
            }
            
        }
        
        await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
        const ts = formatDateTime(Date.now(), this.localization.getLang());
        
        const deletedLines = before.filter((u:any)=>deleted.includes(Number(u.id))).map((u:any)=>{
            
            const name = u.username ? `@${u.username}` : (u.first_name || '-');
            const lastSeen = u.last_active_at ? formatDate(Number(u.last_active_at), this.localization.getLang()) : 'never';
            
            const plan = u.is_vip ? 'VIP' : (u.sub_type || 'free');
            return `  ✅ <code>${u.id}</code> ${name} | Last: ${lastSeen} | ${plan}`;
            
        }).join('\n');
        
        const failedLines = failed.map(f=>`  ❌ <code>${f.id}</code> — ${f.error.substring(0, 80)}`).join('\n');
        
        const notFoundLines = notFound.map(id=>`  ⚪ <code>${id}</code> — not found`).join('\n');
        
        let report =             `🗑 <b>CLEANUP COMPLETE</b>\n` +
            `🕐 ${ts} IST\n\n` +
            `✅ Deleted: <b>${deleted.length}</b>\n` +
            `⚪ Not found: <b>${notFound.length}</b>\n` +
            `❌ Failed: <b>${failed.length}</b>\n\n`;
        
        if (deletedLines)  report += `<b>Deleted:</b>\n${deletedLines}\n\n`;
        if (notFoundLines) report += `<b>Not found:</b>\n${notFoundLines}\n\n`;
        if (failedLines)   report += `<b>Failed:</b>\n${failedLines}\n\n`;
        
        if(deleted.length > 0){
            
            const verify = await this.db.query('SELECT id FROM users WHERE id = ANY($1::bigint[])',[deleted]);
            
            if(verify.length === 0){
                
                report += `✅ <b>Verification passed</b> — all deleted users confirmed gone.`;
                
            }else{
                
                const remaining = verify.map((r:any)=>`<code>${r.id}</code>`).join(', ');
                report += `⚠️ <b>Verification warning</b> — still found in DB: ${remaining}`;
                
            }
            
        }
        
        await ctx.api.sendMessage(this.config.channelLogId,report,{parse_mode:'HTML'}).catch(()=>{});
        
        for(const chunk of this.splitMessage(report,4096)){
            
            await ctx.reply(chunk,{parse_mode:'HTML'});
            
        }
        
        await this.logger.logAction(
            'CleanupCommandHandler',
            ctx.from!,
            'Cleanup executed',
            `Deleted: ${deleted.length} | Failed: ${failed.length} | NotFound: ${notFound.length}`,
        );
        
    }
    
    async handleBlockedList(ctx:BotContext):Promise<void>{
        
        if(ctx.from?.id !== this.config.adminId)return;
        
        const ts = formatDateTime(Date.now(), this.localization.getLang());
        
        const rows = await this.db.query(`
            SELECT u.id,u.username,u.first_name,u.lang_code,u.is_vip,u.sub_type,u.joined_at,u.last_active_at,u.monthly_traffic, COUNT(l.id) AS total_actions FROM users u LEFT JOIN activity_logs l ON l.user_id = u.id WHERE u.id != $1 AND u.is_blocked = true GROUP BY u.id ORDER BY u.last_active_at ASC NULLS FIRST LIMIT 50
        `,[Number(this.config.adminId)]);
        
        if(rows.length === 0){
            
            await ctx.reply(`✅ No blocked users found.`);
            return;
            
        }
        
        const lines = rows.map((u:any,i:number)=>{
            
            const name = u.username ? `@${u.username}`:(u.first_name || '-');
            const lastSeen = u.last_active_at ? formatDate(Number(u.last_active_at), this.localization.getLang()) : 'never';
            
            const joined = u.joined_at ? formatDate(Number(u.joined_at), this.localization.getLang()) : '-';
            
            const plan = u.is_vip ? 'VIP' : (u.sub_type || 'free');
            const actions = Number(u.total_actions);
            const trafficMB = (Number(u.monthly_traffic || 0) / 1024 / 1024).toFixed(2);
            
            return(
                `${i + 1}. <code>${u.id}</code> ${name}\n` +
                `   📅 Joined: ${joined} | Last: ${lastSeen}\n` +
                `   📊 Actions: ${actions} | 💾 ${trafficMB}MB | ${plan}`

            );
            
        });
        
        const idList = rows.map((u:any)=>u.id).join('+');

        const msg =             `🚫 <b>Blocked users — ${rows.length} found</b>\n` +
            `🕐 ${ts} IST\n\n` +
            `${lines.join('\n\n')}\n\n` +
            `<b>To delete selected users:</b>\n` +
            `<code>/cleanup_blocked_clean ${idList}</code>\n\n` +
            `<i>Edit IDs as needed, then add "clean" yourself at the end to run it.</i>`;
        for(const chunk of this.splitMessage(msg,4096)){
            
            await ctx.reply(chunk,{parse_mode:'HTML'});
            
        }
        
    }
    
    async handleBlockedClean(ctx:BotContext,args:string):Promise<void>{
        
        if(ctx.from?.id !== this.config.adminId) return;
        
        const parts = args.trim().split(/\s+/);
        const confirm = parts[parts.length -1];
        
        if(confirm !== 'clean'){
            
            await ctx.reply(                `⚠️ Missing confirmation word.\n\n` +
                `Usage: <code>/cleanup_blocked_clean id1+id2+id3 clean</code>`,
                {parse_mode:'HTML'}
            );
            return;
        }
        
        const rawIds = parts[0];
        if(!rawIds){
            
            await ctx.reply(`⚠️ No IDs provided.`, { parse_mode: 'HTML' });
            return;
            
        }
        
        const ids = rawIds.split('+').map(s=>Number(s.trim())).filter(n=>!isNaN(n) && n > 0);
        
        if(ids.length === 0){
            
            await ctx.reply(`⚠️ No valid IDs found in: <code>${rawIds}</code>`, { parse_mode: 'HTML' });
            return;
            
        }
        
        if(ids.includes(this.config.adminId)){
            
            await ctx.reply(`🚫 Admin ID detected in the list. Aborted.`, { parse_mode: 'HTML' });
            return;
            
        }
        
        if(ids.length > MAX_IDS){
            
            await ctx.reply(`⚠️ Too many IDs (max ${MAX_IDS}). Split into batches.`, { parse_mode: 'HTML' });
            return;
            
        }
        
        const stillBlocked = await this.db.query('SELECT id FROM users WHERE id = ANY($1::bigint[]) AND is_blocked = true',[ids]);
        const stillBlockedIds = new Set(stillBlocked.map((r:any)=>Number(r.id)));
        const skipped = ids.filter(id=>!stillBlockedIds.has(id));
        const idsToDelete = ids.filter(id=>stillBlockedIds.has(id));
        
        if(idsToDelete.length === 0){
            
            await ctx.reply(`✅ None of the listed IDs are still blocked — nothing to delete.`, { parse_mode: 'HTML' });
            return;
            
        }
        
        const statusMsg = await ctx.reply(`⏳ Deleting ${idsToDelete.length} users...`);
        const before = await this.db.query(`SELECT id, username, first_name, last_active_at, monthly_traffic, sub_type, is_vip
             FROM users WHERE id = ANY($1::bigint[])`,[idsToDelete]);
        
        const deleted:number[] = [];
        const notFound:number[] = [];
        const failed:Array<{id:number,error:string}> =[];
        
        for(const userId of idsToDelete){
            
            let attempt = 0;
            while(attempt < 3){
                
                try{
                    
                    const res = await this.db.query('DELETE FROM users WHERE id = $1 RETURNING id',[userId]);
                    if(res.length > 0){
                        
                        deleted.push(userId);
                        
                    }else{
                        
                        notFound.push(userId);
                        
                    }
                    
                    break;
                    
                }catch(e:any){
                    
                    attempt++;
                    console.error(`[Cleanup] Delete user ${userId} attempt ${attempt} failed:`, e.message);
                    
                    if(attempt >= 3){
                        
                        failed.push({id:userId,error:e.message});
                        
                    }else{
                        
                        await new Promise(r=>setTimeout(r,500*attempt));
                        
                    }
                    
                }
                
            }
            
        }
        
        await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
        const ts = formatDateTime(Date.now(), this.localization.getLang());
        
        const deletedLines = before.filter((u:any)=>deleted.includes(Number(u.id))).map((u:any)=>{
            
            const name = u.username ? `@${u.username}` : (u.first_name || '-');
            const lastSeen = u.last_active_at ? formatDate(Number(u.last_active_at), this.localization.getLang()) : 'never';
            
            const plan = u.is_vip ? 'VIP' : (u.sub_type || 'free');
            return `  ✅ <code>${u.id}</code> ${name} | Last: ${lastSeen} | ${plan}`;
            
        }).join('\n');
        
        const failedLines = failed.map(f=>`  ❌ <code>${f.id}</code> — ${f.error.substring(0, 80)}`).join('\n');
        
        const notFoundLines = notFound.map(id=>`  ⚪ <code>${id}</code> — not found`).join('\n');
        
        const skippedLines = skipped.map(id=>`  🔓 <code>${id}</code> — no longer blocked, skipped`).join('\n');
        
        let report =             `🚫 <b>BLOCKED CLEANUP COMPLETE</b>\n` +
            `🕐 ${ts} IST\n\n` +
            `✅ Deleted: <b>${deleted.length}</b>\n` +
            `🔓 Skipped (unblocked since list): <b>${skipped.length}</b>\n` +
            `⚪ Not found: <b>${notFound.length}</b>\n` +
            `❌ Failed: <b>${failed.length}</b>\n\n`;
        
        if (deletedLines)  report += `<b>Deleted:</b>\n${deletedLines}\n\n`;
        if (skippedLines)  report += `<b>Skipped:</b>\n${skippedLines}\n\n`;
        if (notFoundLines) report += `<b>Not found:</b>\n${notFoundLines}\n\n`;
        if (failedLines)   report += `<b>Failed:</b>\n${failedLines}\n\n`;
        
        if(deleted.length > 0){
            
            const verify = await this.db.query('SELECT id FROM users WHERE id = ANY($1::bigint[])',[deleted]);
            
            if(verify.length === 0){
                
                report += `✅ <b>Verification passed</b> — all deleted users confirmed gone.`;
                
            }else{
                
                const remaining = verify.map((r:any)=>`<code>${r.id}</code>`).join(', ');
                report += `⚠️ <b>Verification warning</b> — still found in DB: ${remaining}`;
                
            }
            
        }
        
        await ctx.api.sendMessage(this.config.channelLogId,report,{parse_mode:'HTML'}).catch(()=>{});
        
        for(const chunk of this.splitMessage(report,4096)){
            
            await ctx.reply(chunk,{parse_mode:'HTML'});
            
        }
        
        await this.logger.logAction(
            'CleanupCommandHandler',
            ctx.from!,
            'Blocked cleanup executed',
            `Deleted: ${deleted.length} | Skipped: ${skipped.length} | Failed: ${failed.length} | NotFound: ${notFound.length}`,
        );
        
    }
    
    async handleBackfillBlocked(ctx:BotContext):Promise<void>{
        
        if(ctx.from?.id !== this.config.adminId) return;
        
        const users = await this.db.query('SELECT id FROM users WHERE id != $1 AND is_blocked = false',[Number(this.config.adminId)]);
        
        if(users.length === 0){
            
            await ctx.reply(`✅ Nothing to check — everyone is already marked.`);
            return;
            
        }
        
        const statusMsg = await ctx.reply(`⏳ Checking ${users.length} users (this can take a while, throttled to avoid rate limits)...`);
        
        let newlyBlocked = 0;
        let errors = 0;
        
        for(const u of users){
            
            try{
                
                await ctx.api.getChat(Number(u.id));
                
            }catch(e:any){
                
                const code = e?.error_code ?? e?.parameters?.error_code;
                const desc:string = (e?.description || e?.message || '').toLowerCase();
                
                if(code === 403 && desc.includes('blocked')){
                    
                    await this.db.query('UPDATE users SET is_blocked = true WHERE id = $1',[Number(u.id)]);
                    newlyBlocked++;
                    
                }else{
                    
                    errors++;
                    console.error(`[BackfillBlocked] getChat(${u.id}) failed non-block: ${e?.message}`);
                    
                }
                
            }
            
            await new Promise(r=>setTimeout(r,50));
            
        }
        
        await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
        
        const report =             `✅ <b>Backfill complete</b>\n\n` +
            `Checked: <b>${users.length}</b>\n` +
            `Newly marked blocked: <b>${newlyBlocked}</b>\n` +
            `Other errors (skipped, not marked): <b>${errors}</b>`;
        
        await ctx.reply(report,{parse_mode:'HTML'});
        
        await this.logger.logAction(
            'CleanupCommandHandler',
            ctx.from!,
            'Backfill blocked executed',
            `Checked: ${users.length} | Newly blocked: ${newlyBlocked} | Errors: ${errors}`,
        );
        
    }
    
    private splitMessage(text:string,maxLen:number):string[]{
        
        const chunks:string[] = [];
        let current = '';
        
        for(const line of text.split('\n')){
            
            if((current + '\n' + line).length > maxLen){
                
                chunks.push(current);
                current = line;
            }else{
                
                current = current ? current + '\n' + line : line;
                
            }
            
        }
        
        if(current) chunks.push(current);
        return chunks;
        
    }
    
}
