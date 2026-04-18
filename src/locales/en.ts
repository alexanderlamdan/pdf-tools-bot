export default {
  buttons: {
    main: {
      btn_status: "👤 My Status",
      btn_help: "❓ Help",
    },
    admin: {
      adm_btn_stats: "📈 Admin: Stats",
      adm_btn_logs: "📜 Admin: Logs",
    },
    files: {
      btn_compress: "🗜 Compress",
      btn_convert: "🔄 Convert to PDF",
      btn_merge: "🔗 Merge",
      btn_split: "✂️ Split",
      btn_extract: "🖼 Extract Img/Text",
      btn_protect: "🔐 Protect",
      btn_unlock: "🔓 Unlock",
      btn_watermark: "Your © Watermark",
      btn_repair: "🚑 Repair",
      btn_to_long_image: "📜 To Long Image",
      btn_metadata_wiper: "🧹 Wipe Metadata",
      btn_execute_merge: "✅ Merge files",
      btn_merge_one_by_one: '📄 One by one (up to 10)',
      btn_merge_archive:    '📦 Upload archive',
      btn_merge_bulk:       '🗂 All files at once',
      btn_bot_watermark: "🤖 Bot Watermark + URL"
    },
    common: {
      btn_cancel: "❌ Cancel",
    },
    subscription: {
      back: "◀️ All plans",
      buy: "💳 Buy {{name}}",
    },
  },

  messages: {
    start:
      "👋 <b>Hello!</b> I am PDF Actions Bot.\n\nI can merge, split, and compress your PDF files.\nJust send a PDF file to check it.",

    help: `📚 <b>PDF Tools Bot Help</b>

<b>I only work with PDF:</b>
✅ <b>Analysis:</b> Malware and structure check.
✅ <b>Protection:</b> AES-256 encryption.
✅ <b>Cracking:</b> Password recovery.
✅ <b>Compression:</b> Smart optimization.

<b>How to use:</b>
1. Send a <b>PDF file</b>.
2. Wait for the analysis.
3. Select an action.`,

    about: `This bot provides the best tools for processing and working with PDF files in a secured Linux server environment.

All your files interact directly with the bot's server, bypassing Telegram's data centers thanks to our local API setup. This ensures maximum privacy.

Your files are stored in an isolated file system where no one has access, and they are deleted immediately after processing and being delivered back to you.

Each user's files are kept in separate, isolated folders regardless of the number of files uploaded.

Every 12 hours, all files stored in the folders are cleared. Therefore, I recommend downloading and saving your files to your phone or computer immediately so you don't lose them.

The bot does not see, know, or receive any of your data except what is necessary to improve performance, maintain security, and protect the server to provide you with the best and most convenient user experience.`,

    analysis: {
      result_title: "🔎 <b>File Analysis</b>\n━━━━━━━━━━━━━━━━━━",
      field_name: "📄 <b>Name:</b> {{name}}",
      field_size: "💾 <b>Size:</b> {{size}}",
      field_pages: "📑 <b>Pages:</b> {{pages}}",
      field_author: "👤 <b>Author:</b> {{author}}",
      field_encrypted: "🔐 <b>Password:</b> {{encrypted}}",
      field_type: "📦 <b>Type:</b> {{type}}",
      field_actions:
        "⚙️ <b>Actions:</b>\n  ├ 🗜 Compress: {{compress}}\n  ├ ✂️ Split: {{split}}\n  ├ 🔗 Merge: {{merge}}\n  └ 🧹 Clear Metadata: {{meta}}",
      type_scanned: "📸 <b>SCAN (Images only)</b>",
      type_standard: "📝 <b>Standard (Text+Images)</b>",
      type_vector: "📐 <b>Vector / Drawing</b>",
      val_yes: "✅ Yes",
      val_no: "❌ No",
      val_scanned: "❌ (Already an image)",
      val_reason: "❌ No ({{reason}})",
      processing:
        "🔍 <b>Checking the file...</b>\nScanning for viruses and structure.",
      success:
        "✅ <b>File checked!</b>\n\n📄 <b>Name:</b> {{name}}\n📏 <b>Size:</b> {{size}} MB\n📑 <b>Pages:</b> {{pages}}\n🔐 <b>Encrypted:</b> {{protected}}\n\n👇 <i>Choose an action:</i>",
      encrypted:
        "🔒 <b>File has password!</b>\n\nI cannot process this file while it is locked.\n👇 <i>Click «Unlock» to try removing the password.</i>",
      corrupt: "❌ <b>File corrupted!</b>\nInvalid PDF structure.",
    },

    status: {
      user: {
        title: "👤 <b>MY STATUS</b>\n\n",
        name: "Name",
        role: "Role",
        usage: "Usage",
        stats: "Statistics",
        plan: "Plan",
        ends: "Valid until",
        joined:'Member since',
        reset: 'Next traffic reset'
      },
      admin: {
        title: "👑 <b>ADMIN STATUS</b>\n\n",
        global_stats: "Global Activity",
        traffic: "Total Traffic",
        subs: "Subscribers",
      },
      actions: {
        upload: "📂 Uploaded",
        compress: "🗜 Compressed",
        unlock: "🔓 Unlocked",
        protect: "🔐 Protected",
        crack: "🕵️‍♂️ Cracked",
        split: "✂️ Split",
        merge: "🔗 Merged",
        metadata_wipe: 'Metadata wiped',
      },
      subscriptions: {
        no_sub: "Free",
        pro: "Pro subscription",
        premium: "Premium subscription",
        unlimited: "Unlimited for VIP",
        enterprise: "Enterprise subscription",
        sovereign_protocol: "Sovereign Protocol subscription",
        free_storage: "2 GB",
        pro_storage: "12 GB",
        premium_storage: "24 GB",
        enterprise_storage: "48 GB",
        sovereign_protocol_storage: "90 GB",
        free_role: "Free",
        pro_role: "Pro",
        premium_role: "Premium",
        enterprise_role: "Enterprise",
        sovereign_protocol_role: "Sovereign Protocol",
        vip_role: "VIP",
        free_admin_role: 'Free Admin',
      },
      empty: "No activity yet",
      error: "Error loading profile",
    },

    actions: {
      ask_compress: "Send me the PDF file you want to compress.",
      ask_protect:
        "🔐 <b>Set Password</b>\n👇 <i>Send the password as a text message:</i>",
      ask_unlock: "Send me the PDF file to unlock.",
      compressing: "🗜 <b>Compressing...</b>\nThis may take a few seconds.",
      encrypting: "🔐 Encrypting...",
      decrypting: "🔓 Decrypting...",
      cracking:
        "🕵️‍♂️ <b>Cracking password...</b>\nChecking 10k combinations (30-60s)...",
      success_protect: "✅ <b>File is now secure!</b>",
      success_crack: "🔓 <b>Success! Password:</b> <code>{{password}}</code>",
      success_compress:
        "✅ <b>Done!</b>\n📉 Before: {{before}}\n📉 After: {{after}}\n🔥 Saved: {{saved}}",
      fail_crack: "❌ <b>Failed.</b> Password is too strong.",
      fail_manual:
        "❌ <b>Dictionary failed.</b>\n👇 <i>Enter password manually if you know it:</i>",
      file_lost: "❌ Error: File lost. Please upload again.",
      suffix_compressed: "_COMPRESSED",
      suffix_protected: "_PROTECTED",
      suffix_repair: "_REPAIRED",
      suffix_unlocked: "_UNLOCKED",
      repair_warning: `⚠️ <b>Attention! Starting repair...</b>
      🛠 We will try to rebuild the file structure from scratch. During this process, <b>text may shift, fonts might change, or the layout could look a bit messy</b>.

      🛑 <i>Note:</i> There is a chance that strict programs (like Adobe Acrobat) still won't be able to read this file because the original background data is missing, but most browsers and simple readers will open it.

      ⏳ <i>Please wait...</i>`,
      repair_success:
        "✅ <b>File successfully saved and restored!</b>\n\nIt is now stored in the bot's memory. Choose what you would like to do with it next:",
      repair_fail:
        "❌ <b>We're very sorry, but this file cannot be restored.</b>\n\nWe've tried all available methods, but the document structure is completely destroyed or critical data is missing. It's impossible to save this file. 🙏",
      ask_split_pages: `✂️ <b>Split PDF</b>
        Send the page numbers you want to extract as text in line with spaces. I will send you a convenient ZIP archive with the results.
        <i>Examples:</i>
        • <code>5-12 *(if you need to split more pages enter like this:  13-24 25-28 30-45)</code> (range)
        • <code>1, 3, 5, 12</code> (comma separated)`,
      ask_merge_files:
        "📥 <b>Merge Mode</b>\nFirst file added! Send the next PDF files here one by one in the desired order.\nWhen you're finished, press the <b>✅ Merge Files</b> button.",
      merge_not_enough_files:
        "⚠️ You need at least 2 files to merge. Please send more.",
      merge_file_queue:
        "✅ File added!\nSend the next one or press the 'Merge' button.\nTotal files in queue: ",
      split_caption_success_file:
        "✂️ <b>Extracted Pages (Single File):</b>\n⚠️ <i>Note: In very complex PDFs, display errors may occur in the merged file. Use the archive below to guarantee 100% integrity.</i>\n\nPages: ",
      split_caption_success_zip:
        "📦 <b>Page-by-page Archive (100% Reliable):</b>\nPages: ",
        ask_merge_mode:      '🔗 <b>How do you want to merge?</b>\n\nChoose a method:',
        ask_merge_archive:   '📦 <b>Archive mode</b>\nSend one archive (.zip, .rar, .7z, .tar.gz, .tar.xz) with PDF files inside.\nI will unpack and merge them sorted by filename.',
        ask_merge_bulk:      '🗂 <b>Bulk mode</b>\nSend all PDF files — one by one or as a group.\nWhen done, type <b>yes</b> to confirm.',
        merge_bulk_received: '✅ Received <b>{{count}}</b> files so far.\n\nAre you done? Reply <b>yes</b> to proceed, or keep sending files.',
        merge_fallback:      `❌ <b>We tried everything.</b>\n\nWe ran the merge through all available tools — qpdf, ghostscript, pdftk and pdfunite (the engine behind Adobe's own PDF tools). It is not possible to merge these files into a single PDF.\n\n📦 <b>Here's what we can do:</b> we split the result into parts of 10 pages each and packed them into a ZIP archive. Each part is also sent as a separate file.`,
        merged_from_archive:`✅ Merged files from archive: `,
        merge_zip_success:'📦 All parts in one archive',
        merge_confirm_words:' files ready. Press the button to merge.',
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
        suffix_metadata_clean:      '_CLEAN',
    },

    common: {
      yes: "Yes",
      no: "No",
      wait: "⏳ Processing...",
      in_development: "In development",
      technical_problem: "Technical problem:",
    },

    queue: {
      heavy_task_warning:
        "⚠️ <b>Warning:</b> This is a heavy task and will push the server to its limits. Processing will take from 1 to 120 minutes depending on the number of pages, fonts, and images. Please wait.",
      position: "⏳ Task added to queue.\nYour position: <b>{{position}}</b>.",
      vip_warning:
        "🛑 <b>Warning:</b> You are overusing the bot. Please leave server capacity for other users to prevent crashes! Your VIP priority has been temporarily reduced.",
      vip_blocked:
        "🚫 <b>Access restricted:</b> You ignored the warning. To protect the server from overloading, your VIP functions have been temporarily blocked.",
      vip_message_notice:
        "🚫 <b>Access temporarily restricted.</b>\nThe server is cooling down from your tasks. Please wait another time",
      vip_unblock_notice:
        "✅ <b>Access restored!</b>\nPlease send large files one by one to avoid overloading the server",
      file_upload:
        "⏳ File has big size. Starting processing and analysis in background... You will get the message after it complete",
      compress_exclusive_start:  '🗜 <b>Compression started.</b>\n\nAll server resources are focused on your file. This may take up to 5 minutes. You can close the bot — you will receive the file when compression is complete.',
      compress_timeout:          '❌ <b>Compression cancelled.</b>\n\nThe file is too complex and the server reached its limit. Unfortunately, no tool can compress this file better than we tried. We sincerely apologize for the inconvenience.',
      compress_already_optimal:  '✅ <b>File is already optimized!</b>\n\nCompression would not reduce the size — the file is already at its minimum. Returning original.',
      compress_active_warning: '⏳ <b>Heads up!</b>\n\nSomeone just started a large compression job and the server is fully focused on it.\n\nYour task is still in queue and will start automatically when compression is done. You can close the bot — we\'ll send you the result when it\'s ready.'
    },

    // ── Subscription ──────────────────────────────────────────────────────────
    subscription: {
      limit_exceeded: `🚫 <b>Your free traffic limit is exhausted.</b>

You have used all <b>2 GB</b> of your free plan.
Choose a subscription to continue using the bot:`,

      done_but_exceeded: `✅ Done! The operation was completed successfully.

🚫 <b>However, your free traffic limit has been reached.</b>
To receive this file and continue, please choose a plan:`,

      choose_plan: "💳 Choose a subscription plan:",

      plans: {
        free: `🆓 <b>Free Plan</b>
 
📦 Up to 2 GB file size (Telegram limit)
📊 2 GB monthly traffic
🔧 All tools unlocked
🗑 Files deleted immediately after delivery
🚶 Basic queue
 
<i>Free forever. No credit card required.</i>`,
 
    pro: `⚡️ <b>Pro Plan — $10/month</b>
 
📦 Up to 2 GB file size (Telegram limit)
📊 12 GB monthly traffic
🔧 All tools unlocked
🖼 Your own watermark
⚡️ Pro queue (priority over free users)
🗑 Files deleted immediately after delivery
 
<i>Best choice for personal use.</i>`,
 
    premium: `💎 <b>Premium Plan — $25/month</b>
 
📦 Up to 2 GB file size (Telegram limit)
📊 24 GB monthly traffic
🔧 All tools unlocked
🖼 Your own watermark
💎 Premium queue
🎧 Priority support via /support
🗑 Files deleted immediately after delivery
 
<i>Perfect for heavy daily use.</i>`,
 
    enterprise: `🏢 <b>Enterprise Plan — $75/month</b>
 
📦 Up to 2 GB file size (Telegram limit)
📊 48 GB monthly traffic
🔧 All tools unlocked
🖼 Your company watermark
🚀 No queue — instant processing
🎧 Dedicated support
🗑 Files deleted immediately after delivery
 
<i>Designed for businesses and teams.</i>`,
 
    sovereign_protocol: `👑 <b>Sovereign Protocol — $3,000/month</b>
 
📦 Up to 2 GB file size (Telegram limit)
📊 90 GB monthly traffic
🔧 All tools unlocked
🚀 No queue — instant processing
💬 Personal communication with developer
🗑 Files deleted immediately after delivery
 
<i>For those who demand the absolute maximum.\nContact via /support → Business inquiry.</i>`,
      },
      traffic_warning: `⚠️ <b>Heads up!</b> You have <b>{{remain}}</b> of free traffic left.\nConsider upgrading to keep working without interruptions.`
    },
  },

  errors: {
    not_pdf: "⛔️ <b>Error:</b> This is not a PDF file",
    spam_warning: "✋ <b>Stop spamming!</b>",
    text_rejected: "⛔️ <b>Send a PDF file</b>, not text.",
    worker_fail: "❌ Analysis failed.",
    password_empty: "Password cannot be empty.",
    password_weak: "Minimum 8 chars required.",
    language_not_supported: "Your language is not supported for now",
    pdf_archive:`❌ No PDF files found inside the archive.`,
    single_pdf_archive:`⚠️ Only 1 PDF found in archive. Need at least 2 to merge.`,
    error_proccesing_archive:`❌ Error processing archive:`,
    not_archive: '⚠️ Please send an archive file (.zip, .rar, .7z, .tar.gz, .tar.xz)'
  },
} as const;
