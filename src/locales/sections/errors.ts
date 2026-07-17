export const errors = {

    not_pdf: `⛔️ <b>This isn't a PDF file.</b>\n\n` +
    `📄 Please send a PDF file.`,

    text_rejected: `⛔️ <b>Text isn't supported here.</b>\n\n` +
    `📄 Please send a PDF file.`,

    worker_fail: `❌ <b>I couldn't process your PDF.</b>\n\n` +
    `Please try again in a moment.\n` +
    `If the problem continues, use /feedback to contact me.`,

    password_empty: `⚠️ <b>Password required.</b>\n\n` +
    `🔑 Please enter a password.`,

    password_weak: `⚠️ <b>Password is too short.</b>\n\n` +
    `🔑 Please use at least <b>8 characters</b>.`,

    language_not_supported: `🌍 <b>This language isn't supported yet.</b>\n\n` +
    `More languages will be added in future updates.`,

    pdf_archive: `❌ <b>No PDF files found.</b>\n\n` +
    `The archive doesn't contain any PDF files.`,

    single_pdf_archive: `⚠️ <b>Only one PDF file found.</b>\n\n` +
    `At least <b>2 PDF files</b> are required to merge them.`,

    error_proccesing_archive: `❌ <b>Couldn't process the archive.</b>\n\n` +
    `Reason: `,

    not_archive: `⚠️ <b>Please send a supported archive.</b>\n\n` +
    `Supported formats:\n` +
    `<code>.zip</code> <code>.rar</code> <code>.7z</code> <code>.tar.gz</code> <code>.tar.xz</code>`,

    archive_too_large: `❌ <b>Archive is too large.</b>\n\n` +
    `The maximum file size is <b>2 GB</b>.\n` +
    `This is a Telegram API limit and cannot be increased.`,

    archive_heavy_processing: `⚠️ <b>This archive contains more than 2 GB of PDF files.</b>\n\n` +
    `Processing may take from <b>1 minute</b> to <b>4 hours</b>, depending on the files.\n` +
    `Most jobs finish much sooner.\n\n` +
    `💬 You'll receive a message here as soon as everything is ready.`,

    pdf_empty: `❌ <b>This PDF is empty.</b>\n\n` +
    `The file doesn't contain any pages.\n` +
    `Please send another PDF.`,

    server_overloaded: `⏳ <b>The server is currently under heavy load.</b>\n\nPlease try sending your file again in a few minutes.`,


} as const;
