export const subscriptions = {

	limit_exceeded: `🚫 <b>Your free traffic has been used up.</b>\n\n` +
	`You've used all <b>8 GB</b> included in the Free plan.\n\n` +
	`🚀 Choose a plan to keep processing PDF files without waiting for the monthly reset.`,

	done_but_exceeded: `✅ <b>Your PDF is ready!</b>\n\n` +
	`🚫 Your free traffic has been used up.\n\n` +
	`To download this file and continue using the bot right away, choose a plan below.`,

	choose_plan: `💳 <b>Choose your plan:</b>`,

	traffic_warning: `⚠️ <b>Your free traffic is running low.</b>\n\n` +
	`Only <b>{{remain}}</b> remaining.\n\n` +
	`Upgrade now to avoid interruptions and keep processing your PDF files.`,

	subscribe_checkout_loading:
	`⏳ <b>Creating your secure payment page...</b>`,

	subscribe_checkout_ready:
	`🔗 <b>Your payment page is ready!</b>\n\n` +
	`Tap the button below to pay.\n\n` +
	`✅ Your plan will be activated automatically after payment.\n` +
	`You do not need to send a receipt or message.\n\n` +
	`<i>⏰ This payment link expires in 30 minutes.</i>`,

	subscribe_checkout_error:
	`❌ <b>We couldn't create the payment page.</b>\n\n` +
	`Please try again in a few minutes.`,

} as const;
