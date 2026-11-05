import { InlineKeyboard }           from 'grammy';
import type { BotContext }          from '../../types/BotContext.js';
import type { IBotConfig }          from '../../config/interfaces/IBotConfig.js';
import type { LocalizationService } from '../../services/LocalizationService.js';
import { LoggerService }            from '../../services/LoggerService.js';
import { SupportRepository }        from '../../database/repositories/SupportRepository.js';

const MAX_CHARS = 1000;

export class SupportCommandHandler {

    private readonly logger: LoggerService;
    private readonly repo:   SupportRepository;

    constructor(
        private readonly config:       IBotConfig,
        private readonly localization: LocalizationService,
    ) {
        this.logger = new LoggerService(config);
        this.repo   = new SupportRepository();
    }

    async handle(ctx: BotContext): Promise<void> {

        ctx.session.step          = 'waiting_for_support_category' as any;
        ctx.session.currentAction = 'idle';

        const i18n       = this.localization.get();
        const categories = i18n.messages.commands.support.categories as Record<string, string>;
        const kb         = new InlineKeyboard();

        for (const [key, label] of Object.entries(categories)) {
            kb.text(label, `support_cat:${key}`).row();
        }

        await ctx.reply(i18n.messages.commands.support.title, { parse_mode: 'HTML', reply_markup: kb });

    }

    async handleCategoryCallback(ctx: BotContext): Promise<void> {

        await ctx.answerCallbackQuery();

        const data     = ctx.callbackQuery?.data || '';
        const category = data.replace('support_cat:', '');

        const i18n       = this.localization.get();
        const categories = i18n.messages.commands.support.categories as Record<string, string>;

        if (!categories[category]) return;

        ctx.session.step = 'waiting_for_support_message' as any;
        (ctx.session.tempParams as any).supportCategory = category;

        await ctx.editMessageText(
            `${categories[category]}\n\n` +
            i18n.messages.commands.support.describe.replace('{{MAX_CHARS}}', String(MAX_CHARS)),
            { parse_mode: 'HTML' },
        );

    }

    async handleMessage(ctx: BotContext): Promise<void> {

        const text = ctx.message?.text?.trim();
        if (!text) return;

        const i18n       = this.localization.get();
        const categories = i18n.messages.commands.support.categories as Record<string, string>;

        if (text.length > MAX_CHARS) {

            await ctx.reply(
                i18n.messages.commands.support.too_long
                    .replace('{{length}}',    String(text.length))
                    .replace('{{MAX_CHARS}}', String(MAX_CHARS)),
                { parse_mode: 'HTML' },
            );

            return;

        }

        const user      = ctx.from!;
        const category  = (ctx.session.tempParams as any).supportCategory as string || 'bug';
        const catLabel  = categories[category] || category;
        const userStr   = user.username
            ? `@${user.username}`
            : `${user.first_name} ${user.last_name || ''}`.trim();

        const session = await this.repo.createSession({
            userId:    user.id,
            username:  user.username   || '',
            firstName: user.first_name || '',
            lastName:  user.last_name  || '',
            category,
        });

        const sentMsg = await ctx.api.sendMessage(
            this.config.botGroupId,
            `🆘 <b>SUPPORT REQUEST</b>\n\n` +
            `📂 <b>Category:</b> ${catLabel}\n` +
            `👤 <b>User:</b> ${userStr} (ID: <code>${user.id}</code>)\n` +
            `🔖 <b>Session:</b> <code>#${session.id}</code>\n\n` +
            `💬 <b>Message:</b>\n${text}\n\n` +
            `<i>Reply to this message to respond directly to the user.</i>`,
            { parse_mode: 'HTML' },
        );

        await this.repo.saveMessage(session.id, user.id, sentMsg.message_id);

        await ctx.reply(
            i18n.messages.commands.support.sent.replace('{{category}}', catLabel),
            { parse_mode: 'HTML' },
        );

        ctx.session.step = 'idle';
        (ctx.session.tempParams as any).supportCategory = undefined;

        await this.logger.logAction(
            'SupportCommandHandler:handleMessage',
            user,
            'Support request created',
            `Category: ${category} | Session: ${session.id}`,
        );

    }

}
