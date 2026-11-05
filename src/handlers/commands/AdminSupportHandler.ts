import type { BotContext }          from '../../types/BotContext.js';
import type { IBotConfig }           from '../../config/interfaces/IBotConfig.js';
import type { LocalizationService }  from '../../services/LocalizationService.js';
import { LoggerService }             from '../../services/LoggerService.js';
import { SupportRepository }         from '../../database/repositories/SupportRepository.js';

export class AdminSupportHandler {

    private readonly logger: LoggerService;
    private readonly repo:   SupportRepository;

    constructor(
        private readonly config:       IBotConfig,
        private readonly localization: LocalizationService,
    ) {
        this.logger = new LoggerService(config);
        this.repo   = new SupportRepository();
    }

    async handleOpenChat(ctx: BotContext): Promise<void> {

        if (!this.isAdmin(ctx)) return;

        const sessions = await this.repo.getActiveSessions();

        if (sessions.length === 0) {
            await ctx.reply(this.localization.get().messages.admin.no_active_chats);
            return;
        }

        const categories = this.localization.get().messages.commands.support.categories as Record<string, string>;
        const now        = Date.now();

        const lines = sessions.map((s, i) => {

            const userStr  = s.username ? `@${s.username}` : `${s.firstName} ${s.lastName || ''}`.trim();
            const catLabel = categories[s.category] || s.category;
            const age      = this.formatAge(now - s.createdAt);

            return (
                `${i + 1}. ${userStr} (ID: <code>${s.userId}</code>)\n` +
                `   📂 ${catLabel} · ⏱ ${age} ago\n` +
                `   /close-chat ${s.username || s.userId}`
            );

        });

        await ctx.reply(
            `🟢 <b>Active support chats (${sessions.length}):</b>\n\n` +
            lines.join('\n\n') +
            `\n\n<i>Go to the support group and reply to any message to respond to the user.</i>`,
            { parse_mode: 'HTML' },
        );

    }

    async handleCloseChat(ctx: BotContext, args: string): Promise<void> {

        if (!this.isAdmin(ctx)) return;

        const identifier = args.trim();

        if (!identifier) {
            await ctx.reply(
                '⚠️ Usage:\n' +
                '<code>/close-chat @username</code>\n' +
                '<code>/close-chat 123456789</code>',
                { parse_mode: 'HTML' },
            );
            return;
        }

        const session = await this.repo.findSessionByUserIdentifier(identifier);

        if (!session) {
            await ctx.reply(
                `❌ No active session found for <code>${identifier}</code>`,
                { parse_mode: 'HTML' },
            );
            return;
        }

        await this.repo.closeSession(session.id);

        const categories = this.localization.get().messages.commands.support.categories as Record<string, string>;
        const userStr    = session.username
            ? `@${session.username}`
            : `${session.firstName} ${session.lastName || ''}`.trim();

        try {

            await ctx.api.sendMessage(
                session.userId,
                this.localization.get().messages.commands.support.closed,
                { parse_mode: 'HTML' },
            );

        } catch {
            console.warn(`[AdminSupportHandler] Could not notify user ${session.userId} — may have blocked the bot`);
        }

        await ctx.reply(
            `✅ Session <code>#${session.id}</code> closed for ${userStr} (ID: <code>${session.userId}</code>)\n` +
            `📂 Topic: ${categories[session.category] || session.category}`,
            { parse_mode: 'HTML' },
        );

        await this.logger.logAction(
            'AdminSupportHandler',
            ctx.from!,
            'Support session closed',
            `User: ${session.userId} | Session: ${session.id} | Category: ${session.category}`,
        );

    }

    async handleAdminReply(ctx: BotContext): Promise<void> {

        if (!this.isAdmin(ctx)) return;

        const replyTo = ctx.message?.reply_to_message;
        if (!replyTo) return;

        const result = await this.repo.findUserByAdminMsg(replyTo.message_id);
        if (!result) return;

        const replyText = ctx.message?.text;
        if (!replyText) return;

        try {

            await ctx.api.sendMessage(
                result.userId,
                this.localization.get().messages.notifications.support_reply_from_dev
                    .replace('{{text}}', replyText),
                { parse_mode: 'HTML' },
            );

            await ctx.react('👍').catch(async () => {

                await ctx.reply(this.localization.get().messages.admin.reply_sent).catch(() => {});

            });

            await this.logger.logAction(
                'AdminSupportHandler',
                ctx.from!,
                'Support reply sent',
                `To user: ${result.userId} | Session: ${result.sessionId}`,
            );

        } catch (e: any) {

            await ctx.reply(
                `❌ Failed to send to user <code>${result.userId}</code>\n` +
                `They may have blocked the bot.\n${e.message}`,
                { parse_mode: 'HTML' },
            );

        }

    }

    async handleMessage(ctx: BotContext, args: string): Promise<void> {

        if (!this.isAdmin(ctx)) return;

        const parts  = args.trim().split(/\s+/);
        const userId = parseInt(parts[0], 10);
        const text   = parts.slice(1).join(' ').trim();

        if (!userId || isNaN(userId) || !text){
            await ctx.reply(
                '⚠️ Usage:\n' +
                '<code>/message 123456789 Your text here</code>',
                { parse_mode: 'HTML' },
            );
            return;
        }

        try{

            await ctx.api.sendMessage(userId, text, { parse_mode: 'HTML' });

            await ctx.reply(
                `✅ Message sent to <code>${userId}</code>:\n\n${text}`,
                { parse_mode: 'HTML' },
            );

            await this.logger.logAction(
                'AdminSupportHandler',
                ctx.from!,
                'Admin initiated message',
                `To user: ${userId} | Text: ${text.slice(0, 100)}`,
            );

        }catch(e: any){

            await ctx.reply(
                `❌ Failed to send to <code>${userId}</code>\n` +
                `User may have blocked the bot.\n<code>${e.message}</code>`,
                { parse_mode: 'HTML' },
            );

        }

    }

    private isAdmin(ctx: BotContext): boolean {
        return ctx.from?.id === this.config.adminId;
    }

    private formatAge(ms: number): string {

        const days    = Math.floor(ms / 86_400_000);
        const hours   = Math.floor(ms / 3_600_000);
        const minutes = Math.floor(ms / 60_000);

        if (days > 0)    return `${days}d`;
        if (hours > 0)   return `${hours}h`;
        return `${minutes}m`;

    }

}
