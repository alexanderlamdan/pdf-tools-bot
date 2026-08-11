export const notifications = {

	support_reply_from_dev: `💬 <b>Reply from the developer</b>\n\n{{text}}`,

	vip_notification: `🌟 <b>VIP access activated!</b>\n\n` +
	`I've added your account to the VIP plan.\n\n` +
	`♾️ You now have unlimited access to all bot features.\n\n` +
	`Thank you for your support and trust! ❤️`,

	traffic_reset_notification: `♻️ <b>Your monthly free traffic has been reset!</b>\n\n` +
	`🎉 You have <b>8 GB</b> of free traffic available again.\n\n` +
	`Thank you for using PDF Tools Bot! ❤️\n\n` +
	`Need more traffic?\n` +
	`Upgrade to get:\n` +
	`• More monthly traffic\n` +
	`• No bot watermark on Long Images\n` +
	`• Priority processing\n\n` +
	`👉 Tap 👤 <b>My Account</b> to compare all plans.`,

	images_reset_notification: `♻️ <b>Your weekly Images to PDF quota has been reset!</b>\n\n` +
	`🎉 Your photo limit is available again.\n\n` +
	`Thank you for using PDF Tools Bot! ❤️\n\n` +
	`👉 Tap 👤 <b>My Account</b> to see your new limit, or upgrade for more.`,

	subscription_activated: `🎉 <b>Welcome to the {{plan}} plan!</b>\n\n` +
	`Your subscription is now active.\n\n` +
	`🌟 You now have:\n` +
	`{{features}}\n\n` +
	`📅 <b>Started:</b> {{started}}\n` +
	`📅 <b>Valid until:</b> {{expires}}\n\n` +
	`❤️ Thank you for supporting PDF Tools Bot!`,

	subscription_expired: `😔 <b>Your subscription has expired.</b>\n\n` +
	`Your account has been switched back to the <b>Free</b> plan.\n\n` +
	`👉 Tap 👤 <b>My Account</b> to choose a new plan.`,

	subscription_expiring_soon: `⏰ <b>Your subscription will expire soon.</b>\n\n` +
	`Your <b>{{plan}}</b> plan ends on <b>{{expires}}</b>.\n\n` +
	`Renew now to keep your benefits without interruption.\n\n` +
	`👉 Tap 👤 <b>My Account</b> to renew.`,

	subscription_past_due: `⚠️ <b>There was a problem processing your payment.</b>\n\n` +
	`Please update your payment method to keep your subscription active.\n\n` +
	`Your access is still active for now, but it may be suspended if the next payment also fails.\n\n` +
	`👉 Tap 👤 <b>My Account</b> to update your subscription.`,

} as const;
