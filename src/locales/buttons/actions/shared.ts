export const shared = {

	buttons: {
		cancel_confirm_yes: '✅ Yes, cancel',
		cancel_confirm_no:  '↩️ No, continue',
	},

	cancel_confirm_ask: `⚠️ <b>Stop this?</b>\n\n` +
	`You won't get a result back.\n` +
	`I'll still count <b>50% of your file's size</b> as traffic — about <b>{{amount}}</b>. That part already happened, I can't undo it.\n\n` +
	`You'll need to send the file again to try.\n\n` +
	`Stop it?`,
	free_action_note: `🆓 This tool is free — it doesn't use any of your traffic.`,
	// {{amount}}
	cancelled: `❌ <b>Stopped.</b>\n\n` +
	`I counted 50% of your file's size — about <b>{{amount}}</b> — as traffic.\n\n` +
	`Please send the file again to try once more.`,

	please_wait: `⏳ Please wait for me to finish what I'm doing first.`,

	pre_action_info: `👤 <b>{{name}}</b> (@{{username}}, ID: <code>{{id}}</code>)\n` +
	`💎 Your plan: <b>{{plan}}</b>\n` +
	`💾 Your traffic: <b>{{used}} / {{limit}}</b>\n\n` +
	`📊 <b>What you can do here:</b>\n{{availability}}\n\n` +
	`⚠️ If something breaks, I already get notified about it automatically.\n` +
	`Got a personal question, or just want to reach me? Write here with /support, or email me at <code>{{supportEmail}}</code>.`,

	// {{amount}}
	traffic_used_summary: `📊 This used <b>+{{amount}}</b> of your traffic.`,

	btn_need_more: `📦 Need more? Get a one-time package starting at $1`,

	heavy_task_warning: `⚠️ <b>This might take a little while.</b>\n\n` +
	`Big PDFs — lots of pages, fonts, or images — need more time to process.\n\n` +
	`⏳ Usually somewhere between <b>1 minute</b> and <b>4 hours</b>.\n` +
	`Most files finish a lot sooner than that.\n\n` +
	`💬 You don't need to stay here. I'll message you the moment it's ready.`,

	// {{position}}
	position: `⏳ <b>I added your task to the queue.</b>\n\n` +
	`You're at position <b>#{{position}}</b>.`,

	vip_warning: `⚠️ <b>I'm protecting the server right now.</b>\n\n` +
	`You've started a lot of big tasks in a short time.\n\n` +
	`To keep things fast and stable for everyone, I've temporarily lowered your VIP priority.\n\n` +
	`💬 It'll come back on its own.`,

	vip_blocked: `🚫 <b>Your VIP access is paused for a moment.</b>\n\n` +
	`Too many big tasks came in from you in a short time.\n\n` +
	`This is just to keep things stable for everyone.\n\n` +
	`💬 Your VIP access will come back automatically.`,

	vip_message_notice: `⏳ <b>Hang on a bit longer.</b>\n\n` +
	`I'm still working through your earlier tasks.\n\n` +
	`You'll be able to start new ones again soon.`,

	vip_unblock_notice: `✅ <b>Your VIP access is back!</b>\n\n` +
	`Thanks for waiting.\n\n` +
	`💡 For the best speed, send big PDFs one at a time.`,

	task_already_running: `⏳ <b>I'm already working on this.</b>\n\n` +
	`There's nothing else you need to do.\n\n` +
	`💬 I'll send you the result the moment it's ready.`,

	units: {
		kb: 'KB',
		mb: 'MB',
		gb: 'GB',
	},

} as const;
