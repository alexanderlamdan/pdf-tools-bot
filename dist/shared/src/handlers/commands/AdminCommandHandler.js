import { DatabaseService } from '../../services/DatabaseService.js';
import { LoggerService } from '../../services/LoggerService.js';
import { LocalizationService } from '../../services/LocalizationService.js';
import { AdminReportService } from '../../services/AdminReportService.js';
import { Keyboards } from '../../services/Keyboards.js';
export class AdminCommandHandler {
    config;
    localization;
    logger;
    db;
    keyboards;
    constructor(config, localization) {
        this.config = config;
        this.localization = localization;
        this.logger = new LoggerService(config);
        this.db = new DatabaseService(this.logger);
        this.keyboards = new Keyboards(localization);
    }
    async handle(ctx) {
        if (ctx.from?.id !== this.config.adminId)
            return;
        const text = ctx.message?.text;
        if (!text)
            return;
        const command = text.split(' ')[0];
        const args = text.substring(command.length).trim();
        switch (command) {
            case '/publish_message_to_english_users':
                await this.broadcast(ctx, args);
                break;
            case '/add_vip':
                await this.addVip(ctx, args);
                break;
            case '/admin_mode_on':
                await this.setAdminMode(ctx, true);
                break;
            case '/admin_mode_off':
                await this.setAdminMode(ctx, false);
                break;
            case '/admin_report':
                await this.sendFullReport(ctx);
                break;
            case '/admin_user':
                await this.sendUserDetails(ctx, args);
                break;
        }
    }
    async sendFullReport(ctx) {
        const statusMsg = await ctx.reply('📊 Generating report...');
        try {
            const reportService = new AdminReportService(this.config, ctx.api);
            await reportService.sendFullReport();
            await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => { });
            await ctx.reply('✅ Report sent to log channel.');
        }
        catch (e) {
            await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => { });
            await ctx.reply(`❌ Report failed: ${e.message}`);
        }
    }
    async sendUserDetails(ctx, args) {
        const targetId = Number(args.trim());
        if (!targetId || isNaN(targetId)) {
            await ctx.reply('⚠️ Usage: <code>/admin_user 123456789</code>', { parse_mode: 'HTML' });
            return;
        }
        try {
            const reportService = new AdminReportService(this.config, ctx.api);
            await reportService.sendUserDetails(targetId);
            await ctx.reply(`✅ Sent to log channel.`);
        }
        catch (e) {
            await ctx.reply(`❌ Failed: ${e.message}`);
        }
    }
    async setAdminMode(ctx, enable) {
        if (enable) {
            ctx.session.adminMode = true;
            ctx.session.simulateUser = false;
            await ctx.reply('🛡 <b>Admin Mode ON</b>\n\nTraffic limits is off. Upload files and test as admin every functionality.\n\nTo turn off admin mode: /admin_mode_off', { parse_mode: 'HTML', reply_markup: this.keyboards.getMainMenu(true) });
        }
        else {
            ctx.session.adminMode = false;
            ctx.session.simulateUser = true;
            await ctx.reply('👤 <b>Simulate User Mode ON</b>\n\nFrom now and on you bot as user.\nTraffic limits are on, buttons and command for admin is hide.\n\nTurn back to admin mode: /admin_mode_on', { parse_mode: 'HTML', reply_markup: this.keyboards.getMainMenu(false) });
        }
        await this.logger.logAction('AdminCommandHandler:setAdminMode', ctx.from, enable ? 'Admin Mode ON' : 'Simulate User Mode ON', `adminMode=${enable} simulateUser=${!enable}`);
    }
    async broadcast(ctx, message) {
        const lang = this.localization.getLang();
        if (!message) {
            await ctx.reply(`⚠️ Insert text after the command.\nExample: <code>/publish_message_to_english_users Hello everybody!</code>`, { parse_mode: 'HTML' });
            return;
        }
        await ctx.reply(`⏳ Starting broadcast for language: <b>English</b>...`, { parse_mode: 'HTML' });
        const ids = await this.db.getUserIdsByLang(lang);
        let success = 0;
        let fail = 0;
        for (const userId of ids) {
            try {
                await ctx.api.sendMessage(userId, message, { parse_mode: 'HTML' });
                success++;
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            catch (e) {
                fail++;
                console.error(`Failed to send to ${userId}`, e);
            }
        }
        await ctx.reply(`✅ Newsletters send!\n\nGet it users: ${success}\nFailed to sent: ${fail}`, { parse_mode: 'HTML' });
    }
    async addVip(ctx, args) {
        const targetId = Number(args.trim());
        if (!targetId || isNaN(targetId)) {
            await ctx.reply('⚠️ Set correct user id.\nExample: <code>/add_vip 123456789</code>', { parse_mode: 'HTML' });
            return;
        }
        try {
            await this.db.setVip(targetId);
            const user = await this.db.getUser(targetId);
            const userLang = user?.langCode || 'en';
            let msg = '';
            if (userLang === 'en') {
                msg = 'Good afternoon, the bot developer has added you as a VIP user. You have been given unlimited bot usage. Thank you for your trust.';
            }
            await ctx.api.sendMessage(targetId, msg);
            await ctx.reply(`✅ User <code>${targetId}</code> now s VIP ang get the notification.`, { parse_mode: 'HTML' });
        }
        catch (e) {
            await ctx.reply(`❌ Error: can't find user or the bot is on blacklist.\n${e.message}`);
        }
    }
}
