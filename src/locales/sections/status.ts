export const status = {

    user: {
        title:       '👤 <b>MY STATUS</b>\n\n',
        name:        'Name',
        role:        'Role',
        usage:       'Usage',
        stats:       'Statistics',
        plan:        'Plan',
        ends:        'Valid until',
        joined:      'Member since',
        reset:       'Next traffic reset',
        sub_started: 'Subscription started',
        sub_expires: 'Subscription expires',
    },

    admin: {
        title:        '👑 <b>ADMIN STATUS</b>\n\n',
        global_stats: 'Global Activity',
        traffic:      'Total Traffic',
        subs:         'Subscribers',
    },

    actions: {
        upload:        '📂 Uploaded',
        compress:      '🗜 Compressed',
        unlock:        '🔓 Unlocked',
        protect:       '🔐 Protected',
        split:         '✂️ Split',
        merge:         '🔗 Merged',
        metadata_wipe: '🧹 Metadata wiped',
        asymmetric:    '🔑 Asymmetric encrypted',
        cancelled:     '❌ Cancelled',
        extract_text:   '📝 Text extracted',
        extract_images: '🖼 Images extracted',
        search:         '🔍 Searched',
        rename:         '✏️ Renamed',
    },

    subscriptions: {
        no_sub:    'Free',
        unlimited: 'Unlimited',

        free_storage:    '8 GB',
        starter_storage: '500 GB',
        pro_storage:     '1000 GB',
        ultra_storage:   '2000 GB',
        business_storage: '5000 GB',

        free_role:       'Free',
        free_admin_role: 'Free Admin',
        starter_role:    '⚡️ Starter',
        pro_role:        '💎 Pro',
        ultra_role:      '🏢 Ultra',
        business_role: '💵 Business',
        vip_role:        '🌟 VIP',
    },

    plan_buttons: {
        starter: '⚡️ Starter — $10/mo',
        pro:     '💎 Pro — $25/mo',
        ultra:   '🏢 Ultra — $75/mo',
        business: '💵 Business - 100$',
    },

    period_labels: {
        monthly:    'Monthly',
        quarterly:  'Quarterly',
        semiannual: 'Semi-annual',
        yearly:     'Yearly',
    },

    empty: 'No activity yet',
    error: 'Error loading profile',

} as const;
