export const errors = {

    not_pdf: `⛔️ <b>This isn't a PDF file.</b>\n\n` +
    `📄 Please send me a PDF file.`,

    text_rejected: `⛔️ <b>I can't read text here.</b>\n\n` +
    `📄 Please send me a PDF file instead.`,

    password_empty: `⚠️ <b>I need a password.</b>\n\n` +
    `🔑 Please type one in.`,

    password_weak: `⚠️ <b>That password is too short.</b>\n\n` +
    `🔑 Please use at least <b>8 characters</b>.`,

    pdf_archive: `❌ <b>I didn't find any PDF files.</b>\n\n` +
    `This archive doesn't have any PDFs inside it.`,

    single_pdf_archive: `⚠️ <b>I only found one PDF file.</b>\n\n` +
    `I need at least <b>2 PDF files</b> to merge them together.`,

    error_proccesing_archive: `❌ <b>I couldn't open this archive.</b>\n\n` +
    `Reason: `,

    not_archive: `⚠️ <b>Please send me a file type I understand.</b>\n\n` +
    `I can open:\n` +
    `<code>.zip</code> <code>.rar</code> <code>.7z</code> <code>.tar.gz</code> <code>.tar.xz</code>`,

    archive_too_large: `❌ <b>This archive is too big for me.</b>\n\n` +
    `The biggest file I can accept is <b>2 GB</b>.\n` +
    `That's a Telegram limit, not mine — I can't raise it.`,

    archive_heavy_processing: `⚠️ <b>This archive has more than 2 GB of PDFs inside.</b>\n\n` +
    `It might take me <b>1 minute</b> to <b>4 hours</b> to finish, depending on the files.\n` +
    `Most of the time it's much faster than that.\n\n` +
    `💬 I'll message you here the moment it's ready.`,

    pdf_empty: `❌ <b>This PDF is empty.</b>\n\n` +
    `There are no pages inside it.\n` +
    `Please send me a different PDF.`,

    server_overloaded: `⏳ <b>I'm getting a lot of files right now.</b>\n\n` +
    `Please try sending yours again in a few minutes.`,

    file_lost: `❌ <b>I can't find that file anymore.</b>\n\n` +
    `Please send it to me again.`,

    processing_timeout: `⚠️ <b>This took too long, so I stopped it.</b>\n\n` +
    `Over 20 minutes — that almost never happens, most files take me 1 to 5 minutes.\n\n` +
    `Please send the file again.\n\n` +
    `If it keeps happening, tell me here: /support.`,

    worker_technical_error: `❌ <b>Something went wrong while I was working on your file.</b>\n\n` +
    `Please try again. If it keeps happening, tell me here: /support.`,

    server_busy: `⏳ <b>I'm working on a lot of files right now.</b>\n\n` +
    `Your file is safe, nothing was lost — please try again in a minute or two.`,

    page_out_of_range: `⚠️ <b>Page {{page}} doesn't exist.</b>\n\n` +
    `This document only has {{total}} pages.`,

    plan_not_available: `⚠️ <b>This plan isn't available yet.</b>\n\n` +
    `Please choose another plan.`,

    period_not_available: `⚠️ <b>This billing period isn't available yet.</b>\n\n` +
    `Please choose a different option.`,

    payments_not_available: `⚠️ <b>Payments aren't available yet.</b>\n\n` +
    `I'm still setting up payments for this bot.\n` +
    `Please check back soon.`,

    current_payment_not_available: `⚠️ <b>This payment method doesn't support the selected plan.</b>\n\n` +
    `Please choose another payment method or a different plan.`,

} as const;
