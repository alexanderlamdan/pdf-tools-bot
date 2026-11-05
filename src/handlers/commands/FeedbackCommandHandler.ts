import type { BotContext }          from '../../types/BotContext.js';
import type { IBotConfig }           from '../../config/interfaces/IBotConfig.js';
import type { LocalizationService }  from '../../services/LocalizationService.js';
import { LoggerService }             from '../../services/LoggerService.js';
import { FeedbackRepository }        from '../../database/repositories/FeedbackRepository.js';

const MAX_CHARS = 1000;

export class FeedbackCommandHandler {

    private readonly logger: LoggerService;
    private readonly repo:   FeedbackRepository;

    constructor(
        private readonly config:       IBotConfig,
        private readonly localization: LocalizationService,
    ) {
        this.logger = new LoggerService(config);
        this.repo   = new FeedbackRepository();
    }

    async handle(ctx: BotContext): Promise<void> {

        const userId                = ctx.from!.id;
        const { allowed, remainMs } = await this.repo.canSubmit(userId);
        const i18n                  = this.localization.get();

        if (!allowed) {

            const days  = Math.floor(remainMs / 86_400_000);
            const hours = Math.floor((remainMs % 86_400_000) / 3_600_000);

            await ctx.reply(
                i18n.messages.commands.feedback.limit_msg
                    .replace('{{days}}',  String(days))
                    .replace('{{hours}}', String(hours)),
                { parse_mode: 'HTML' },
            );

            return;

        }

        ctx.session.step = 'waiting_for_feedback' as any;

        await ctx.reply(
            i18n.messages.commands.feedback.intro
                .replace('{{MAX_CHARS}}', String(MAX_CHARS)),
            { parse_mode: 'HTML' },
        );

    }

    async handleMessage(ctx: BotContext): Promise<void> {

        const text = ctx.message?.text?.trim();
        if (!text) return;

        const i18n = this.localization.get();

        if (text.length > MAX_CHARS) {

            await ctx.reply(
                i18n.messages.commands.feedback.max_chars_limit
                    .replace('{{length}}',    String(text.length))
                    .replace('{{MAX_CHARS}}', String(MAX_CHARS)),
                { parse_mode: 'HTML' },
            );

            return;

        }

        const user    = ctx.from!;
        const userStr = user.username ? `@${user.username}` : user.first_name;

        ctx.session.step = 'idle';

        const feedback = await this.repo.submit({
            userId:    user.id,
            username:  user.username   || '',
            firstName: user.first_name || '',
            text,
        });

        await ctx.api.sendMessage(
            this.config.botGroupId,
            `💬 <b>NEW FEEDBACK</b>\n\n` +
            `👤 <b>User:</b> ${userStr} (ID: <code>${user.id}</code>)\n` +
            `🔖 <b>ID:</b> <code>#${feedback.id}</code>\n\n` +
            `📝 <b>Message:</b>\n${text}`,
            { parse_mode: 'HTML' },
        );

        await ctx.reply(i18n.messages.commands.feedback.reply, { parse_mode: 'HTML' });

        await this.logger.logAction(
            'FeedbackCommandHandler:handleMessage',
            user,
            'feedback submitted',
            `ID: ${feedback.id} | Length: ${text.length}`,
        );

    }

}
