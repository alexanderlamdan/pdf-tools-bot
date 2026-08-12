export const extract = {

	buttons: {
		btn_extract: '🖼 Extract',
		btn_extract_text: '📝 Extract Text',
		btn_extract_images: '🖼 Extract Images',
		btn_extract_search: '🔍 Search Text',
		btn_extract_wordcount: '📊 Word Count',
	},

	availability: `• Free, no limit\n• Files up to 500MB`,

	rule_text: `📝 <b>Extract Text</b>\n\n` +
	`I'll pull all the text out of your PDF and send it back as a <code>.txt</code> file — easy to copy, search, or edit anywhere.\n\n` +
	`💡 <b>One thing to know:</b>\n` +
	`If your PDF is a scan — a photo or picture of a page, not real text — there won't be any text to pull out. It just looks like a document, but it's really one big image.\n\n` +
	`⚠️ If your PDF happens to have over <b>1GB</b> of text inside it — that's an enormous amount, think hundreds of thousands of pages — don't even try to open the file I send back. Something that heavy won't open properly on most devices anyway.\n\n` +
	`This is free, no limit on how many times you use it. The only cap: files up to <b>500MB</b>.\n\n` +
	`📤 Send me your PDF now.`,


	ask_extract_mode: `📤 <b>What do you need from this PDF?</b>\n\n` +
	`All of these are free, no limit.`,

	rule_images: `🖼 <b>Extract Images</b>\n\n` +
	`I'll pull out every picture inside your PDF — photos, graphics, logos — and send them all back zipped into one file.\n\n` +
	`💡 <b>One thing to know:</b>\n` +
	`If your PDF is a scan — where each whole page is really just one big picture, not a document with separate images inside it — there's nothing for me to pull out. The page itself already IS the picture. Extracting it would just give you a copy of the same page, not anything new.\n\n` +
	`This is free, no limit on how many times you use it. The only cap: files up to <b>500MB</b>.\n\n` +
	`📤 Send me your PDF now.`,

	rule_search: `🔍 <b>Search Text</b>\n\n` +
	`Tell me what to look for, and I'll search your whole PDF for it — showing you where it appears, right here in the chat.\n\n` +
	`💡 <b>A few things to know:</b>\n` +
	`• Case sensitive — <code>Word</code> and <code>word</code> count as different searches\n` +
	`• If there are a lot of matches, I'll only show you the first batch, not all of them\n` +
	`• I automatically hide sensitive info I spot — like phone numbers and card numbers — in what I show you\n\n` +
	`This is free, no limit on how many times you use it. The only cap: files up to <b>500MB</b>.\n\n` +
	`📤 Send me your PDF now.`,

	rule_wordcount: `📊 <b>Word Count</b>\n\n` +
	`I'll count the words, characters, and lines in your PDF, and show you the numbers right here in the chat.\n\n` +
	`💡 <b>One thing to know:</b>\n` +
	`If your PDF is a scan — a photo or picture of a page, not real text — there's nothing for me to count. It just looks like a document, but it's really one big image.\n\n` +
	`This is free, no limit on how many times you use it. The only cap: files up to <b>500MB</b>.\n\n` +
	`📤 Send me your PDF now.`,

	extracting_text:   `📝 <b>I'm pulling out the text...</b>`,
	extracting_images: `🖼 <b>I'm pulling out the images...</b>`,
	searching_text:    `🔍 <b>Searching...</b>`,
	counting_words:    `📊 <b>Counting words...</b>`,

	ask_search_query: `🔍 <b>What do you want to find?</b>\n\n` +
	`This is case sensitive — <code>Word</code> and <code>word</code> count as different.`,

	success_extract_text: `📝 <b>Done — here's the text.</b>`,
	success_extract_images: `🖼 <b>Done — here are the images.</b>`,

	search_no_matches: `🔍 <b>I didn't find any matches.</b>`,

	// {{total}} {{plural}}
	search_results_header: `🔍 <b>Search results</b>\n\n` +
	`Found: {{total}} match{{plural}}\n`,

	// {{shown}}
	search_truncated_note: `\n<i>Showing the first {{shown}} — try a more specific search to narrow it down.</i>`,

	// {{words}} {{chars}} {{lines}}
	word_count_result: `📊 <b>Word Count</b>\n\n` +
	`📝 Words: <b>{{words}}</b>\n` +
	`🔤 Characters: <b>{{chars}}</b>\n` +
	`📄 Lines: <b>{{lines}}</b>`,

	errors: {

		extract_no_text: `⚠️ <b>I couldn't find any text in this file.</b>\n\n` +
		`This usually means the PDF is a scan — a picture of text, not real text.`,

		extract_no_images: `⚠️ <b>I didn't find any images in this file.</b>`,

		extract_scanned_no_images: `⚠️ <b>This PDF is a scan.</b>\n\n` +
		`The whole page is one big picture — there's nothing separate to pull out as an "image", it would just be a copy of the same page.`,

		extract_file_too_large: `⚠️ <b>This file is too big for Extract or Search.</b>\n\n` +
		`This free feature has its own limit — 500MB max. Please try a smaller file.`,

		extract_output_too_large: `⚠️ <b>There's too much text to pull out.</b>\n\n` +
		`The text crossed 1GB partway through — that's hundreds of thousands of words, way more than you could search through anyway. I stopped it there.`,

		search_empty_query: `⚠️ Please send me some text to search for.`,

	},

} as const;
