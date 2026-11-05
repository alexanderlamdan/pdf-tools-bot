import type { IBotConfig }      from '../../config/interfaces/IBotConfig.js';
import { DatabaseService }       from '../../services/DatabaseService.js';
import { LoggerService }         from '../../services/LoggerService.js';
import { LocalizationService }   from '../../services/LocalizationService.js';
import { AdminReportService }    from '../../services/AdminReportService.js';
import type { BotContext }       from '../../types/BotContext.js';
import { Keyboards }             from '../../services/Keyboards.js';
import { Postgresql } from '../../database/Postgresql.js';

export class AdminCommandHandler {

    private readonly logger:    LoggerService;
    private readonly db:        DatabaseService;
    private readonly keyboards: Keyboards;

    constructor(
        private readonly config:       IBotConfig,
        private readonly localization: LocalizationService,
    ) {
        this.logger    = new LoggerService(config);
        this.db        = new DatabaseService(this.logger);
        this.keyboards = new Keyboards(localization);
    }

    async handle(ctx: BotContext): Promise<void> {

        if (ctx.from?.id !== this.config.adminId) return;

        const text = ctx.message?.text;
        if (!text) return;

        const command = text.split(' ')[0];
        const args    = text.substring(command.length).trim();

        switch (command) {

            case '/post_news':
                await this.broadcast(ctx, args);
                break;
            case '/add_vip':
                await this.addVip(ctx, args);
                break;
            case '/admin_mode_on':
                await this.setAdminMode(ctx, true);
                break;
            case '/admin_mode_off':
                await this.setAdminMode(ctx, false, args);
                break;
            case '/admin_report':
                await this.sendFullReport(ctx);
                break;
            case '/admin_user':
                await this.sendUserDetails(ctx, args);
                break;
            case '/reset_traffic_all':
                await this.resetTrafficAll(ctx);
                break;
            case '/reset_traffic_user':
                await this.resetTrafficUser(ctx, args);
                break;
        }

    }

    private async sendFullReport(ctx: BotContext): Promise<void> {

        const statusMsg = await ctx.reply('📊 Generating report...');

        try {

            const reportService = new AdminReportService(this.config, ctx.api);
            await reportService.sendFullReport();
            await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
            await ctx.reply('✅ Report sent to log channel.');

        } catch (e: any) {

            await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
            await ctx.reply(`❌ Report failed: ${e.message}`);

        }

    }

    private async sendUserDetails(ctx: BotContext, args: string): Promise<void> {

        const targetId = Number(args.trim());

        if (!targetId || isNaN(targetId)) {
            await ctx.reply('⚠️ Usage: <code>/admin_user 123456789</code>', { parse_mode: 'HTML' });
            return;
        }

        try {

            const reportService = new AdminReportService(this.config, ctx.api);
            await reportService.sendUserDetails(targetId);
            await ctx.reply('✅ Sent to log channel.');

        } catch (e: any) {

            await ctx.reply(`❌ Failed: ${e.message}`);

        }

    }

    private async setAdminMode(ctx: BotContext, enable: boolean, planArg?: string): Promise<void> {

        const VALID_PLANS = ['free','starter','pro','ultra','business'] as const;

        if (enable) {

            ctx.session.adminMode    = true;
            ctx.session.simulateUser = false;
            await ctx.reply(
                '🛡 <b>Admin Mode ON</b>\n\nTraffic limits is off. Upload files and test as admin every functionality.\n\nTo turn off admin mode: /admin_mode_off',
                { parse_mode: 'HTML', reply_markup: this.keyboards.getMainMenu(true) },
            );

        } else {

            const requested = (planArg || 'free').trim().toLowerCase();
            const plan = (VALID_PLANS as readonly string[]).includes(requested) ? requested as typeof VALID_PLANS[number] : 'free';

            ctx.session.adminMode     = false;
            ctx.session.simulateUser  = true;
            ctx.session.simulatedPlan = plan;

            const invalidNote = (planArg && plan !== requested)
                ? `\n\n⚠️ "${planArg}" is not a valid plan — using "free" instead. Valid: ${VALID_PLANS.join(', ')}.`
                : '';

            await ctx.reply(
                `👤 <b>Simulate User Mode ON</b> (plan: <b>${plan}</b>)\n\nFrom now and on you bot as a ${plan} user.\nTraffic limits are on, buttons and command for admin is hide.\n\nSimulate a different plan: /admin_mode_off {plan}\nTurn back to admin mode: /admin_mode_on${invalidNote}`,
                { parse_mode: 'HTML', reply_markup: this.keyboards.getMainMenu(false) },
            );

        }

        await this.logger.logAction(
            'AdminCommandHandler:setAdminMode',
            ctx.from!,
            enable ? 'Admin Mode ON' : 'Simulate User Mode ON',
            `adminMode=${enable} simulateUser=${!enable} simulatedPlan=${enable ? '-' : ctx.session.simulatedPlan}`,
        );

    }

