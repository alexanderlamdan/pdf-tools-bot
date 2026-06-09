export const queue = {

    heavy_task_warning: '⚠️ <b>Warning:</b> This is a heavy task and will push the server to its limits. Processing will take from 1 to 120 minutes depending on the number of pages, fonts, and images. Please wait.',

    position: '⏳ Task added to queue.\nYour position: <b>{{position}}</b>.',

    vip_warning:        '🛑 <b>Warning:</b> You are overusing the bot. Please leave server capacity for other users to prevent crashes! Your VIP priority has been temporarily reduced.',
    vip_blocked:        '🚫 <b>Access restricted:</b> You ignored the warning. To protect the server from overloading, your VIP functions have been temporarily blocked.',
    vip_message_notice: '🚫 <b>Access temporarily restricted.</b>\nThe server is cooling down from your tasks. Please wait another time',
    vip_unblock_notice: '✅ <b>Access restored!</b>\nPlease send large files one by one to avoid overloading the server',

    file_upload: '⏳ File has big size. Starting processing and analysis in background... You will get the message after it complete',

    compress_exclusive_start: '🗜 <b>Compression started.</b>\n\nAll server resources are focused on your file. This may take up to 5 minutes. You can close the bot — you will receive the file when compression is complete.',
    compress_timeout:         '❌ <b>Compression cancelled.</b>\n\nThe file is too complex and the server reached its limit. Unfortunately, no tool can compress this file better than we tried. We sincerely apologize for the inconvenience.',
    compress_already_optimal: '✅ <b>File is already optimized!</b>\n\nCompression would not reduce the size — the file is already at its minimum. Returning original.',
    compress_active_warning:  '⏳ <b>Heads up!</b>\n\nSomeone just started a large compression job and the server is fully focused on it.\n\nYour task is still in queue and will start automatically when compression is done. You can close the bot — we\'ll send you the result when it\'s ready.',
    task_already_running: `⏳ <b>Your task is already running.</b>\n\nPlease wait — I'll send you the result as soon as it's ready.`,

} as const;
