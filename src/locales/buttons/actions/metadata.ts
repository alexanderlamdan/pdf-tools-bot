export const metadata = {

	buttons: {
		btn_metadata_wiper: '🧹 Remove Metadata',
	},

	rule: `🧹 <b>Remove Metadata</b>\n\n` +
	`Every PDF carries some hidden information you can't see just by reading it — who made it, what program was used, when it was created, sometimes even edit history. A bit like how a photo secretly stores the date and location it was taken.\n\n` +
	`I'll check your PDF for this, show you what I found, and clean it out if you want.\n\n` +
	`💡 <b>One thing to know:</b>\n` +
	`If your PDF has a digital signature, removing metadata might make that signature invalid. I'll ask which you'd rather keep before I touch anything.\n\n` +
	`📤 Send me your PDF now.`,

	availability: `• Paid plans only\n• Uses your regular monthly traffic`,

	metadata_reading: `🔍 <b>Checking your PDF...</b>`,

	metadata_wiping: `🧹 <b>I'm removing the metadata...</b>\n\n` +
	`This can take a bit longer for big files.`,

	metadata_found_title: `🔎 <b>Here's what I found</b>\n` +
	`━━━━━━━━━━━━━━━━━━`,

	metadata_empty: `✅ <b>No metadata in this one.</b>\n\n` +
	`Your PDF is already clean.`,

	metadata_watermark_found: `🏷 <b>I found a watermark.</b>\n` +
	`I'll remove it.`,

	metadata_signature_found: `🔏 <b>I found a digital signature.</b>\n\n` +
	`Heads up — it might stop being valid once I remove the metadata.`,

	metadata_mode_ask: `🧹 <b>What should I remove?</b>\n\n` +
	`<b>1</b> — Just the metadata <i>(your digital signature stays valid ✅)</i>\n` +
	`<b>2</b> — Metadata + the digital signature <i>(the signature won't be valid anymore ⚠️)</i>\n\n` +
	`✍️ Type <b>1</b> or <b>2</b>:`,

	metadata_confirm_ask: `⚠️ <b>I can't undo this once it's done.</b>\n\n` +
	`I'll remove all the metadata permanently.\n\n` +
	`✍️ Type <b>yes</b> to continue:`,

	metadata_confirm_keep_sig: `⚠️ <b>I'll remove the metadata.</b>\n\n` +
	`Your digital signature will stay valid.\n\n` +
	`I can't undo this once it's done.\n\n` +
	`✍️ Type <b>yes</b> to continue:`,

	metadata_confirm_full_wipe: `⚠️ <b>I'll remove the metadata and the digital signature.</b>\n\n` +
	`After this, the signature won't be valid anymore.\n\n` +
	`I can't undo this once it's done.\n\n` +
	`✍️ Type <b>yes</b> to continue:`,

	metadata_wipe_success: `✅ <b>Done!</b>\n\n` +
	`I removed what you asked for.\n\n` +
	`What's next?`,

	suffix_metadata_clean: '_CLEAN',

	errors: {

		metadata_mode_invalid: `⚠️ Please type <b>1</b> or <b>2</b>.`,

	},

} as const;
