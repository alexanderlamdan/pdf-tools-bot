export const subscriptions = {
    limit_exceeded: `🚫 <b>Your free traffic limit is exhausted.</b>

You have used all <b>2 GB</b> of your free plan.
Choose a subscription to continue using the bot:`,
    done_but_exceeded: `✅ Done! The operation was completed successfully.

🚫 <b>However, your free traffic limit has been reached.</b>
To receive this file and continue, please choose a plan:`,
    choose_plan: '💳 Choose a subscription plan:',
    traffic_warning: '⚠️ <b>Heads up!</b> You have <b>{{remain}}</b> of free traffic left.\nConsider upgrading to keep working without interruptions.',
    plans: {
        free: `🆓 <b>Free Plan</b>

📦 Up to 2 GB file size (Telegram limit)
📊 2 GB monthly traffic
🔧 All tools unlocked
🗑 Files deleted immediately after delivery
🚶 Basic queue

<i>Free forever. No credit card required.</i>`,
        pro: `⚡️ <b>Pro Plan — $10/month</b>

📦 Up to 2 GB file size (Telegram limit)
📊 12 GB monthly traffic
🔧 All tools unlocked
🖼 Your own watermark
⚡️ Pro queue (priority over free users)
🗑 Files deleted immediately after delivery

<i>Best choice for personal use.</i>`,
        premium: `💎 <b>Premium Plan — $25/month</b>

📦 Up to 2 GB file size (Telegram limit)
📊 24 GB monthly traffic
🔧 All tools unlocked
🖼 Your own watermark
💎 Premium queue
🎧 Priority support via /support
🗑 Files deleted immediately after delivery

<i>Perfect for heavy daily use.</i>`,
        enterprise: `🏢 <b>Enterprise Plan — $75/month</b>

📦 Up to 2 GB file size (Telegram limit)
📊 48 GB monthly traffic
🔧 All tools unlocked
🖼 Your company watermark
🚀 No queue — instant processing
🎧 Dedicated support
🗑 Files deleted immediately after delivery

<i>Designed for businesses and teams.</i>`,
        sovereign_protocol: `👑 <b>Sovereign Protocol — $3,000/month</b>

📦 Up to 2 GB file size (Telegram limit)
📊 90 GB monthly traffic
🔧 All tools unlocked
🚀 No queue — instant processing
💬 Personal communication with developer
🗑 Files deleted immediately after delivery

<i>For those who demand the absolute maximum.
Contact via /support → Business inquiry.</i>`,
    },
};
