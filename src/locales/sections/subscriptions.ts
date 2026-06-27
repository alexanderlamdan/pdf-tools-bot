export const subscriptions = {

    limit_exceeded: `🚫 <b>Your free traffic has been used up.</b>\n\n` +
    `You've used all <b>2 GB</b> included in the Free plan.\n\n` +
    `🚀 Choose a plan to keep processing PDF files without waiting for the monthly reset.`,

    done_but_exceeded: `✅ <b>Your PDF is ready!</b>\n\n` +
    `🚫 Your free traffic has been used up.\n\n` +
    `To download this file and continue using the bot right away, choose a plan below.`,

    choose_plan: `💳 <b>Choose your plan:</b>`,

    traffic_warning: `⚠️ <b>Your free traffic is running low.</b>\n\n` +
    `Only <b>{{remain}}</b> remaining.\n\n` +
    `Upgrade now to avoid interruptions and keep processing your PDF files.`,

    plans: {

        free: `🆓 <b>Free Plan</b>

        📦 Up to 2 GB per PDF file
        📊 2 GB of traffic every month
        💧 Small bot watermark
        🚶 Standard processing priority

        <i>Free forever. No credit card required.</i>`,

        starter: `⚡ <b>Starter — $10/month</b>

        Perfect for regular PDF work.

        📦 Up to 2 GB per PDF file
        📊 24 GB of traffic every month
        ✅ No bot watermark
        ⚡ Faster processing during busy hours

        <i>Ideal if you work with PDF files every week.</i>`,

        pro: `💎 <b>Pro — $25/month</b>

        Built for professionals who work with PDFs every day.

        📦 Up to 2 GB per PDF file
        📊 48 GB of traffic every month
        🎨 Your own watermark on processed files
        🚀 Priority processing
        🎧 Priority support

        <i>Perfect for freelancers and small businesses.</i>`,

        ultra: `🏢 <b>Ultra — $75/month</b>

        Designed for companies and teams with heavy PDF workflows.

        📦 Up to 2 GB per PDF file
        📊 200 GB of traffic every month
        🏢 Your company watermark on processed files
        🚀 Highest processing priority
        🎧 Dedicated support

        <i>Built for businesses that rely on PDF every day.</i>`,

    },

} as const;
