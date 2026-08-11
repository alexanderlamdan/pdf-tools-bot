export const asymmetric = {

	rule: `🔑 <b>Advanced Protection</b>\n\n` +
	`A regular password is something you remember and type in.\n` +
	`This is different — instead of a password, I give you a special key file.\n\n` +
	`✅ Much harder to break than a password.\n` +
	`⚠️ But if you lose the key file, the PDF is locked forever. Not even I can open it for you.\n\n` +
	`Here's how it works:\n` +
	`1. You send me a PDF\n` +
	`2. I lock it and send you back <b>several files</b>, not just one\n` +
	`3. You need to save <b>all of them</b> somewhere safe — losing even one means losing the PDF for good\n\n` +
	`Not sure you need this? Regular password protection is simpler, and still strong.\n\n` +
	`Ready? Send me your PDF.`,

	asymmetric_processing: `🔑 <b>I'm locking your PDF...</b>\n\n` +
	`This can take a bit longer for big files.`,

	asymmetric_success: `✅ <b>Done — your PDF is locked and ready!</b>\n\n` +
	`I packed everything into one <b>ZIP archive</b> for you. Open it, and you'll find 4 things inside:\n\n` +
	`1. Your locked PDF\n` +
	`2. Your key (<code>private_key.pem</code>) — keep this safe\n` +
	`3. A small helper file (<code>encrypted_key.bin</code>) — you'll need this too\n` +
	`4. Instructions, in case you forget how this works\n\n` +
	`🔒 I don't keep a copy of your key. It only exists inside the archive I just sent you.\n\n` +
	`⚠️ Save the whole archive somewhere safe. Lose it, and nobody — not even me — can open your PDF again.`,


	ask_private_key: `🔑 <b>Send me your private key.</b>\n\n` +
	`Upload the <code>private_key.pem</code> file from when you protected this PDF.`,

	ask_encrypted_key: `🔐 <b>One more file, please.</b>\n\n` +
	`Now upload <code>encrypted_key.bin</code> from the same place.`,

	asymmetric_decrypting: `🔓 <b>I'm unlocking your PDF...</b>\n\n` +
	`This can take a bit longer for big files.`,

	errors: {},

} as const;
