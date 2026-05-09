
export const messages = {

	feedback_intro: `💬 <b>Feedback</b>\n\n` +
	`Share your thoughts, suggestions or feature requests.\n\n` +
	`• Maximum <b>{{MAX_CHARS}}</b> characters\n` +
	`• For longer messages: <code>support@lmdnbot.com</code>\n\n` +
	`✍️ Write your feedback:`,

	feedback_limit_msg: `⏳ <b>You've already submitted feedback recently.</b>\n\n` +
	`You can submit again in <b>{{days}}d {{hours}}h</b>.`,

	feedback_max_chars_limit: `⚠️ Too long — <b>{{length}}</b> characters.\n` +
	`Please keep it under <b>{{MAX_CHARS}}</b> characters,\n` +
	`or send longer feedback to <code>support@lmdnbot.com</code>`,

	feedback_reply: `✅ <b>Thank you for your feedback!</b>\n\n` +
	`We read every message and use it to improve the bot.\n\n` +
	`<i>You can submit feedback again in 7 days.</i>`,

	support_title: `🆘 <b>Support</b>\n\nPlease select the topic of your request:`,

	support_categories: {
		business: '🏢 Business inquiry',
		privacy:  '🔒 Data & Privacy',
		payment:  '💳 Payment & Subscription',
		bug:      '🐛 Bug Report',
	},

	support_describe: `✍️ <b>Please describe your request</b>\n\n` +
	`Maximum <b>{{MAX_CHARS}}</b> characters.\n` +
	`For longer messages, email us at <code>support@lmdnbot.com</code>`,

	support_too_long: `⚠️ Your message is too long (<b>{{length}}</b> characters).\n` +
	`Please keep it under <b>{{MAX_CHARS}}</b> characters,\n` +
	`or email us at <code>support@lmdnbot.com</code>`,

	support_sent: `✅ <b>Your request has been sent to the developer.</b>\n\n` +
	`📂 Topic: {{category}}\n\n` +
	`We will get back to you within <b>24 hours</b>.\n\n` +
	`<i>For urgent matters, email us at <code>support@lmdnbot.com</code></i>`,

	support_closed: `✅ <b>Your support session has been closed.</b>\n\n` +
	`Thank you for contacting us.\n` +
	`Feel free to reach out again anytime via /support.`,

	support_reply_from_dev: `💬 <b>Response from developer:</b>\n\n{{text}}`,


	vip_notification: `🌟 <b>You've been granted VIP access!</b>\n\n` +
	`The bot developer has added you as a VIP user.\n` +
	`You now have unlimited bot usage.\n\n` +
	`Thank you for your trust. 🙏`,

	traffic_reset_notification: `♻️ <b>Your traffic limit has been reset!</b>\n\n` +
	`You now have <b>2 GB</b> of free traffic again.\n\n` +
	`Thank you for using PDF Tools Bot! 🙏\n\n` +
	`If you find yourself hitting the limit often — consider one of our plans. ` +
	`More traffic, your own watermark and priority queue.\n\n` +
	`👉 Tap 👤 <b>My Status</b> to view available plans.`,

} as const;
