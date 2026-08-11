export const packages_traffic = {

	package_checkout_loading:
	`⏳ <b>Creating your secure payment page...</b>`,

	package_checkout_ready:
	`🔗 <b>Your payment page is ready!</b>\n\n` +
	`Tap the button below to pay.\n\n` +
	`✅ Your traffic package will be added to your account automatically after payment.\n` +
	`You do not need to send a receipt or message.\n\n` +
	`<i>⏰ This payment link expires in 30 minutes.</i>`,

	package_checkout_error:
	`❌ <b>We couldn't create the payment page.</b>\n\n` +
	`Please try again in a few minutes.`,

	package_payment_not_available: `⚠️ <b>This payment method doesn't support the selected package.</b>\n\n` +
	`Please choose another payment method or a different package.`,

	package_menu_title: `📦 <b>One-time traffic packages</b>\n\n` +
	`Pick a package — never expires, used only after your regular quota runs out.`,

	package_purchased: `✅ <b>Payment received!</b>\n\n` +
	`{{gb}} GB of traffic added to your account.\n\n` +
	`💵 Charged: \${{price}}\n\n` +
	`This traffic doesn't expire and won't be reset — it's used only once your regular quota runs out.`,

	package_next: `➡️ Next`,

	package_back: `⬅️ Back`,

} as const;
