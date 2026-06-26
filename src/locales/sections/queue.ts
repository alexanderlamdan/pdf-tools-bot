export const queue = {

    heavy_task_warning: `⚠️ <b>This operation may take some time.</b>\n\n` +
    `Large PDF files with many pages, fonts, or images require more processing time.\n\n` +
    `⏳ Estimated time: <b>1 minute to 4 hours</b>.\n` +
    `Most files are completed much sooner.\n\n` +
    `💬 You don't need to wait here. I'll send you the result as soon as it's ready.`,

    position: `⏳ <b>Your task has been added to the queue.</b>\n\n` +
    `Current position: <b>#{{position}}</b>.`,

    vip_warning: `⚠️ <b>Server protection is active.</b>\n\n` +
    `You've started many large tasks in a short time.\n\n` +
    `To keep PDF Tools Bot fast and stable for everyone, your VIP priority has been temporarily reduced.\n\n` +
    `💬 It will be restored automatically.`,

    vip_blocked: `🚫 <b>VIP access has been temporarily paused.</b>\n\n` +
    `Too many large tasks were started in a short time.\n\n` +
    `This temporary limit helps keep the service stable for all users.\n\n` +
    `💬 Your VIP access will be restored automatically.`,

    vip_message_notice: `⏳ <b>Please wait a little longer.</b>\n\n` +
    `The server is still processing your previous tasks.\n\n` +
    `You'll be able to start new tasks again soon.`,

    vip_unblock_notice: `✅ <b>Your VIP access has been restored!</b>\n\n` +
    `Thank you for waiting.\n\n` +
    `💡 For the best performance, send large PDF files one at a time.`,

    file_upload: `⏳ <b>Large file detected.</b>\n\n` +
    `Your PDF is being processed in the background.\n` +
    `This may take some time for large files.\n\n` +
    `💬 You can close Telegram or continue using it.\n` +
    `I'll send you the result as soon as it's ready.`,

    compress_exclusive_start: `🗜 <b>Compression started.</b>\n\n` +
    `Your PDF is being compressed using all available processing power.\n\n` +
    `⏳ Processing may take from <b>1 minute</b> to <b>4 hours</b>, depending on the file.\n` +
    `Most PDF files are completed much sooner.\n\n` +
    `💬 You don't need to wait here.\n` +
    `I'll send your PDF as soon as it's ready.`,

    compress_timeout: `⚠️ <b>Your PDF has already been compressed as much as possible.</b>\n\n` +
    `I couldn't reduce the file size any further without noticeably affecting its quality.\n\n` +
    `Some tools may create a smaller PDF, but they often achieve this by reducing image quality, removing details, or making the document harder to read.\n\n` +
    `My goal is to keep your PDF as small as possible <b>while preserving its quality</b>.`,

    compress_already_optimal: `✅ <b>Your PDF is already optimized.</b>\n\n` +
    `Further compression would not reduce the file size without affecting quality.\n\n` +
    `📄 I'm returning your original PDF unchanged.`,

    compress_active_warning: `⏳ <b>Please wait.</b>\n\n` +
    `Another large PDF is currently being compressed.\n` +
    `Your task is safely waiting in the queue and will start automatically.\n\n` +
    `💬 You don't need to wait here.\n` +
    `I'll send you the result as soon as it's ready.`,

    task_already_running: `⏳ <b>Your task is already running.</b>\n\n` +
    `There's nothing else you need to do.\n\n` +
    `💬 I'll send you the result as soon as it's ready.`,

} as const;
