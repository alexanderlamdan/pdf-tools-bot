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
    },

    subscriptions: {
        no_sub:    'Free',
        unlimited: 'Unlimited',

        free_storage:    '2 GB',
        starter_storage: '24 GB',
        pro_storage:     '48 GB',
        ultra_storage:   '200 GB',

        free_role:       'Free',
        free_admin_role: 'Free Admin',
        starter_role:    '⚡️ Starter',
        pro_role:        '💎 Pro',
        ultra_role:      '🏢 Ultra',
        vip_role:        '🌟 VIP',
    },

    plan_buttons: {
        starter: '⚡️ Starter — $10/mo',
        pro:     '💎 Pro — $25/mo',
        ultra:   '🏢 Ultra — $75/mo',
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
