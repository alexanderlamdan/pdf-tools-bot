export const rename = {

	buttons: {
		btn_rename: '✏️ Rename',
	},

	rule: `✏️ <b>Rename</b>\n\n` +
	`Type a new name for this file. That's all this does — nothing inside the document changes, just what it's called.\n\n` +
	`💡 <b>A few things to know:</b>\n` +
	`• Don't add <code>.pdf</code> at the end — I'll add that myself\n` +
	`• Skip special characters like <code>/ \\ : * ? " &lt; &gt; |</code> — if you use them, I'll remove them automatically, so your name might come out slightly different than you typed\n` +
	`• Just send me the name as a text message — not a file, not a photo, just words\n\n` +
	`🆓 This is completely free and doesn't use any of your traffic.\n\n` +
	`📤 Type the new name now.`,

	success_rename: `✏️ <b>Done — renamed.</b>`,

	errors: {},

} as const;
