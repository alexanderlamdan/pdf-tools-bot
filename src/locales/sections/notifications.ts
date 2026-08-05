export const notifications = {

	redirect_ru: `👋 Привет!\n\n` +
	`Я заметил, что язык твоего Telegram — русский.\n\n` +
	`Для тебя у меня есть отдельная русскоязычная версия бота с теми же функциями, тарифами и возможностями.\n\n` +
	`👇 Просто нажми кнопку ниже и продолжай пользоваться ботом на русском языке.`,

	redirect_ru_button: `🇷🇺 Перейти в русский PDF Tools Bot`,

	redirect_he: `👋 שלום!\n\n` +
	`שמתי לב ששפת הטלגרם שלך היא עברית.\n\n` +
	`יש לי גרסה ייעודית בעברית עם אותן היכולות, אותן התוכניות ואותן האפשרויות.\n\n` +
	`👇 פשוט לחץ על הכפתור למטה כדי להמשיך בעברית.`,

	redirect_he_button: `🇮🇱 לעבור לבוט בעברית`,

	feedback_intro: `💬 <b>Feedback</b>\n\n` +
	`Found a bug? Have an idea? Need something improved?\n\n` +
	`Write your message here.\n\n` +
	`• Maximum: <b>{{MAX_CHARS}}</b> characters\n` +
	`• Long message? Email me: <code>support@lmdnbot.com</code>\n\n` +
	`✍️ Type your feedback:`,

	feedback_limit_msg: `⏳ <b>You sent feedback recently.</b>\n\n` +
	`You can send another message in <b>{{days}}d {{hours}}h</b>.`,

	feedback_max_chars_limit: `⚠️ <b>Your message is too long.</b>\n\n` +
	`Current length: <b>{{length}}</b> characters\n` +
	`Maximum allowed: <b>{{MAX_CHARS}}</b> characters\n\n` +
	`For longer messages, email me: <code>support@lmdnbot.com</code>`,

	feedback_reply: `❤️ <b>Thank you!</b>\n\n` +
	`I read every message personally.\n` +
	`Your feedback helps me improve the bot and build new features.\n\n` +
	`<i>You can send feedback again in 7 days.</i>`,

	support_title: `🆘 <b>Support</b>\n\n` +
	`What do you need help with?`,

	support_categories: {
		business: '🏢 Business & Partnerships',
		privacy: '🔒 Privacy & Security',
		payment: '💳 Payments & Plans',
		bug: '🐛 Report a Bug',
	},

	support_describe: `✍️ <b>Describe your request</b>\n\n` +
	`• Maximum: <b>{{MAX_CHARS}}</b> characters\n` +
	`• Longer message? Email me: <code>support@lmdnbot.com</code>\n\n` +
	`I'm happy to help.`,

	support_too_long: `⚠️ <b>Your message is too long.</b>\n\n` +
	`Current length: <b>{{length}}</b> characters\n` +
	`Maximum allowed: <b>{{MAX_CHARS}}</b> characters\n\n` +
	`For longer messages, email me: <code>support@lmdnbot.com</code>`,

	support_sent: `✅ <b>Your request has been sent.</b>\n\n` +
	`📂 <b>Topic:</b> {{category}}\n\n` +
	`I'll reply within <b>24 hours</b>.\n\n` +
	`<i>Need help sooner? Email me at <code>support@lmdnbot.com</code>.</i>`,

	support_closed: `✅ <b>Support request closed.</b>\n\n` +
	`Thank you for contacting me.\n\n` +
	`Need help again? Just use /support anytime.`,

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

	subscribe_plans_title: `🚀 <b>Choose a plan that fits your workflow</b>\n\n` +
	`⚡ <b>Starter — $10/month</b>\n` +
	`• 500 GB of traffic every month\n` +
	`• Up to 50 pages per Long Image\n` +
	`• Faster processing during busy hours\n` +
	`• No bot watermark\n\n` +
	`🔒 Secure payment.\n` +
	`❌ Cancel anytime.`,

	subscribe_checkout_loading: `⏳ <b>Preparing your secure checkout...</b>`,

	subscribe_checkout_ready: `🔗 <b>Your checkout is ready!</b>\n\n` +
	`Click the button below to complete your payment.\n\n` +
	`✅ Your subscription will be activated automatically after payment.\n` +
	`You don't need to send anything manually.\n\n` +
	`<i>⏰ This link expires in 30 minutes.</i>`,

	subscribe_checkout_error: `❌ <b>Couldn't create a checkout link.</b>\n\n` +
	`Please try again in a few minutes.`,

	subscription_activated: `🎉 <b>Welcome to the {{plan}} plan!</b>\n\n` +
	`Your subscription is now active.\n\n` +
	`🌟 You now have:\n` +
	`{{features}}\n\n` +
	`📅 <b>Started:</b> {{started}}\n` +
	`📅 <b>Valid until:</b> {{expires}}\n\n` +
	`❤️ Thank you for supporting PDF Tools Bot!`,

	subscription_features: {
		starter: `📊 500 GB of PDF processing every month (resets monthly)
		✅ Starter access across all supported PDF tools
		📈 Higher limits than the Free plan
		🔄 Convert PDFs to multiple formats
		🛠 Edit, optimize, and customize PDFs
		🔐 Secure password-protected file sharing
		🖋 Personalize PDFs with your own watermark, metadata, and links
		⭐ Includes future Starter features automatically`,

		pro: ` 📊 1000 GB of PDF processing every month (resets monthly)
		✅ Pro access across all supported PDF tools
		📈 Even higher limits than the Starter plan
		🔄 Convert PDFs to multiple formats
		🛠 Edit, optimize, and customize PDFs
		🔐 Secure password-protected file sharing with extended storage
		🖋 Personalize PDFs with your own watermark, metadata, and links
		⭐ Includes new Pro features as they become available`,

		ultra: ` 📊 2000 GB of PDF processing every month (resets monthly)
		✅ Ultra access across all supported PDF tools
		🏆 Maximum limits across all PDF tools
		🔄 Convert PDFs to virtually any supported format
		🛠 Edit, optimize, and customize PDFs without compromise
		🔐 Advanced secure file sharing with extended storage and one-time passwords
		🖋 Personalize PDFs with your own watermark, metadata, and links
		⭐ Includes new Ultra features as they become available`,

		business: `📊 5000 GB of PDF processing every month (resets monthly)
		✅ Everything included in Ultra
		🏆 Maximum limits across every PDF tool
		🏢 Built for businesses and high-volume PDF workflows
		🔄 Convert PDFs to virtually any supported format
		🛠 Edit, optimize, and customize PDFs without compromise
		🔐 Advanced secure file sharing with extended storage and one-time passwords
		🖋 Personalize PDFs with your own watermark, metadata, and links
		🎧 Direct technical support from the developer
		🖥 Help with deployment and integration on your own server (available on request)
		⭐ Priority access to new Business features as they become available`,
	},

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

	plan_not_available: `⚠️ <b>This plan isn't available yet.</b>\n\n` +
	`Please choose another plan.`,

	period_not_available: `⚠️ <b>This billing period isn't available yet.</b>\n\n` +
	`Please choose a different option.`,

	payments_not_available: `⚠️ <b>Payments aren't available yet.</b>\n\n` +
	`I'm still setting up payments for this bot.\n` +
	`Please check back soon.`,

	current_payment_not_available: `⚠️ <b>This payment method doesn't support the selected plan.</b>\n\n` +
	`Please choose another payment method or a different plan.`,

	package_menu_title: `📦 <b>One-time traffic packages</b>\n\n` +
	`Pick a package — never expires, used only after your regular quota runs out.`,

	package_purchased: `✅ <b>Payment received!</b>\n\n` +
	`{{gb}} GB of traffic added to your account.\n\n` +
	`💵 Charged: \${{price}}\n\n` +
	`This traffic doesn't expire and won't be reset — it's used only once your regular quota runs out.`,

	package_next: `➡️ Next`,

	package_back: `⬅️ Back`,

} as const;
