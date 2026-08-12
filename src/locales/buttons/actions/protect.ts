export const protect = {

	buttons: {
		btn_protect: '🔐 Protect',
		method_password:   '🔐 Password Protection',
		method_asymmetric: '🔑 Private Key Protection',
	},

	availability: `• Uses your regular monthly traffic`,

	rule: `🔐 <b>Protect PDF</b>\n\n` +
	`I'll lock your PDF so only someone with the right password can open it.\n\n` +
	`📋 <b>Two ways to do this:</b>\n` +
	`• <b>Password protection</b> — you pick a password, type it in whenever you want to open the file. Simple, and works everywhere.\n` +
	`• <b>Advanced protection</b> — a stronger method using a special key file instead of a password. Harder to break, but lose the key file and the PDF is locked forever.\n\n` +
	`Not sure which one? Password protection is the simpler choice, and still plenty strong for most people.\n\n` +
	`👇 How do you want to protect it?`,

	ask_protect: `🔐 <b>Password Protection</b>\n\n` +
	`🔑 Type the password you want to use.\n\n` +
	`🔒 I'll lock your PDF with strong encryption so only people with the password can open it.\n\n` +
	`⚠️ <b>I'll delete your password message right away, so no one else can see it.</b>\n` +
	`If you lose this password, I can't recover it for you — please save it somewhere safe.`,

	encrypting: `🔐 <b>I'm locking your PDF...</b>\n\n` +
	`One moment.`,

	success_protect: `✅ <b>Done — your PDF is locked.</b>\n\n` +
	`🔑 Keep your password somewhere safe.\n` +
	`Without it, no one can open this PDF — not even me.`,

	suffix_protected: '_PROTECTED',

	errors: {},

} as const;
