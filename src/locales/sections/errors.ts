export const errors = {

    not_pdf:                  '⛔️ <b>Error:</b> This is not a PDF file',
    spam_warning:             '✋ <b>Stop spamming!</b>',
    text_rejected:            '⛔️ <b>Send a PDF file</b>, not text.',
    worker_fail:              '❌ Analysis failed.',
    password_empty:           'Password cannot be empty.',
    password_weak:            'Minimum 8 chars required.',
    language_not_supported:   'Your language is not supported for now',
    pdf_archive:              '❌ No PDF files found inside the archive.',
    single_pdf_archive:       '⚠️ Only 1 PDF found in archive. Need at least 2 to merge.',
    error_proccesing_archive: '❌ Error processing archive:',
    not_archive:              '⚠️ Please send an archive file (.zip, .rar, .7z, .tar.gz, .tar.xz)',
    archive_too_large: `❌ <b>Archive is too large.</b>\n\nMaximum size is 2 GB. This is a Telegram API limit and cannot be bypassed.`,
    archive_heavy_processing: `⚠️ <b>The total size of files inside the archive exceeds 2 GB.</b>\n\nProcessing may take <b>up to 120 minutes</b>, but could finish much sooner.\nYou will receive a notification here when it's done.`,
    pdf_empty: `❌ <b>Empty PDF.</b>\n\nThe file contains no pages. Please send a different file.`,


} as const;
