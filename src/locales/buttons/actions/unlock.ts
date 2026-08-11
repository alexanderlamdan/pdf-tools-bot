export const unlock = {

	buttons: {
		btn_unlock: '🔓 Unlock',
		method_password:   '🔓 Use Password',
		method_asymmetric: '🔑 Use Private Key',
	},

	rule: `🔓 <b>Unlock PDF</b>\n\n` +
	`I'll remove the lock from your PDF so anyone can open it.\n\n` +
	`📋 <b>How was it locked?</b>\n` +
	`• <b>Password</b> — you, or whoever sent it, set a password to open it\n` +
	`• <b>Advanced (private key)</b> — locked with a special key file instead of a password\n\n` +
	`Not sure which one? If you don't have a separate key file, it's probably password protection.\n\n` +
	`👇 How was this PDF locked?`,

	ask_unlock_password: `🔓 <b>Unlock PDF</b>\n\n` +
	`🔑 Type the password for this PDF.\n\n` +
	`I'll remove the password so anyone can open it.\n\n` +
	`👇 <i>Type your password:</i>`,

	decrypting: `🔓 <b>I'm unlocking your PDF...</b>\n\n` +
	`One moment.`,

	success_unlock: `✅ <b>Done — your PDF is unlocked.</b>`,

	suffix_unlocked: '_UNLOCKED',

	errors: {

		fail_unlock: `❌ <b>That password doesn't work.</b>\n\n` +
		`Please check it and try again.`,

	},

} as const;
