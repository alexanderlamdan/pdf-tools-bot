export const actions = {

    ask_compress: 'Send me the PDF you want to compress.',
    ask_unlock:   'Send me the PDF to unlock.',

    // ── Protect ───────────────────────────────────────────────────────────────
    ask_protect_method: `🔐 <b>Protect PDF</b>\n\nChoose how to protect your file:`,

    ask_protect: `🔐 <b>Password Protection (AES-256)</b>\n\n` +
    `Type a password for this PDF.\n` +
    `The file will be encrypted with AES-256.\n\n` +
    `⚠️ <b>Your password message will be deleted immediately.</b>\n` +
    `If you forget the password — I cannot recover it.\n\n` +
    `👇 <i>Type your password:</i>`,

    ask_protect_asymmetric: `🔑 <b>Asymmetric Encryption (RSA-4096)</b>\n\n` +
    `Your file will be encrypted with a unique RSA-4096 key pair.\n\n` +
    `<b>How it works:</b>\n` +
    `• I generate a key pair — public and private\n` +
    `• The file is encrypted with the public key\n` +
    `• You receive the encrypted file + your private key\n` +
    `• Both keys are deleted from my server immediately\n` +
    `• Without the private key — nobody can decrypt it, including me\n\n` +
    `⚠️ <b>Keep your private key safe.</b> Lose it — the file is gone forever.\n\n` +
    `👇 Press <b>Encrypt</b> to proceed:`,

    asymmetric_processing: `🔑 <b>Generating keys and encrypting...</b>`,

    asymmetric_success: `✅ <b>File encrypted with RSA-4096</b>\n\n` +
    `📦 The archive contains:\n` +
    `• <code>{{filename}}_ENCRYPTED.pdf</code> — your encrypted file\n` +
    `• <code>private_key.pem</code> — your private key\n` +
    `• <code>encrypted_key.bin</code> — encrypted access key\n` +
    `• <code>README.txt</code> — instructions\n\n` +
    `⚠️ <b>Save the archive in a secure place.</b>\n` +
    `Both keys have been deleted from my server.\n\n` +
    `<b>To decrypt:</b> send all three files to me and press <b>🔓 Unlock</b>.`,

    // ── Unlock ────────────────────────────────────────────────────────────────
    ask_unlock_password: `🔓 <b>Enter the password</b>\n\nType the password for this PDF and I'll remove the protection.`,
    ask_unlock_method:   `🔓 <b>Unlock PDF</b>\n\nHow is this file protected?`,
    ask_unlock_key:      `🔑 <b>Send your private key</b>\n\nSend the <code>private_key.pem</code> file you received when encrypting this PDF.`,

    // ── Merge ─────────────────────────────────────────────────────────────────
    ask_split_pages: `✂️ <b>Split PDF</b>\n\nSend the page numbers you want to extract.\n\n<i>Examples:</i>\n• <code>5-12</code> (range)\n• <code>5-12 13-24 25-28</code> (multiple ranges)\n• <code>1, 3, 5, 12</code> (comma separated)`,

    ask_merge_mode:    '🔗 <b>How do you want to merge?</b>\n\nChoose a method:',
    ask_merge_files:   '📥 <b>Merge mode</b>\nFirst file added! Send the next PDF files one by one.\nWhen done — press <b>✅ Merge Files</b>.',
    ask_merge_archive: '📦 <b>Archive mode</b>\nSend one archive (.zip, .rar, .7z, .tar.gz, .tar.xz) with PDF files inside.\nI\'ll unpack and merge them sorted by filename.',
    ask_merge_bulk:    '🗂 <b>Bulk mode</b>\nSend all PDF files — one by one or as a group.\nWhen done, type <b>yes</b> to confirm.',

    // ── Progress ──────────────────────────────────────────────────────────────
    compressing: '🗜 <b>Compressing...</b>\nThis may take a few seconds.',
    encrypting:  '🔐 Encrypting...',
    decrypting:  '🔓 Decrypting...',

    // ── Results ───────────────────────────────────────────────────────────────
    success_protect:  '✅ <b>File protected with AES-256!</b>\n\n⚠️ Remember your password — I don\'t store it.',
    success_unlock:   '🔓 <b>Password removed successfully.</b>',
    success_compress: '✅ <b>Done!</b>\n📉 Before: {{before}}\n📉 After: {{after}}\n🔥 Saved: {{saved}}',

    merge_file_queue:      '✅ File added!\nSend the next one or press \'Merge\'.\nTotal in queue: ',
    merge_bulk_received:   '✅ Received <b>{{count}}</b> files so far.\n\nDone? Reply <b>yes</b> to proceed, or keep sending files.',
    merged_from_archive:   '✅ Merged files from archive: ',
    merge_zip_success:     '📦 All parts in one archive',
    merge_confirm_words:   ' files ready. Press the button to merge.',

    split_caption_success_file: '✂️ <b>Extracted Pages (single file):</b>\n⚠️ <i>In complex PDFs some display errors may occur. Use the archive below for 100% reliability.</i>\n\nPages: ',
    split_caption_success_zip:  '📦 <b>Page-by-page Archive (100% reliable):</b>\nPages: ',

    fail_unlock: '❌ <b>Wrong password.</b> Please try again.',
    file_lost:   '❌ File lost. Please upload again.',

    merge_not_enough_files: '⚠️ Need at least 2 files to merge. Please send more.',

    merge_fallback: `❌ <b>I tried everything.</b>\n\n` +
    `I ran the merge through all available tools — qpdf, ghostscript, pdftk and pdfunite. ` +
    `It\'s not possible to merge these files into a single PDF.\n\n` +
    `📦 <b>Here\'s what I did:</b> split the result into parts of 10 pages each, packed into a ZIP. Each part is also sent separately.`,

    // ── Metadata ──────────────────────────────────────────────────────────────
    metadata_reading:           '🔍 <b>Reading metadata...</b>',
    metadata_wiping:            '🧹 <b>Wiping metadata...</b>\nThis may take a moment.',
    metadata_found_title:       '🔎 <b>Metadata found in your file:</b>\n━━━━━━━━━━━━━━━━━━',
    metadata_empty:             '✅ No metadata found — file is already clean.',
    metadata_watermark_found:   '<b>Watermark detected</b> — will be removed too.',
    metadata_signature_found:   '🔏 <b>Digital signature detected!</b>\nThis document has a valid digital/government signature.',
    metadata_mode_ask:          'Choose what to clean:\n\n<b>1</b> — Metadata only (signature stays valid ✅)\n<b>2</b> — Full wipe: metadata + signature (document becomes unverified ⚠️)\n\nType <b>1</b> or <b>2</b>:',
    metadata_mode_invalid:      '⚠️ Please type <b>1</b> or <b>2</b>:',
    metadata_confirm_ask:       '⚠️ <b>This action is irreversible.</b>\n\nAll metadata will be permanently deleted.\n\nType <b>yes</b> to confirm:',
    metadata_confirm_keep_sig:  '⚠️ <b>Metadata only — signature will be kept.</b>\n\nIrreversible action.\n\nType <b>yes</b> to confirm:',
    metadata_confirm_full_wipe: '⚠️ <b>Full wipe — metadata + digital signature.</b>\n\nDocument becomes unverified. Irreversible.\n\nType <b>yes</b> to confirm:',
    metadata_wipe_success:      '✅ <b>Done! Metadata wiped.</b>\n\nFile is now clean. Choose your next action:',

    // ── Suffixes ──────────────────────────────────────────────────────────────
    suffix_compressed:     '_COMPRESSED',
    suffix_protected:      '_PROTECTED',
    suffix_encrypted:      '_ENCRYPTED',
    suffix_unlocked:       '_UNLOCKED',
    suffix_metadata_clean: '_CLEAN',

} as const;
