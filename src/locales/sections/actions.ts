export const actions = {

    ask_compress: `🗜 <b>Compress PDF</b>\n\n` +
    `📄 Send the PDF file you want to compress.`,

    ask_unlock: `🔓 <b>Unlock PDF</b>\n\n` +
    `📄 Send the password-protected PDF file.`,

    ask_protect_method: `🔐 <b>Protect PDF</b>\n\n` +
    `Choose how you'd like to protect your PDF:`,

    ask_protect: `🔐 <b>Password Protection (AES-256)</b>\n\n` +
    `🔑 Enter the password you want to use.\n\n` +
    `🔒 Your PDF will be encrypted using AES-256 encryption.\n\n` +
    `⚠️ <b>Your password message will be deleted immediately for your privacy.</b>\n` +
    `If you lose your password, it cannot be recovered.\n\n` +
    `👇 <i>Enter your password:</i>`,

    ask_protect_asymmetric: `🔑 <b>Advanced Protection (RSA-4096)</b>\n\n` +
    `This will lock your PDF with a unique key.\n\n` +
    `You will receive:\n` +
    `• The locked PDF\n` +
    `• Your private key\n` +
    `• A small file needed to unlock it later\n` +
    `• Instructions\n\n` +
    `🔒 After this, the keys are deleted from the server.\n` +
    `Without your private key, nobody can unlock the PDF — not even me.\n\n` +
    `⚠️ <b>Keep your private key safe.</b>\n` +
    `If you lose it, the PDF cannot be recovered.\n\n` +
    `👇 Press <b>Encrypt</b> to continue:`,

    asymmetric_processing: `🔑 <b>Locking your PDF...</b>\n\n` +
    `This may take some time for large files.`,

    asymmetric_success: `✅ <b>Your protected PDF is ready.</b>\n\n` +
    `📦 The archive contains:\n` +
    `• <code>{{filename}}_ENCRYPTED.pdf</code> — locked PDF\n` +
    `• <code>private_key.pem</code> — your private key\n` +
    `• <code>encrypted_key.bin</code> — needed to unlock later\n` +
    `• <code>README.txt</code> — instructions\n\n` +
    `🔒 The keys have been deleted from the server.\n\n` +
    `⚠️ Save this archive in a safe place.\n` +
    `You will need these files to unlock your PDF later.`,

    ask_private_key: `🔑 <b>Send your private key.</b>\n\n` +
    `Upload the <code>private_key.pem</code> file from the archive you got when you protected this PDF.`,

    ask_encrypted_key: `🔐 <b>One more file.</b>\n\n` +
    `Now upload <code>encrypted_key.bin</code> from the same archive.`,

    asymmetric_decrypting: `🔓 <b>Unlocking your PDF...</b>\n\n` +
    `This may take some time for large files.`,

    ask_long_image_pages: `📜 <b>PDF to Long Image</b>\n\n` +
    `Choose which PDF pages you want to combine into one long image.\n\n` +
    `✍️ Enter the page numbers:\n\n` +
    `<i>Examples:</i>\n` +
    `• <code>5-12</code> — pages 5 to 12\n` +
    `• <code>1,3,5</code> — individual pages\n` +
    `• <code>1-5 10-15</code> — multiple ranges`,

    long_image_processing: `📜 <b>Creating your long image...</b>\n\n` +
    `This may take some time for large PDFs.`,

    success_long_image: `✅ <b>Your long image is ready!</b>\n\n` +
    `The selected PDF pages have been combined into one long image.\n` +
    `Perfect for scrolling, reading, or sharing.`,

    long_image_limit_exceeded: `❌ <b>Too many pages selected.</b>\n\n` +
    `You selected <b>{{pages}}</b> pages.\n` +
    `Your current plan allows up to <b>{{limit}}</b> pages.\n\n` +
    `📊 <b>Page limits:</b>\n` +
    `🆓 Free — 25 pages\n` +
    `⚡ Starter — 50 pages\n` +
    `💎 Pro — 100 pages\n` +
    `🏢 Ultra — 200 pages\n\n` +
    `👉 Open <b>👤 My Status</b> to upgrade your plan.`,

    // ── Unlock ────────────────────────────────────────────────────────────────
    ask_unlock_password: `🔓 <b>Unlock PDF</b>\n\n` +
    `🔑 Enter the password for this PDF.\n\n` +
    `I'll remove the password protection.\n\n` +
    `👇 <i>Enter your password:</i>`,

    ask_unlock_method: `🔓 <b>Unlock PDF</b>\n\n` +
    `How was this PDF protected?`,

    ask_unlock_key: `🔑 <b>Private Key Required</b>\n\n` +
    `📄 Send the <code>private_key.pem</code> file you received when you protected this PDF.`,

    // ── Split ────────────────────────────────────────────────────────────────
    ask_split_pages: `✂️ <b>Split PDF</b>\n\n` +
    `✍️ Enter the page numbers you want to extract.\n\n` +
    `<i>Examples:</i>\n` +
    `• <code>5-12</code> — pages 5 to 12\n` +
    `• <code>5-12 13-24 25-28</code> — multiple ranges\n` +
    `• <code>1,3,5,12</code> — individual pages`,

    ask_merge_mode: `🔗 <b>Merge PDFs</b>\n\n` +
    `Choose how you want to add your PDF files:`,

    ask_merge_files: `📄 <b>One by One</b>\n\n` +
    `The first PDF has been added.\n\n` +
    `📄 Send more PDF files.\n` +
    `When you're ready, press <b>✅ Merge Files</b>.`,

    ask_merge_archive: `📦 <b>Archive</b>\n\n` +
    `Send one archive with PDF files inside.\n\n` +
    `Supported formats:\n` +
    `<code>.zip</code> <code>.rar</code> <code>.7z</code> <code>.tar.gz</code> <code>.tar.xz</code>\n\n` +
    `The PDF files will be merged in filename order.`,

    ask_merge_bulk: `🗂 <b>Multiple PDFs</b>\n\n` +
    `Send all PDF files together or one by one.\n\n` +
    `When you've sent them all, type <code>yes</code> to start merging.`,

    // ── Progress ──────────────────────────────────────────────────────────────
    compressing: `🗜 <b>Compressing your PDF...</b>\n\n` +
    `This may take some time for large files.`,

    encrypting: `🔐 <b>Protecting your PDF...</b>\n\n` +
    `Please wait.`,

    decrypting: `🔓 <b>Unlocking your PDF...</b>\n\n` +
    `Please wait.`,

    // ── Results ───────────────────────────────────────────────────────────────
    success_protect: `✅ <b>Your PDF is protected.</b>\n\n` +
    `🔑 Keep your password safe.\n` +
    `Without it, the PDF cannot be unlocked.`,

    success_unlock: `✅ <b>Your PDF has been unlocked.</b>`,

    success_compress: `✅ <b>Your PDF has been compressed.</b>\n\n` +
    `📄 Original size: <b>{{before}}</b>\n` +
    `📦 New size: <b>{{after}}</b>\n` +
    `💾 Space saved: <b>{{saved}}</b>`,

    merge_file_queue: `✅ <b>PDF added.</b>\n\n` +
    `📄 Send another PDF or press <b>✅ Merge Files</b>.\n\n` +
    `Files in queue: <b>`,
    merge_bulk_received: `✅ <b>{{count}}</b> PDF files received.\n\n` +
    `📄 Send more PDF files, or type <b>yes</b> when you're ready to merge them.`,
    merged_from_archive: `✅ PDFs merged from archive: `,
    merge_zip_success: `📦 <b>All PDF files have been packed into one ZIP archive.</b>`,
    merge_confirm_words: ` PDF files ready.\nPress <b>✅ Merge Files</b> to continue.`,

    split_caption_success_file: `✂️ <b>Extracted Pages (Single PDF)</b>\n\n` +
    `⚠️ <i>Some complex PDF files may not display correctly. ` +
    `For the most reliable result, use the ZIP archive below.</i>\n\n` +
    `Pages: `,

    split_caption_success_zip: `📦 <b>Extracted Pages (ZIP Archive)</b>\n\n` +
    `✅ Recommended for the best compatibility.\n\n` +
    `Pages: `,

    fail_unlock: `❌ <b>Wrong password.</b>\n\n` +
    `Please check your password and try again.`,

    file_lost: `❌ <b>The file is no longer available.</b>\n\n` +
    `Please upload it again.`,

    merge_not_enough_files: `⚠️ <b>Not enough PDF files.</b>\n\n` +
    `Please send at least <b>2 PDF files</b> to merge them.`,


    merge_fallback: `⚠️ <b>I couldn't merge these PDF files into one document.</b>\n\n` +
    `Several merge methods were tried, but the files could not be combined safely.\n\n` +
    `📦 Instead, I created PDF files with up to 10 pages each and packed them into a ZIP archive.\n\n` +
    `Each PDF is also included separately.`,

    // ── Metadata ──────────────────────────────────────────────────────────────
    metadata_reading: `🔍 <b>Checking your PDF...</b>`,

    metadata_wiping: `🧹 <b>Removing metadata...</b>\n\n` +
    `This may take some time for large files.`,

    metadata_found_title: `🔎 <b>Metadata found</b>\n` +
    `━━━━━━━━━━━━━━━━━━`,

    metadata_empty: `✅ <b>No metadata found.</b>\n\n` +
    `Your PDF is already clean.`,

    metadata_watermark_found: `🏷 <b>Watermark detected.</b>\n` +
    `It will be removed.`,

    metadata_signature_found: `🔏 <b>Digital signature detected.</b>\n\n` +
    `This PDF contains a digital signature.\n` +
    `It may become invalid after removing metadata.`,

    metadata_mode_ask: `🧹 <b>Choose what to remove:</b>\n\n` +
    `<b>1</b> — Metadata only <i>(digital signature stays valid ✅)</i>\n` +
    `<b>2</b> — Metadata + digital signature <i>(the signature will no longer be valid ⚠️)</i>\n\n` +
    `✍️ Type <b>1</b> or <b>2</b>:`,

    metadata_mode_invalid: `⚠️ Please type <b>1</b> or <b>2</b>.`,

    metadata_confirm_ask: `⚠️ <b>This action cannot be undone.</b>\n\n` +
    `All metadata will be permanently removed.\n\n` +
    `✍️ Type <b>yes</b> to continue:`,

    metadata_confirm_keep_sig: `⚠️ <b>Metadata will be removed.</b>\n\n` +
    `Your digital signature will stay valid.\n\n` +
    `This action cannot be undone.\n\n` +
    `✍️ Type <b>yes</b> to continue:`,

    metadata_confirm_full_wipe: `⚠️ <b>Metadata and the digital signature will be removed.</b>\n\n` +
    `After this, the digital signature will no longer be valid.\n\n` +
    `This action cannot be undone.\n\n` +
    `✍️ Type <b>yes</b> to continue:`,

    metadata_wipe_success: `✅ <b>Done!</b>\n\n` +
    `The selected data has been removed.\n\n` +
    `Choose your next action:`,

    ask_long_image_mode: `📜 <b>PDF to Long Image</b>\n\nChoose how you want to create your long image:`,

    ask_long_image_bulk: `📄 <b>One PDF = One Page mode</b>\n\n` +
    `Send up to <b>25 PDF files</b> — one by one or as a group.\n` +
    `Each PDF will contribute one page to the long image.\n\n` +
    `⚠️ If a PDF has more than 1 page, I'll take one page from it and let you know.\n\n` +
    `When you're done sending files, type <b>yes</b> to confirm.`,

    long_image_bulk_file_added: `✅ File added! (<b>{{count}}/{{max}}</b>)\n\nSend more or type <b>yes</b> when done.`,

    long_image_bulk_received: `📥 Received <b>{{count}}</b> files so far.\n\nDone? Type <b>yes</b> to proceed, or keep sending files.`,

    long_image_bulk_confirm_words: `files ready. Press the button to create the long image.`,

    long_image_bulk_no_files: `⚠️ No files yet. Please send at least one PDF first.`,

    long_image_bulk_limit_reached: `⚠️ <b>Limit reached.</b>\n\nYou can send up to <b>25 files</b> maximum. Type <b>yes</b> to proceed with the current files.`,

    long_image_bulk_warning: `⚠️ <b>Note:</b> The following files had more than 1 page — I took one page from each:\n{{files}}\n\nIf this doesn't look right to you, please don't put me in the blacklist 🙏`,

    processing_timeout: `⚠️ <b>Our PDF processor noticed this file has been running for over 20 minutes.</b>\n\n` +
    `This shouldn't happen — most files take 1 to 5 minutes, never 20. So I force-stopped the processing.\n\n` +
    `Please send the file again.\n\n` +
    `If the same error happens again, please contact the developer via /support.`,

    worker_technical_error: `❌ <b>Something went wrong while processing your file.</b>\n\nPlease try again. If this keeps happening, contact the developer via /support.`,

    server_busy: `⏳ <b>The server is under heavy load right now.</b>\n\nYour file wasn't lost — please try again in a minute or two.`,

    // ── Cancel ────────────────────────────────────────────────────────────────
    cancel_confirm_ask: `⚠️ <b>Stop this process?</b>\n\n` +
    `You won't receive the result of this operation.\n` +
    `<b>50%</b> of the file's size will still be counted as traffic.\n\n` +
    `You'll need to upload the file again.\n\n` +
    `Continue?`,

    cancelled: `❌ <b>Processing stopped.</b>\n\n` +
    `50% of the file's size was counted toward your traffic.\n\n` +
    `Please upload the file again to try once more.`,

    // ── Extract / Search — free, no limit ────────────────────────────────────
    ask_extract_mode: `📤 <b>What do you need from this PDF?</b>\n\n` +
    `Free, no limit on any of these.`,

    extracting_text:   `📝 <b>Extracting text...</b>`,
    extracting_images: `🖼 <b>Extracting images...</b>`,
    searching_text:    `🔍 <b>Searching...</b>`,

    ask_search_query: `🔍 <b>What do you want to find?</b>\n\n` +
    `Search is case sensitive — <code>Word</code> and <code>word</code> are treated as different.`,

    success_extract_text: `📝 <b>Text extracted.</b>`,
    success_extract_images: `🖼 <b>Images extracted.</b>`,

    extract_no_text: `⚠️ <b>No extractable text found in this file.</b>\n\n` +
    `This usually means the PDF is a scan (an image of text, not real text).`,

    extract_no_images: `⚠️ <b>No embedded images found in this file.</b>`,

    extract_scanned_no_images: `⚠️ <b>This PDF is a scan.</b>\n\n` +
    `The whole page is one big image — there's nothing to extract as a separate "image", it would just be a copy of the document.`,

    extract_file_too_large: `⚠️ <b>File too large for Extract/Search.</b>\n\n` +
    `This free feature has its own size limit 500MB file size maximum — please try a smaller file.`,

    extract_output_too_large: `⚠️ <b>Too much text to extract.</b>\n\n` +
    `The extracted text crossed 1GB partway through — that's hundreds of thousands to millions of words, you wouldn't be able to find what you need in it anyway. Processing was stopped.`,

    search_empty_query: `⚠️ Send some text to search for.`,

    search_no_matches: `🔍 <b>No matches found.</b>`,

    search_results_header: `🔍 <b>Search results</b>\n\n` +
    `Found: {{total}} match{{plural}}\n`,

    search_truncated_note: `\n<i>Showing the first {{shown}} — refine your search for a more precise result.</i>`,
    ask_rename: `✏️ <b>What should this file be called?</b>\n\n` +
    `Just the name — no need to type ".pdf".`,

    success_rename: `✏️ <b>Renamed.</b>`,
    page_out_of_range: `⚠️ <b>Page {{page}} doesn't exist.</b>\n\n` +
    `This document only has {{total}} pages.`,

    // ── Pre-action info — общий шаблон, второе сообщение с задержкой ──────────
    pre_action_info: `👤 <b>{{name}}</b> (@{{username}}, ID: <code>{{id}}</code>)\n` +
    `💎 Plan: <b>{{plan}}</b>\n` +
    `💾 Traffic: <b>{{used}} / {{limit}}</b>\n\n` +
    `📊 <b>Available here:</b>\n{{availability}}\n\n` +
    `⚠️ If something goes wrong, the developer is automatically notified about the error.\n` +
    `Have a personal issue, or want to reach out directly? Write here via /support or email <code>{{supportEmail}}</code>.`,

    traffic_used_summary: `📊 You used <b>+{{amount}} MB</b> of traffic on this operation.`,

    btn_need_more: `📦 Need more? Get a one-time package from $1`,

    // ── Per-action rules text — правило пользования, показывается первым,
    // не удаляется. Пилот на Compress, остальные добавляются по мере роллаута.
    compress_rules: `🗜 <b>Compress</b>\n\n` +
    `📋 How it works:\n` +
    `• Upload a PDF file\n` +
    `• We reduce its file size while keeping it readable\n` +
    `• You'll get back a smaller PDF, ready to share\n\n` +
    `📤 Upload your PDF now.`,

    counting_words: `📊 <b>Counting words...</b>`,

    word_count_result: `📊 <b>Word Count</b>\n\n` +
    `📝 Words: <b>{{words}}</b>\n` +
    `🔤 Characters: <b>{{chars}}</b>\n` +
    `📄 Lines: <b>{{lines}}</b>`,

    // ── Merge from archive — duplicates ──────────────────────────────────────
    duplicates_skipped: `⚠️ Skipped {{count}} duplicate file(s): {{names}}`,

    // ── Images to PDF (photo path — Free/Starter) ────────────────────────────
    images_rules_photo: `🖼 <b>Images to PDF</b>\n\n` +
    `📋 Your rules:\n` +
    `• Formats: <b>JPG, PNG only</b>\n` +
    `• Up to <b>{{limit}}</b> photos per week\n` +
    `• Used so far: <b>{{used}}/{{limit}}</b>\n` +
    `• Uploading as a file (document) isn't accepted — send as a photo\n` +
    `• Free output includes a watermark page and embedded metadata\n\n` +
    `📸 Send your photos now, one by one.`,

    images_rules_document: `🖼 <b>Images to PDF</b>\n\n` +
    `📋 Your rules:\n` +
    `• Formats: <b>{{formats}}</b>\n` +
    `• Up to <b>{{limit}}</b> images per week\n` +
    `• Used so far: <b>{{used}}/{{limit}}</b>\n` +
    `• Sent as a document — full quality, no compression\n` +
    `• No watermark, no metadata — your plan covers that\n\n` +
    `📄 Send your image files now, one by one.`,

    images_use_document_instead: `⚠️ <b>Your plan gives you full quality — don't waste it.</b>\n\n` +
    `Sending as a photo lets Telegram compress it first.\n` +
    `Upload it as a <b>file (document)</b> instead to keep full quality.`,

    images_document_not_available: `⚠️ <b>Uploading as a file isn't available on your plan.</b>\n\n` +
    `Send your images as regular photos instead, or upgrade for more formats and full quality.`,

    images_format_not_available: `⚠️ <b>This format isn't available on your plan.</b>\n\n` +
    `Your plan supports: <b>{{formats}}</b>\n\n` +
    `Upgrade for more formats.`,

    images_added: `✅ <b>Photo added.</b> Total: <b>{{count}}</b>\n\n` +
    `Send more, or tap "Create PDF" when done.`,

    images_batch_limit_reached: `⚠️ <b>You've reached your limit for this batch.</b>\n\n` +
    `Tap "Create PDF" to convert what you've sent so far.`,

    images_quota_exhausted: `⏳ <b>You've used all {{limit}} photos for this week.</b>\n\n` +
    `♻️ Resets: {{reset}}\n\n` +
    `Want more now? Upgrade your plan, or wait for the reset.`,

    converting_images: `🖼 <b>Converting your photos to PDF...</b>`,

    success_images_to_pdf: `✅ <b>Your PDF is ready!</b>`,

    images_too_large: `⚠️ <b>These images are too large to process.</b>\n\n` +
    `Please try again with smaller files or fewer images.`,

    please_wait: `⏳ Please wait for the current operation to finish.`,



    // ── Suffixes ──────────────────────────────────────────────────────────────
    suffix_compressed:     '_COMPRESSED',
    suffix_protected:      '_PROTECTED',
    suffix_encrypted:      '_ENCRYPTED',
    suffix_unlocked:       '_UNLOCKED',
    suffix_metadata_clean: '_CLEAN',

} as const;
