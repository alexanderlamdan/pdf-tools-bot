export const status = {

    user: {
        title:  '👤 <b>MY STATUS</b>\n\n',
        name:   'Name',
        role:   'Role',
        usage:  'Usage',
        stats:  'Statistics',
        plan:   'Plan',
        ends:   'Valid until',
        joined: 'Member since',
        reset:  'Next traffic reset',
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
        crack:         '🕵️‍♂️ Cracked',
        split:         '✂️ Split',
        merge:         '🔗 Merged',
        metadata_wipe: '🧹 Metadata wiped',
    },

    subscriptions: {
        no_sub:   'Free',
        unlimited: 'Unlimited for VIP',

        free_storage:              '2 GB',
        pro_storage:               '12 GB',
        premium_storage:           '24 GB',
        enterprise_storage:        '48 GB',
        sovereign_protocol_storage:'90 GB',

        free_role:               'Free',
        free_admin_role:         'Free Admin',
        pro_role:                'Pro',
        premium_role:            'Premium',
        enterprise_role:         'Enterprise',
        vip_role:                'VIP',
        sovereign_protocol_role: 'Sovereign Protocol',
    },

    empty: 'No activity yet',
    error: 'Error loading profile',

} as const;
