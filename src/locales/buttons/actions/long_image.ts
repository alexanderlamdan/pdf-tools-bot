export const long_image = {

	buttons: {
		btn_to_long_image: '📜 Long Image',
		btn_long_image_pages:   '📖 From PDF pages',
		btn_long_image_bulk:    '📄 One PDF = one page (up to {{limit}})',
		btn_long_image_execute: '✅ Create long image',
	},

	rule: `📜 <b>PDF to Long Image</b>\n\n` +
	`I'll turn PDF pages into one long, scrollable image — good for reading on your phone or sharing on social media.\n\n` +
	`📋 <b>Two ways to build one:</b>\n` +
	`• <b>From PDF pages</b> — pick pages from one PDF to stitch together\n` +
	`• <b>One PDF = one page</b> — send up to {{limit}} separate PDFs, each becomes one page\n\n` +
	`Your limit: up to <b>{{limit}}</b> pages per long image.\n\n` +
	`📊 <b>Limits by plan:</b>\n` +
	`🆓 Free — 25 pages\n` +
	`⚡ Starter — 50 pages\n` +
	`💎 Pro — 100 pages\n` +
	`🏢 Ultra — 200 pages\n` +
	`💵 Business — 400 pages\n\n` +
	`💡 <b>One thing to know:</b> in "one PDF = one page" mode, if a PDF has more than one page, I'll only use the first page and let you know.\n\n` +
	`👇 How do you want to build it?`,

	ask_long_image_pages: `📜 <b>PDF to Long Image</b>\n\n` +
	`Tell me which pages to combine into one long image.\n\n` +
	`✍️ Type the page numbers:\n\n` +
	`<i>Examples:</i>\n` +
	`• <code>5-12</code> — pages 5 to 12\n` +
	`• <code>1,3,5</code> — a few separate pages\n` +
	`• <code>1-5 10-15</code> — a few ranges at once`,

	// {{limit}}
	ask_long_image_bulk: `📄 <b>One PDF = One Page mode</b>\n\n` +
	`Send me up to <b>{{limit}} PDF files</b> — together or one by one.\n` +
	`Each PDF becomes one page in the long image.\n\n` +
	`⚠️ If a PDF has more than 1 page, I'll just take the first page and let you know.\n\n` +
	`When you're done sending files, type <b>yes</b> and I'll build it.`,

	long_image_processing: `📜 <b>I'm building your long image...</b>\n\n` +
	`This can take a bit longer for big files.`,

	success_long_image: `✅ <b>Your long image is ready!</b>\n\n` +
	`I combined your pages into one long image — good for scrolling, reading, or sharing.`,

	// {{count}} {{max}}
	long_image_bulk_file_added: `✅ File added! (<b>{{count}}/{{max}}</b>)\n\nSend more, or type <b>yes</b> when you're done.`,

	// {{count}}
	long_image_bulk_received: `📥 I have <b>{{count}}</b> files so far.\n\nDone? Type <b>yes</b> and I'll build it, or keep sending files.`,

	long_image_bulk_confirm_words: `files ready. Tap the button to create the long image.`,

	// {{files}}
	long_image_bulk_warning: `⚠️ <b>Note:</b> These files had more than one page, so I only used the first page from each:\n{{files}}\n\nIf that's not what you wanted, please don't put me on your blacklist 🙏`,

	errors: {

		// {{pages}} {{limit}}
		long_image_limit_exceeded: `❌ <b>That's more pages than your plan allows.</b>\n\n` +
		`You picked <b>{{pages}}</b> pages.\n` +
		`Your plan allows up to <b>{{limit}}</b>.\n\n` +
		`📊 <b>Page limits by plan:</b>\n` +
		`🆓 Free — 25 pages\n` +
		`⚡ Starter — 50 pages\n` +
		`💎 Pro — 100 pages\n` +
		`🏢 Ultra — 200 pages\n` +
		`💵 Business — 400 pages\n\n` +
		`👉 Open <b>👤 My Status</b> to upgrade.`,

		long_image_bulk_no_files: `⚠️ I don't have any files yet. Please send me at least one PDF first.`,

		// {{limit}}
		long_image_bulk_limit_reached: `⚠️ <b>That's the limit.</b>\n\nYou can send up to <b>{{limit}} files</b>. Type <b>yes</b> and I'll build it with what you've sent so far.`,

	},

} as const;
