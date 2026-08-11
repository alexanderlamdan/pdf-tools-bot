export const feedback = {

	// {{MAX_CHARS}}
	intro: `💬 <b>Feedback</b>\n\n` +
	`Found a bug? Have an idea? Need something improved?\n\n` +
	`Write your message here.\n\n` +
	`• Maximum: <b>{{MAX_CHARS}}</b> characters\n` +
	`• Long message? Email me: <code>support@lmdnbot.com</code>\n\n` +
	`✍️ Type your feedback:`,

	// {{days}} {{hours}}
	limit_msg: `⏳ <b>You sent feedback recently.</b>\n\n` +
	`You can send another message in <b>{{days}}d {{hours}}h</b>.`,

	// {{length}} {{MAX_CHARS}}
	max_chars_limit: `⚠️ <b>Your message is too long.</b>\n\n` +
	`Current length: <b>{{length}}</b> characters\n` +
	`Maximum allowed: <b>{{MAX_CHARS}}</b> characters\n\n` +
	`For longer messages, email me: <code>support@lmdnbot.com</code>`,

	reply: `❤️ <b>Thank you!</b>\n\n` +
	`I read every message personally.\n` +
	`Your feedback helps me improve the bot and build new features.\n\n` +
	`<i>You can send feedback again in 7 days.</i>`,

} as const;
