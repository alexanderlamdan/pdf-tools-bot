// Пользовательская часть /support. Ответ дева (push, приходит асинхронно)
// живёт в buttons/notifications.ts. Админская часть (/open_chat) — в
// buttons/admin.ts, не тут.

export const support = {

	title: `🆘 <b>Support</b>\n\n` +
	`What do you need help with?`,

	categories: {
		business: '🏢 Business & Partnerships',
		privacy: '🔒 Privacy & Security',
		payment: '💳 Payments & Plans',
		bug: '🐛 Report a Bug',
	},

	// {{MAX_CHARS}}
	describe: `✍️ <b>Describe your request</b>\n\n` +
	`• Maximum: <b>{{MAX_CHARS}}</b> characters\n` +
	`• Longer message? Email me: <code>support@lmdnbot.com</code>\n\n` +
	`I'm happy to help.`,

	// {{length}} {{MAX_CHARS}}
	too_long: `⚠️ <b>Your message is too long.</b>\n\n` +
	`Current length: <b>{{length}}</b> characters\n` +
	`Maximum allowed: <b>{{MAX_CHARS}}</b> characters\n\n` +
	`For longer messages, email me: <code>support@lmdnbot.com</code>`,

	// {{category}}
	sent: `✅ <b>Your request has been sent.</b>\n\n` +
	`📂 <b>Topic:</b> {{category}}\n\n` +
	`I'll reply within <b>24 hours</b>.\n\n` +
	`<i>Need help sooner? Email me at <code>support@lmdnbot.com</code>.</i>`,

	closed: `✅ <b>Support request closed.</b>\n\n` +
	`Thank you for contacting me.\n\n` +
	`Need help again? Just use /support anytime.`,

} as const;
