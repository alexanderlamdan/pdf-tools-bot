export const user = {

	buttons: {

		main: {
			btn_status: '👤 My Account',
			btn_help: '❓ Help',
			btn_to_pdf: '🔄 To PDF',
		},

		common: {
			btn_cancel: '❌ Cancel',
			btn_back: '⬅️ Back to Menu',
			btn_cancel_process: '❌ Cancel Process',
		},

		plan_buttons: {
			starter:  '⚡️ Starter — $10/mo',
			pro:      '💎 Pro — $25/mo',
			ultra:    '🏢 Ultra — $75/mo',
			business: '💵 Business — $100/mo',
		},

		subscription: {
			back: '◀️ All Plans',
			buy:  '💳 Buy {{name}}',
		},

		buy_traffic: '📦 Buy More Traffic',

	},

	status: {

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
		one_time_package: 'One time package traffic',
		packages_used:    'Packages used',
		images_to_pdf:    'Images to PDF',
		office_to_pdf:    'Office to PDF',

		empty: 'No activity yet',
		error: 'Error loading profile',

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
		word_count:     '📊 Word count checked',
		images_to_pdf:  '🖼 Images to PDF',
		office_to_pdf:  '📄 Office to PDF',
	},

	subscriptions: {

		no_sub:    'Free',
		unlimited: 'Unlimited',

		free_storage:     '8 GB',
		starter_storage:  '500 GB',
		pro_storage:      '1000 GB',
		ultra_storage:    '2000 GB',
		business_storage: '5000 GB',

		free_role:       'Free',
		free_admin_role: 'Free Admin',
		starter_role:    '⚡️ Starter',
		pro_role:        '💎 Pro',
		ultra_role:      '🏢 Ultra',
		business_role:   '💵 Business',
		vip_role:        '🌟 VIP',

	},

	period_labels: {
		monthly:    'Monthly',
		quarterly:  'Quarterly',
		semiannual: 'Semi-annual',
		yearly:     'Yearly',
	},

	reset_countdown: {
		days:  `(in {{days}}d {{hours}}h)`,
		hours: `(in {{hours}}h)`,
	},

	redirect: {

		ru: `👋 Привет!\n\n` +
		`Я заметил, что язык твоего Telegram — русский.\n\n` +
		`Для тебя у меня есть отдельная русскоязычная версия бота с теми же функциями, тарифами и возможностями.\n\n` +
		`👇 Просто нажми кнопку ниже и продолжай пользоваться ботом на русском языке.`,

		ru_button: `🇷🇺 Перейти в русский PDF Tools Bot`,

		he: `👋 שלום!\n\n` +
		`שמתי לב ששפת הטלגרם שלך היא עברית.\n\n` +
		`יש לי גרסה ייעודית בעברית עם אותן היכולות, אותן התוכניות ואותן האפשרויות.\n\n` +
		`👇 פשוט לחץ על הכפתור למטה כדי להמשיך בעברית.`,

		he_button: `🇮🇱 לעבור לבוט בעברית`,

	},

	buttons_extra: {
		btn_my_stats:  '📊 My Statistics',
		btn_pdf_stats: '📈 PDF Statistics',
	},

	my_stats: {

		title: `📊 <b>My Statistics</b>\n\n`,
		member_since:   'Member since',
		total_files:    'Total files processed',
		total_data:     'Total data processed',
		breakdown:      'By tool',
		most_used:      'Most used tool',
		empty:          `You haven't processed any files yet — send me a PDF to get started!`,

	},

	pdf_stats: {

		title: `📈 <b>PDF Statistics</b>\n\n`,
		personal_line:  `Based on your average file size (<b>{{avg}}MB</b>), you have enough traffic left for about <b>{{count}} more files</b> like that.`,
		personal_empty: `Send me a few files first, and I'll estimate how many more you can fit based on your own average size.`,
		bucket_title:   `\n\n📋 <b>If all your files were this size:</b>`,
		bucket_row:     `{{size}} → <b>{{count}}</b> files`,
		reminder:       `\n\n💡 <b>Heads up:</b> analyzing a file always counts fully toward your traffic the moment you upload it — even before you pick a tool.`,

	},

} as const;
