export const actions = {
    ask_compress: 'Send me the PDF file you want to compress.',
    ask_unlock: 'Send me the PDF file to unlock.',
    ask_protect: '🔐 <b>Set Password</b>\n👇 <i>Send the password as a text message:</i>',
    ask_split_pages: `✂️ <b>Split PDF</b>

Send the page numbers you want to extract as text in line with spaces. I will send you a convenient ZIP archive with the results.

<i>Examples:</i>
• <code>5-12</code> (range)
• <code>5-12 13-24 25-28</code> (multiple ranges)
• <code>1, 3, 5, 12</code> (comma separated)`,
    ask_merge_mode: '🔗 <b>How do you want to merge?</b>\n\nChoose a method:',
    ask_merge_files: '📥 <b>Merge Mode</b>\nFirst file added! Send the next PDF files here one by one in the desired order.\nWhen you\'re finished, press the <b>✅ Merge Files</b> button.',
    ask_merge_archive: '📦 <b>Archive mode</b>\nSend one archive (.zip, .rar, .7z, .tar.gz, .tar.xz) with PDF files inside.\nI will unpack and merge them sorted by filename.',
    ask_merge_bulk: '🗂 <b>Bulk mode</b>\nSend all PDF files — one by one or as a group.\nWhen done, type <b>yes</b> to confirm.',
    compressing: '🗜 <b>Compressing...</b>\nThis may take a few seconds.',
    encrypting: '🔐 Encrypting...',
    decrypting: '🔓 Decrypting...',
    cracking: '🕵️‍♂️ <b>Cracking password...</b>\nChecking 10k combinations (30-60s)...',
    success_protect: '✅ <b>File is now secure!</b>',
    success_crack: '🔓 <b>Success! Password:</b> <code>{{password}}</code>',
    success_compress: '✅ <b>Done!</b>\n📉 Before: {{before}}\n📉 After: {{after}}\n🔥 Saved: {{saved}}',
    repair_success: '✅ <b>File successfully saved and restored!</b>\n\nIt is now stored in the bot\'s memory. Choose what you would like to do with it next:',
    merge_file_queue: '✅ File added!\nSend the next one or press the \'Merge\' button.\nTotal files in queue: ',
    merge_bulk_received: '✅ Received <b>{{count}}</b> files so far.\n\nAre you done? Reply <b>yes</b> to proceed, or keep sending files.',
    merged_from_archive: '✅ Merged files from archive: ',
    merge_zip_success: '📦 All parts in one archive',
    merge_confirm_words: ' files ready. Press the button to merge.',
    split_caption_success_file: '✂️ <b>Extracted Pages (Single File):</b>\n⚠️ <i>Note: In very complex PDFs, display errors may occur in the merged file. Use the archive below to guarantee 100% integrity.</i>\n\nPages: ',
    split_caption_success_zip: '📦 <b>Page-by-page Archive (100% Reliable):</b>\nPages: ',
    fail_crack: '❌ <b>Failed.</b> Password is too strong.',
    fail_manual: '❌ <b>Dictionary failed.</b>\n👇 <i>Enter password manually if you know it:</i>',
    file_lost: '❌ Error: File lost. Please upload again.',
    merge_not_enough_files: '⚠️ You need at least 2 files to merge. Please send more.',
    merge_fallback: `❌ <b>We tried everything.</b>

We ran the merge through all available tools — qpdf, ghostscript, pdftk and pdfunite (the engine behind Adobe's own PDF tools). It is not possible to merge these files into a single PDF.

📦 <b>Here's what we can do:</b> we split the result into parts of 10 pages each and packed them into a ZIP archive. Each part is also sent as a separate file.`,
    repair_warning: `⚠️ <b>Attention! Starting repair...</b>

🛠 We will try to rebuild the file structure from scratch. During this process, <b>text may shift, fonts might change, or the layout could look a bit messy</b>.

🛑 <i>Note:</i> There is a chance that strict programs (like Adobe Acrobat) still won't be able to read this file because the original background data is missing, but most browsers and simple readers will open it.

⏳ <i>Please wait...</i>`,
    repair_fail: `❌ <b>We're very sorry, but this file cannot be restored.</b>

We've tried all available methods, but the document structure is completely destroyed or critical data is missing. It's impossible to save this file. 🙏`,
    metadata_reading: '🔍 <b>Reading metadata...</b>',
    metadata_wiping: '🧹 <b>Wiping metadata...</b>\nThis may take a moment.',
    metadata_found_title: '🔎 <b>Metadata found in your file:</b>\n━━━━━━━━━━━━━━━━━━',
    metadata_empty: '✅ No metadata found — file is already clean.',
    metadata_watermark_found: '<b>Watermark detected</b> — will be removed too.',
    metadata_signature_found: '🔏 <b>Digital signature detected!</b>\nThis document has a valid digital/government signature.',
    metadata_mode_ask: 'Choose what to clean:\n\n<b>1</b> — Metadata only (signature stays valid ✅)\n<b>2</b> — Full wipe: metadata + signature (document becomes unverified ⚠️)\n\nType <b>1</b> or <b>2</b>:',
    metadata_mode_invalid: '⚠️ Please type <b>1</b> or <b>2</b>:',
    metadata_confirm_ask: '⚠️ <b>This action is irreversible.</b>\n\nAll metadata will be permanently deleted and cannot be restored.\n\nType <b>yes</b> to confirm:',
    metadata_confirm_keep_sig: '⚠️ <b>Metadata only — signature will be kept.</b>\n\nThis action is irreversible.\n\nType <b>yes</b> to confirm:',
    metadata_confirm_full_wipe: '⚠️ <b>Full wipe — metadata + digital signature.</b>\n\nThe document will become unverified. This action is irreversible.\n\nType <b>yes</b> to confirm:',
    metadata_wipe_success: '✅ <b>Done! Metadata wiped.</b>\n\nThe file is now clean. Choose your next action:',
    suffix_compressed: '_COMPRESSED',
    suffix_protected: '_PROTECTED',
    suffix_repair: '_REPAIRED',
    suffix_unlocked: '_UNLOCKED',
    suffix_metadata_clean: '_CLEAN',
};
