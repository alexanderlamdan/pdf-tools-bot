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

        starter: `⚡️ <b>Starter Plan — $10/month</b>

        Ran out of free limit?
        Starter gives you 12x more traffic.

        📦 Up to 2 GB file size
        📊 24 GB monthly traffic
        🔧 All tools unlocked
        🖊️ Remove watermark from your files
        ⚡ Priority queue — no waiting
        🗑️ Files deleted immediately

        <i>Less than a coffee per month.</i>`,

        pro: `💎 <b>Pro Plan — $25/month</b>

        Processing PDFs daily for work?
        This plan won't slow you down.

        📦 Up to 2 GB file size
        📊 48 GB monthly traffic
        🔧 All tools unlocked
        🖊️ Your own branding on files
        💎 Premium queue — instant
        🎧 Priority support
        🗑️ Files deleted immediately

        <i>Built for freelancers &amp; small business.</i>`,

        ultra: `🏢 <b>Ultra Plan — $75/month</b>

        Your team processes hundreds
        of PDFs every day?
        We handle the heavy lifting.

        📦 Up to 2 GB file size
        📊 200 GB monthly traffic
        🔧 All tools unlocked
        🏢 Company watermark on all files
        🚀 No queue — instant processing
        🎧 Dedicated support
        🗑️ Files deleted immediately

        <i>For agencies, law firms &amp; teams.</i>`,

    },

} as const;
