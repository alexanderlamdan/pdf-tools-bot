export const merge = {

	buttons: {
		btn_merge: '🔗 Merge',
		btn_execute_merge: '✅ Merge PDFs',
		btn_merge_one_by_one: '📄 One by One (max 10)',
		btn_merge_archive: '📦 From Archive',
		btn_merge_bulk: '🗂 Multiple PDFs',
	},

	rule: `🔗 <b>Merge PDFs</b>\n\n` +
	`I'll combine multiple PDFs into one file, in the order you give them to me.\n\n` +
	`📋 <b>Three ways to add your files:</b>\n` +
	`• <b>One by one</b> — send them one at a time, up to 10\n` +
	`• <b>From archive</b> — send me one ZIP, RAR, or 7Z with your PDFs inside, I'll merge them in filename order\n` +
	`• <b>Multiple PDFs</b> — send me a bunch at once, or one by one, then type <code>yes</code>\n\n` +
	`💡 <b>A few things to know:</b>\n` +
	`• I need at least 2 PDF files to merge\n` +
	`• From an archive: if two files are exact duplicates, I'll skip the copy and tell you which ones\n` +
	`• If I can't safely combine everything into one file, I'll split it into smaller PDFs instead and zip them together\n` +
	`• 💧 On the Free plan, I automatically add a small watermark page and some info to the end of your merged file. Upgrade to skip this.\n\n` +
	`👇 How do you want to add your files?`,


	ask_merge_files: `📄 <b>One by One</b>\n\n` +
	`I added your first PDF.\n\n` +
	`📄 Send me more PDF files.\n` +
	`When you're ready, tap <b>✅ Merge Files</b>.`,

	ask_merge_archive: `📦 <b>Archive</b>\n\n` +
	`Send me one archive with your PDF files inside.\n\n` +
	`I can open:\n` +
	`<code>.zip</code> <code>.rar</code> <code>.7z</code> <code>.tar.gz</code> <code>.tar.xz</code>\n\n` +
	`I'll merge the files in filename order.`,

	ask_merge_bulk: `🗂 <b>Multiple PDFs</b>\n\n` +
	`Send me all your PDF files, together or one by one.\n\n` +
	`When you're done, type <code>yes</code> and I'll merge them.`,

	// {{count}}
	merge_file_queue: `✅ <b>PDF added.</b>\n\n` +
	`📄 Send me another PDF, or tap <b>✅ Merge Files</b>.\n\n` +
	`Files so far: <b>`,

	// {{count}}
	merge_bulk_received: `✅ <b>{{count}}</b> PDF files received.\n\n` +
	`📄 Send more, or type <b>yes</b> when you're ready to merge them.`,

	merged_from_archive: `✅ PDFs merged from your archive: `,

	merge_zip_success: `📦 <b>I packed all your PDF files into one ZIP file.</b>`,

	merge_confirm_words: ` PDF files ready.\nTap <b>✅ Merge Files</b> to continue.`,

	merge_fallback: `⚠️ <b>I couldn't merge these into one file.</b>\n\n` +
	`I tried a few different ways, but these files can't be combined safely.\n\n` +
	`📦 Instead, I made separate PDFs of up to 10 pages each, and packed them into one ZIP file.\n\n` +
	`Each PDF is also included on its own.`,

	// {{count}} {{names}} — дубликаты по содержимому при Merge из архива
	duplicates_skipped: `⚠️ I skipped {{count}} duplicate file(s): {{names}}`,

	errors: {

		merge_not_enough_files: `⚠️ <b>I need more PDF files.</b>\n\n` +
		`Please send me at least <b>2 PDF files</b> to merge them.`,

	},

} as const;
