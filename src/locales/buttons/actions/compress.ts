export const compress = {

	buttons: {
		btn_compress: '🗜 Compress',
	},
	availability: `• Up to 2 GB per PDF file\n• Unlimited compressions (limited only by your monthly traffic)`,
	rule: `🗜 <b>Compress</b>\n\n` +
	`📋 How this works:\n` +
	`• Send me a PDF file\n` +
	`• I'll make the file smaller, but keep it readable\n` +
	`• You'll get a smaller PDF back, ready to share\n\n` +
	`💡 <b>Still big after compressing?</b>\n` +
	`Sometimes a file is still over 200MB, and I only shrink it by less than half. That doesn't mean I did a bad job — it usually means the file was already clean inside, with nothing wasteful left to remove.\n\n` +
	`Other tools online might squeeze it smaller than that. But they usually do it by lowering the quality — blurrier images, lost detail. I don't do that. What I send back keeps its quality, always.\n\n` +
	`⏳ <b>How long will it take?</b>\n` +
	`Usually somewhere between 30 seconds and 20 minutes, depending on how big your file is.\n\n` +
	`20 minutes is my hard limit. If I'm not done by then, I stop completely — your file gets deleted, and you'll need to send it again. This is rare. When it happens, it usually means something inside your PDF was either broken or empty in a way that's hard for me to read, or risky enough that I'd rather stop than keep trying.\n\n` +
	`📤 Send me your PDF now.`,


	compressing: `🗜 <b>I'm compressing your PDF...</b>\n\n` +
	`This can take a bit longer for big files.`,

	// {{before}} {{after}} {{saved}}
	success_compress: `✅ <b>Done — your PDF is smaller now.</b>\n\n` +
	`📄 Old size: <b>{{before}}</b>\n` +
	`📦 New size: <b>{{after}}</b>\n` +
	`💾 You saved: <b>{{saved}}</b>`,

	compress_already_optimal: `✅ <b>Your PDF is already about as small as it can get.</b>\n\n` +
	`Compressing it further wouldn't shrink it without hurting the quality.\n\n` +
	`📄 I'm sending back your original file, unchanged.`,

	suffix_compressed: '_COMPRESSED',

	errors: {},

} as const;
