export const actions = {

    ask_compress:    'Send me the PDF file you want to compress.',
    ask_unlock:      'Send me the PDF file to unlock.',

    // ── Protect — выбор метода ────────────────────────────────────────────────
    ask_protect_method: `🔐 <b>Protect PDF</b>\n\nChoose protection method:`,

    // Метод 1 — пароль AES-256
    ask_protect: `🔐 <b>Password Protection (AES-256)</b>\n\n` +
    `Enter a password for this PDF.\n` +
    `The file will be encrypted with AES-256 — industry standard protection.\n\n` +
    `⚠️ <b>Important:</b> For your security, your password message will be deleted immediately after encryption. If you lose the password — we cannot recover it.\n\n` +
    `👇 <i>Type your password:</i>`,

    // Метод 2 — асимметричное шифрование
    ask_protect_asymmetric: `🔑 <b>Asymmetric Encryption (RSA-4096)</b>\n\n` +
    `Your file will be encrypted with a unique RSA-4096 key pair.\n\n` +
    `<b>How it works:</b>\n` +
    `• We generate a key pair — public and private\n` +
    `• The file is encrypted with the public key\n` +
    `• You receive the encrypted file + your private key\n` +
    `• Both keys are immediately deleted from our server\n` +
    `• Without the private key — the file cannot be decrypted by anyone, including us\n\n` +
    `⚠️ <b>Keep your private key safe.</b> If you lose it — the file is gone forever.\n\n` +
    `👇 Press <b>Encrypt</b> to proceed:`,

    asymmetric_processing: `🔑 <b>Generating keys and encrypting...</b>`,

    asymmetric_success: `✅ <b>File encrypted with RSA-4096</b>\n\n` +
    `📎 Two files are attached:\n` +
    `• <code>{{filename}}_ENCRYPTED.pdf</code> — your encrypted file\n` +
    `• <code>private_key.pem</code> — your private key\n\n` +
    `⚠️ <b>Save the private key in a secure place.</b>\n` +
    `Both keys have been deleted from our server.\n` +
    `Without the private key — decryption is impossible.\n\n` +
    `<b>To decrypt:</b> send the encrypted file + private key to this bot and press <b>🔓 Unlock</b>.`,

    // ── Unlock ────────────────────────────────────────────────────────────────
    ask_unlock_password: `🔓 <b>Enter the password</b>\n\nType the password for this PDF and I'll remove the protection.`,

    ask_unlock_method: `🔓 <b>Unlock PDF</b>\n\nHow is this file protected?`,

    ask_unlock_key: `🔑 <b>Send your private key</b>\n\nSend the <code>private_key.pem</code> file you received when encrypting this PDF.`,

    // ── Общие ─────────────────────────────────────────────────────────────────
    ask_split_pages: `✂️ <b>Split PDF</b>

    Send the page numbers you want to extract as text in line with spaces. I will send you a convenient ZIP archive with the results.

    <i>Examples:</i>
    • <code>5-12</code> (range)
    • <code>5-12 13-24 25-28</code> (multiple ranges)
    • <code>1, 3, 5, 12</code> (comma separated)`,

    ask_merge_mode:    '🔗 <b>How do you want to merge?</b>\n\nChoose a method:',
    ask_merge_files:   '📥 <b>Merge Mode</b>\nFirst file added! Send the next PDF files here one by one in the desired order.\nWhen you\'re finished, press the <b>✅ Merge Files</b> button.',
    ask_merge_archive: '📦 <b>Archive mode</b>\nSend one archive (.zip, .rar, .7z, .tar.gz, .tar.xz) with PDF files inside.\nI will unpack and merge them sorted by filename.',
    ask_merge_bulk:    '🗂 <b>Bulk mode</b>\nSend all PDF files — one by one or as a group.\nWhen done, type <b>yes</b> to confirm.',

    compressing: '🗜 <b>Compressing...</b>\nThis may take a few seconds.',
    encrypting:  '🔐 Encrypting...',
    decrypting:  '🔓 Decrypting...',

    success_protect:  '✅ <b>File is now protected with AES-256!</b>\n\n⚠️ Remember your password — we do not store it.',
    success_unlock:   '🔓 <b>Password removed successfully.</b>',
    success_compress: '✅ <b>Done!</b>\n📉 Before: {{before}}\n📉 After: {{after}}\n🔥 Saved: {{saved}}',

    merge_file_queue:      '✅ File added!\nSend the next one or press the \'Merge\' button.\nTotal files in queue: ',
    merge_bulk_received:   '✅ Received <b>{{count}}</b> files so far.\n\nAre you done? Reply <b>yes</b> to proceed, or keep sending files.',
    merged_from_archive:   '✅ Merged files from archive: ',
    merge_zip_success:     '📦 All parts in one archive',
    merge_confirm_words:   ' files ready. Press the button to merge.',

    split_caption_success_file: '✂️ <b>Extracted Pages (Single File):</b>\n⚠️ <i>Note: In very complex PDFs, display errors may occur in the merged file. Use the archive below to guarantee 100% integrity.</i>\n\nPages: ',
    split_caption_success_zip:  '📦 <b>Page-by-page Archive (100% Reliable):</b>\nPages: ',

    fail_unlock: '❌ <b>Wrong password.</b> Please try again.',
    file_lost:   '❌ Error: File lost. Please upload again.',

    merge_not_enough_files: '⚠️ You need at least 2 files to merge. Please send more.',

    merge_fallback: `❌ <b>We tried everything.</b>

    We ran the merge through all available tools — qpdf, ghostscript, pdftk and pdfunite (the engine behind Adobe's own PDF tools). It is not possible to merge these files into a single PDF.

    📦 <b>Here's what we can do:</b> we split the result into parts of 10 pages each and packed them into a ZIP archive. Each part is also sent as a separate file.`,

    // ── Суффиксы ───────────────────────────────────────────────────────────────
    metadata_reading:           '🔍 <b>Reading metadata...</b>',
    metadata_wiping:            '🧹 <b>Wiping metadata...</b>\nThis may take a moment.',
    metadata_found_title:       '🔎 <b>Metadata found in your file:</b>\n━━━━━━━━━━━━━━━━━━',
    metadata_empty:             '✅ No metadata found — file is already clean.',
    metadata_watermark_found:   '<b>Watermark detected</b> — will be removed too.',
    metadata_signature_found:   '🔏 <b>Digital signature detected!</b>\nThis document has a valid digital/government signature.',
    metadata_mode_ask:          'Choose what to clean:\n\n<b>1</b> — Metadata only (signature stays valid ✅)\n<b>2</b> — Full wipe: metadata + signature (document becomes unverified ⚠️)\n\nType <b>1</b> or <b>2</b>:',
    metadata_mode_invalid:      '⚠️ Please type <b>1</b> or <b>2</b>:',
    metadata_confirm_ask:       '⚠️ <b>This action is irreversible.</b>\n\nAll metadata will be permanently deleted and cannot be restored.\n\nType <b>yes</b> to confirm:',
    metadata_confirm_keep_sig:  '⚠️ <b>Metadata only — signature will be kept.</b>\n\nThis action is irreversible.\n\nType <b>yes</b> to confirm:',
    metadata_confirm_full_wipe: '⚠️ <b>Full wipe — metadata + digital signature.</b>\n\nThe document will become unverified. This action is irreversible.\n\nType <b>yes</b> to confirm:',
    metadata_wipe_success:      '✅ <b>Done! Metadata wiped.</b>\n\nThe file is now clean. Choose your next action:',

    // ── Суффиксы ───────────────────────────────────────────────────────────────
    suffix_compressed:     '_COMPRESSED',
    suffix_protected:      '_PROTECTED',
    suffix_encrypted:      '_ENCRYPTED',
    suffix_unlocked:       '_UNLOCKED',
    suffix_metadata_clean: '_CLEAN',

} as const;
