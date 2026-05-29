export const notifications = {

	redirect_ru: `👋 Привет! Я заметил, что в твоём Telegram стоит не английский язык.\n\n` +
	`Если тебе удобнее русский — у меня есть отдельный бот для русскоязычных, с тем же самым функционалом один в один:\n\n` +
	`👇 Просто нажми кнопку ниже и не потеряешься.`,

	redirect_ru_button: `🇷🇺 Перейти в русский бот`,

	redirect_he: `👋 שלום! הבחנתי שהשפה בטלגרם שלך מוגדרת לעברית.\n\n` +
	`יש לי בוט ייעודי לדוברי עברית עם בדיוק אותן תכונות:\n\n` +
	`👇 פשוט לחץ על הכפתור למטה.`,

	redirect_he_button: `🇮🇱 עבור לבוט בעברית`,

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

	subscribe_plans_title: `⚡️ <b>Upgrade your PDF Tools Bot</b>\n\n` +
	`<b>Starter — $10/mo</b>\n` +
	`• 24 GB monthly traffic\n` +
	`• Priority queue\n` +
	`• Your own watermark on processed files\n\n` +
	`Secure payment via Creem. Cancel anytime.`,

	subscribe_checkout_loading: `⏳ Generating checkout link...`,

	subscribe_checkout_ready: `🔗 <b>Your checkout link is ready!</b>\n\n` +
	`Click the button below to complete your payment.\n` +
	`After payment you will receive a confirmation in this chat automatically.\n\n` +
	`<i>Link expires in 30 minutes.</i>`,

	subscribe_checkout_error: `❌ Failed to generate checkout link. Please try again later.`,

	subscription_activated: `🎉 <b>Welcome to {{plan}}!</b>\n\n` +
	`Your subscription is now active.\n\n` +
	`{{features}}\n\n` +
	`📅 Started: <b>{{started}}</b>\n` +
	`📅 Valid until: <b>{{expires}}</b>\n\n` +
	`Thank you for supporting PDF Tools Bot! 🙏`,

	subscription_features: {
		starter: `✅ 24 GB monthly traffic\n✅ Priority queue\n✅ No watermark on your files`,
		pro:     `✅ 48 GB monthly traffic\n✅ Premium queue — instant\n✅ Your own branding on files\n✅ Priority support`,
		ultra:   `✅ 200 GB monthly traffic\n✅ No queue — instant processing\n✅ Company watermark on all files\n✅ Dedicated support`,
	},

	subscription_expired: `😔 <b>Your subscription has ended.</b>\n\n` +
	`Your access has been downgraded to the free plan.\n\n` +
	`👉 Tap 👤 <b>My Status</b> to subscribe again.`,

	subscription_expiring_soon: `⚠️ <b>Your subscription expires soon.</b>\n\n` +
	`Your <b>{{plan}}</b> plan ends on <b>{{expires}}</b>.\n\n` +
	`To keep your access, please renew before expiration.\n\n` +
	`👉 Tap 👤 <b>My Status</b> to renew.`,

	subscription_past_due: `⚠️ <b>Payment issue with your subscription.</b>\n\n` +
	`We could not process your payment. Please update your payment method.\n\n` +
	`Your access continues for now but will be suspended if payment fails again.`,

} as const;