    private async broadcast(ctx: BotContext, message: string): Promise<void> {

        const lang = this.localization.getLang();

        if (!message) {
            await ctx.reply(
                `⚠️ Insert text after the command.\nExample: <code>/publish_message_to_english_users Hello everybody!</code>`,
                { parse_mode: 'HTML' },
            );
            return;
        }

        await ctx.reply(`⏳ Starting broadcast for language: <b>${lang}</b>...`, { parse_mode: 'HTML' });

        const ids     = await this.db.getUserIdsByLang(lang);
        let success   = 0;
        let fail      = 0;

        for (const userId of ids) {
            try {
                await ctx.api.sendMessage(userId, message, { parse_mode: 'HTML' });
                success++;
                await new Promise(resolve => setTimeout(resolve, 50));
            } catch (e) {
                fail++;
                console.error(`Failed to send to ${userId}`, e);
            }
        }

        await ctx.reply(
            `✅ Newsletters send!\n\nGet it users: ${success}\nFailed to sent: ${fail}`,
            { parse_mode: 'HTML' },
        );

    }

    private async addVip(ctx: BotContext, args: string): Promise<void> {

        const targetId = Number(args.trim());

        if (!targetId || isNaN(targetId)) {
            await ctx.reply('⚠️ Set correct user id.\nExample: <code>/add_vip 123456789</code>', { parse_mode: 'HTML' });
            return;
        }

        try {

            await this.db.setVip(targetId);

            await ctx.api.sendMessage(
                targetId,
                this.localization.get().messages.notifications.vip_notification,
                { parse_mode: 'HTML' },
            );

            await ctx.reply(`✅ User <code>${targetId}</code> is now VIP and got the notification.`, { parse_mode: 'HTML' });

        } catch (e: any) {

            await ctx.reply(`❌ Error: can't find user or the bot is on blacklist.\n${e.message}`);

        }

    }
    
    private async resetTrafficAll(ctx:BotContext):Promise<void>{
        
        const statusMsg = await ctx.reply('⏳ Resetting traffic for all users...');
        
        try{
            const pg  = Postgresql.getInstance();
            const users = await pg.query(`SELECT id, username, first_name, monthly_traffic, lang_code FROM users`);
            
            if(users.length === 0){
                
                await ctx.api.deleteMessage(ctx.chat!.id,statusMsg.message_id).catch(()=>{});
                await ctx.reply('✅ No users to reset.');
                return;
                
            }
            
            const ids = users.map((u:any)=>u.id);
            await pg.query(`UPDATE users SET monthly_traffic = 0 WHERE id = ANY($1::bigint[])`,[ids]);
            
            const msg = (this.localization.get().messages as any)?.notifications?.traffic_reset_notification as string ?? '';
            
            let notified = 0;
            
            for(const user of users){
                
                if(msg){
                    
                    try{
                        
                        await ctx.api.sendMessage(Number(user.id), msg, { parse_mode: 'HTML' });
                        notified++;
                        await new Promise(r => setTimeout(r, 100));
                        
                    }catch{}
                    
                }
                
            }
            
            await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
            await ctx.reply(
                `✅ <b>Traffic reset complete</b>\n\n` +
                `👥 Reset: <b>${users.length}</b> users\n` +
                `📨 Notified: <b>${notified}</b> users`,
                { parse_mode: 'HTML' },
            );
 
            await this.logger.logAction(
                'AdminCommandHandler:resetTrafficAll',
                ctx.from!,
                'Reset traffic all',
                `Reset: ${users.length} | Notified: ${notified}`,
            );
            
        }catch(e:any){
            
            await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
            await ctx.reply(`❌ Failed: ${e.message}`);
            
        }
        
    }
    
    private async resetTrafficUser(ctx: BotContext, args: string): Promise<void> {
 
        const targetId = Number(args.trim());
 
        if (!targetId || isNaN(targetId)) {
            await ctx.reply('⚠️ Usage: <code>/reset_traffic_user 123456789</code>', { parse_mode: 'HTML' });
            return;
        }
 
        try {
 
            const pg    = Postgresql.getInstance();
            const users = await pg.query(
                `SELECT id, username, first_name, monthly_traffic, lang_code FROM users WHERE id = $1`,
                [targetId],
            );
 
            if (users.length === 0) {
                await ctx.reply(`❌ User <code>${targetId}</code> not found.`, { parse_mode: 'HTML' });
                return;
            }
 
            await pg.query(
                `UPDATE users SET monthly_traffic = 0 WHERE id = $1`,
                [targetId],
            );
 
            const msg      = (this.localization.get().messages as any)?.notifications?.traffic_reset_notification as string ?? '';
            let   notified = false;
 
            if (msg) {
                try {
                    await ctx.api.sendMessage(targetId, msg, { parse_mode: 'HTML' });
                    notified = true;
                } catch {}
            }
 
            await ctx.reply(
                `✅ <b>Traffic reset</b> for user <code>${targetId}</code>\n` +
                `📨 Notified: <b>${notified ? 'yes' : 'no (blocked or not started)'}</b>`,
                { parse_mode: 'HTML' },
            );
 
            await this.logger.logAction(
                'AdminCommandHandler:resetTrafficUser',
                ctx.from!,
                'Reset traffic user',
                `UserID: ${targetId} | Notified: ${notified}`,
            );
 
        } catch (e: any) {
            await ctx.reply(`❌ Failed: ${e.message}`);
        }
 
    }
    
}
