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
    },

    common: {
        btn_cancel: '❌ Cancel',
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
    },

} as const;
