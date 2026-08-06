export const buttons = {

    main: {
        btn_status: '👤 My Account',
        btn_help: '❓ Help',
    },

    admin: {
        adm_btn_stats: '📈 Statistics',
        adm_btn_logs: '📜 Logs',
    },

    files: {
        btn_compress: '🗜 Compress',
        btn_convert: '🔄 To PDF',
        btn_merge: '🔗 Merge',
        btn_split: '✂️ Split',
        btn_extract: '🖼 Extract',
        btn_protect: '🔐 Protect',
        btn_unlock: '🔓 Unlock',
        btn_watermark: '© Add Watermark',
        btn_to_long_image: '📜 Long Image',
        btn_metadata_wiper: '🧹 Remove Metadata',
        btn_execute_merge: '✅ Merge PDFs',
        btn_merge_one_by_one: '📄 One by One(Max 10)',
        btn_merge_archive: '📦 From Archive',
        btn_merge_bulk: '🗂 Multiple PDFs',
        btn_long_image_pages:   '📖 From PDF pages',
        btn_long_image_bulk:    '📄 One PDF = one page (up to 25)',
        btn_long_image_execute: '✅ Create long image',
        btn_extract_text:   '📝 Extract Text',
        btn_extract_images: '🖼 Extract Images',
        btn_extract_search: '🔍 Search Text',
        btn_extract_wordcount: '📊 Word Count',
        btn_rename: '✏️ Rename',
    },

    common: {
        btn_cancel: '❌ Cancel',
        btn_back: '⬅️ Back to Menu',
        btn_cancel_process: '❌ Cancel Process',
    },

    cancel_confirm: {
        yes: '✅ Yes, cancel',
        no:  '↩️ No, continue',
    },

    protect: {
        password: '🔐 Password Protection',
        asymmetric: '🔑 Private Key Protection',
    },

    unlock: {
        password: '🔓 Use Password',
        asymmetric: '🔑 Use Private Key',
    },

    subscription: {
        back: '◀️ All Plans',
        buy: '💳 Buy {{name}}',
        starter: '⚡ Starter — $10/mo',
        pro: '💎 Pro — $25/mo',
        ultra: '🏢 Ultra — $75/mo',
        business: '💵 Business - 100$',
    },

} as const;
