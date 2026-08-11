export const images_to_pdf = {

	buttons: {
		btn_images_execute: '✅ Create PDF',
	},

	images_rule: `🖼 <b>Images to PDF</b>\n\n` +
	`📋 <b>Your rules:</b>\n` +
	`• Formats: <b>{{formats}}</b>\n` +
	`• Up to <b>{{limit}}</b> images a week\n` +
	`• Used so far: <b>{{used}}/{{limit}}</b>\n` +
	`• Send them {{method}}{{watermark_note}}\n\n` +
	`📊 <b>Limits by plan:</b>\n` +
	`🆓 Free — 15/week, JPG/PNG only\n` +
	`⚡ Starter — 25/week, JPG/PNG only\n` +
	`💎 Pro — 50/week, JPG/PNG +WEBP, as document (file) only\n` +
	`🏢 Ultra — 100/week, JPG/PNG/WEBP +HEIC, as document (file) only\n` +
	`💵 Business — 300/week, JPG/PNG/WEBP/HEIC +GIF/DNG, as document (file) only\n\n` +
	`📤 Send me your images now, one by one.`,

	images_use_document_instead: `⚠️ <b>Your plan gives you full quality — don't waste it.</b>\n\n` +
	`Sending it as a photo lets Telegram compress it first.\n` +
	`Send it as a <b>file</b> instead, and you'll keep full quality.`,

	// {{count}}
	images_added: `✅ <b>Photo added.</b> Total: <b>{{count}}</b>\n\n` +
	`Send more, or tap "Create PDF" when you're done.`,

	converting_images: `🖼 <b>I'm turning your photos into a PDF...</b>`,

	success_images_to_pdf: `✅ <b>Your PDF is ready!</b>`,

	errors: {

		images_document_not_available: `⚠️ <b>Sending this as a file isn't available on your plan.</b>\n\n` +
		`Send your images as regular photos instead, or upgrade for more formats and full quality.`,

		images_format_not_available: `⚠️ <b>This format isn't available on your plan.</b>\n\n` +
		`Your plan supports: <b>{{formats}}</b>\n\n` +
		`Upgrade for more formats.`,

		images_batch_limit_reached: `⚠️ <b>That's the limit for this batch.</b>\n\n` +
		`Tap "Create PDF" to turn what you've sent so far into a PDF.`,

		// {{limit}} {{reset}}
		images_quota_exhausted: `⏳ <b>You've used all {{limit}} photos for this week.</b>\n\n` +
		`♻️ I'll reset it: {{reset}}\n\n` +
		`Want more now? Upgrade your plan, or wait it out.`,

		images_too_large: `⚠️ <b>These images are too big for me to process.</b>\n\n` +
		`Please try again with smaller files or fewer images.`,

	},

} as const;
