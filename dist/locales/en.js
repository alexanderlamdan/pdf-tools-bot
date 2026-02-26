export default {
    buttons: {
        main: {
            btn_status: "👤 My Status",
            btn_help: "❓ Help",
        },
        admin: {
            adm_btn_stats: "📈 Admin: Stats",
            adm_btn_logs: "📜 Admin: Logs",
            adm_btn_reload: "🔄 Admin: Reload",
        },
        files: {
            btn_compress: "🗜 Compress",
            btn_convert: "🔄 Convert to PDF",
            btn_merge: "🔗 Merge",
            btn_split: "✂️ Split",
            btn_extract: "🖼 Extract Img/Text",
            btn_protect: "🔐 Protect",
            btn_unlock: "🔓 Unlock",
            btn_watermark: "© Watermark",
            btn_repair: "🚑 Repair",
            btn_to_long_image: "📜 To Long Image",
            btn_metadata_wiper: "🧹 Wipe Metadata",
            btn_execute_merge: "✅ Merge files",
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
        start: "👋 <b>Hello!</b> I am PDF Actions Bot.\n\nI can merge, split, and compress your PDF files.\nJust send a PDF file to check it.",
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
            field_actions: "⚙️ <b>Actions:</b>\n  ├ 🗜 Compress: {{compress}}\n  ├ ✂️ Split: {{split}}\n  ├ 🔗 Merge: {{merge}}\n  └ 🧹 Clear Metadata: {{meta}}",
            type_scanned: "📸 <b>SCAN (Images only)</b>",
            type_standard: "📝 <b>Standard (Text+Images)</b>",
            type_vector: "📐 <b>Vector / Drawing</b>",
            val_yes: "✅ Yes",
            val_no: "❌ No",
            val_scanned: "❌ (Already an image)",
            val_reason: "❌ No ({{reason}})",
            processing: "🔍 <b>Checking the file...</b>\nScanning for viruses and structure.",
            success: "✅ <b>File checked!</b>\n\n📄 <b>Name:</b> {{name}}\n📏 <b>Size:</b> {{size}} MB\n📑 <b>Pages:</b> {{pages}}\n🔐 <b>Encrypted:</b> {{protected}}\n\n👇 <i>Choose an action:</i>",
            encrypted: "🔒 <b>File has password!</b>\n\nI cannot process this file while it is locked.\n👇 <i>Click «Unlock» to try removing the password.</i>",
            corrupt: "❌ <b>File corrupted!</b>\nInvalid PDF structure.",
        },
        status: {
            user: {
                title: "👤 <b>MY STATUS</b>\n\n",
                name: "Name",
                role: "Role",
                usage: "Usage",
                stats: "Stats",
                plan: "Plan",
                ends: "Ends",
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
            },
            empty: "No activity yet",
            error: "Error loading profile",
        },
        actions: {
            ask_compress: "Send me the PDF file you want to compress.",
            ask_protect: "🔐 <b>Set Password</b>\n👇 <i>Send the password as a text message:</i>",
            ask_unlock: "Send me the PDF file to unlock.",
            compressing: "🗜 <b>Compressing...</b>\nThis may take a few seconds.",
            encrypting: "🔐 Encrypting...",
            decrypting: "🔓 Decrypting...",
            cracking: "🕵️‍♂️ <b>Cracking password...</b>\nChecking 10k combinations (30-60s)...",
            success_protect: "✅ <b>File is now secure!</b>",
            success_crack: "🔓 <b>Success! Password:</b> <code>{{password}}</code>",
            success_compress: "✅ <b>Done!</b>\n📉 Before: {{before}}\n📉 After: {{after}}\n🔥 Saved: {{saved}}",
            fail_crack: "❌ <b>Failed.</b> Password is too strong.",
            fail_manual: "❌ <b>Dictionary failed.</b>\n👇 <i>Enter password manually if you know it:</i>",
            file_lost: "❌ Error: File lost. Please upload again.",
            suffix_compressed: "_COMPRESSED",
            suffix_protected: "_PROTECTED",
            suffix_repair: "_REPAIRED",
            suffix_unlocked: "_UNLOCKED",
            repair_warning: `⚠️ <b>Attention! Starting repair...</b>

🛠 We will try to rebuild the file structure from scratch. During this process, <b>text may shift, fonts might change, or the layout could look a bit messy</b>.

🛑 <i>Note:</i> There is a chance that strict programs (like Adobe Acrobat) still won't be able to read this file because the original background data is missing, but most browsers and simple readers will open it.

⏳ <i>Please wait...</i>`,
            repair_success: "✅ <b>File successfully saved and restored!</b>\n\nIt is now stored in the bot's memory. Choose what you would like to do with it next:",
            repair_fail: "❌ <b>We're very sorry, but this file cannot be restored.</b>\n\nWe've tried all available methods, but the document structure is completely destroyed or critical data is missing. It's impossible to save this file. 🙏",
            ask_split_pages: `✂️ <b>Split PDF</b>

Send the page numbers you want to extract as text in line with spaces. I will send you a convenient ZIP archive with the results.
<i>Examples:</i>
• <code>5-12 *(if you need to split more pages enter like this:  13-24 25-28 30-45)</code> (range)
• <code>1, 3, 5, 12</code> (comma separated)`,
            ask_merge_files: "📥 <b>Merge Mode</b>\nFirst file added! Send the next PDF files here one by one in the desired order.\nWhen you're finished, press the <b>✅ Merge Files</b> button.",
            merge_not_enough_files: "⚠️ You need at least 2 files to merge. Please send more.",
            merge_file_queue: "✅ File added!\nSend the next one or press the 'Merge' button.\nTotal files in queue: ",
            split_caption_success_file: "✂️ <b>Extracted Pages (Single File):</b>\n⚠️ <i>Note: In very complex PDFs, display errors may occur in the merged file. Use the archive below to guarantee 100% integrity.</i>\n\nPages: ",
            split_caption_success_zip: "📦 <b>Page-by-page Archive (100% Reliable):</b>\nPages: ",
        },
        common: {
            yes: "Yes",
            no: "No",
            wait: "⏳ Processing...",
            in_development: "In development",
            technical_problem: "Technical problem:",
        },
        queue: {
            heavy_task_warning: "⚠️ <b>Warning:</b> This is a heavy task and will push the server to its limits. Processing will take from 2 to 20 minutes depending on the number of pages, fonts, and images. Please wait.",
            position: "⏳ Task added to queue.\nYour position: <b>{{position}}</b>.",
            vip_warning: "🛑 <b>Warning:</b> You are overusing the bot. Please leave server capacity for other users to prevent crashes! Your VIP priority has been temporarily reduced.",
            vip_blocked: "🚫 <b>Access restricted:</b> You ignored the warning. To protect the server from overloading, your VIP functions have been temporarily blocked.",
            vip_message_notice: "🚫 <b>Access temporarily restricted.</b>\nThe server is cooling down from your tasks. Please wait another ",
            vip_unblock_notice: "✅ <b>Access restored!</b>\nPlease send large files one by one to avoid overloading the server",
            file_upload: "⏳ File has big size. Starting processing and analysis in background... You will get the message after it complete",
        },
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
🗑 Secure delete from our server
🖼 Bot logo as watermark
🚶 Basic queue

<i>Free forever. No credit card required.</i>`,
                pro: `⚡️ <b>Pro Plan</b>

💰 <b>$5 / month</b>  or  <b>$35 / year</b>

📦 Up to 2 GB file size (Telegram limit)
📊 12 GB monthly traffic
🔧 All tools unlocked
🗑 Secure delete from server and bot
🖼 Your own watermark
⚡️ Pro queue (priority over free users)

<i>Best choice for personal use.</i>`,
                premium: `💎 <b>Premium Plan</b>

💰 <b>$15 / month</b>  or  <b>$70 / year</b>

📦 Up to 2 GB file size (Telegram limit)
📊 24 GB monthly traffic
🔧 All tools unlocked
🧹 Full log and file cleanup from bot and server
🖼 Your own watermark
💎 Premium queue
🎧 Premium support
🔑 Encrypted private key for secure files

<i>Perfect for heavy daily use.</i>`,
                enterprise: `🏢 <b>Enterprise Plan</b>

💰 <b>$45 / month</b>  or  <b>$360 / year</b>

📦 Up to 2 GB file size (Telegram limit)
📊 48 GB monthly traffic
🔧 All tools unlocked
🧹 Full activity cleanup from servers and bot chat history
🖼 Your company watermark
🚀 No queue — instant processing
🔒 Privacy support
🔑 Encrypted private key for secure files
💾 Files saved in secure folder for <b>30 days</b>

<i>Designed for businesses and teams.</i>`,
                sovereign_protocol: `👑 <b>Sovereign Protocol</b>

💰 <b>$3,000 / month</b>  or  <b>$12,000 / year</b>

📦 Up to 2 GB file size (Telegram limit)
📊 90 GB monthly traffic
🔧 All tools unlocked
🧹 Full activity cleanup from servers and bot chat history
🚫 Watermark removal
🧬 Metadata cleaning
🔐 Isolated queue in LUKS (encrypted filesystem)
🛡 End-to-end encrypted files (E2EE)
💬 Personal chat with developer for support
💾 Files saved in secure folder for <b>180 days</b>

<i>For those who demand the absolute maximum.</i>`,
            },
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
    },
};
