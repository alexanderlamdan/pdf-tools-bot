export const office_to_pdf = {

	// {{formats}} {{limit}} {{used}}
	office_rule: `📄 <b>Office to PDF</b>\n\n` +
	`📋 <b>Your rules:</b>\n` +
	`• Formats: <b>{{formats}}</b>\n` +
	`• Up to <b>{{limit}}</b> conversions a week\n` +
	`• Used so far: <b>{{used}}/{{limit}}</b>\n` +
	`• File size: up to <b>900MB</b> in, up to <b>1.5GB</b> out\n` +
	`• Uses your regular monthly traffic too — full file size, not reduced\n\n` +
	`📊 <b>Limits by plan:</b>\n` +
	`🆓 Free — 3/week, DOCX only\n` +
	`⚡ Starter — 9/week, DOCX + CSV\n` +
	`💎 Pro — 18/week, DOCX/Excel/CSV/Markdown\n` +
	`🏢 Ultra — 36/week, full MS Office + Markdown/CSV\n` +
	`💵 Business — 200/week, full MS Office + OpenOffice + Markdown/CSV + code files\n\n` +
	`⏳ Conversion takes a bit longer than usual — I'm actually opening and rendering your document, not just wrapping it.\n\n` +
	`📤 Send me your file now.`,

	availability: `• See your weekly limit above\n• Uses your full file size as traffic (not reduced)`,

	converting: `📄 <b>I'm converting your document...</b>\n\n` +
	`This takes a little longer than other tools — I'm rendering the real formatting, not just wrapping the file.`,

	success_office_to_pdf: `✅ <b>Your PDF is ready!</b>`,

	errors: {

		office_format_not_available: `⚠️ <b>This format isn't available on your plan.</b>\n\n` +
		`Your plan supports: <b>{{formats}}</b>\n\n` +
		`Upgrade for more formats.`,

		// {{limit}} {{reset}}
		office_quota_exhausted: `⏳ <b>You've used all {{limit}} conversions for this week.</b>\n\n` +
		`♻️ I'll reset it: {{reset}}\n\n` +
		`Want more now? Upgrade your plan, or wait it out.`,

		office_too_large: `⚠️ <b>This file is too big for me to process.</b>\n\n` +
		`Max size: <b>900MB</b>. Please try again with a smaller file.`,

		office_output_too_large: `⚠️ <b>The converted PDF came out bigger than I can send — over 1.5GB.</b>\n\n` +
		`This usually happens with documents packed with high-resolution images. Try splitting the document into smaller parts, or compressing the images inside it first.`,

		office_conversion_failed: `❌ <b>I couldn't convert this file.</b>\n\n` +
		`It might be corrupted, password-protected, or in a format I can't fully read. Please check the file and try again.`,

	},

} as const;
