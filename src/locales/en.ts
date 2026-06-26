import { buttons }       from './sections/buttons.js';
import { analysis }      from './sections/analysis.js';
import { status }        from './sections/status.js';
import { actions }       from './sections/actions.js';
import { queue }         from './sections/queue.js';
import { subscriptions } from './sections/subscriptions.js';
import { errors }        from './sections/errors.js';
import { common }        from './sections/common.js';
import { notifications } from './sections/notifications.js';

export const en = {

        buttons,

        messages: {
                start: `👋 <b>Welcome to PDF Tools Bot!</b>\n`+
                `<b>📄 What can I do?</b>\n`+
                `Everything you need to work with PDF files directly inside Telegram — compress, merge, split, convert, protect, unlock, extract, remove metadata, create long images, and more.\n`+
                `<b>📦 File limit</b>\n`+
                `Supports PDF files up to <b>2 GB</b>.\n`+
                `<b>📄 Ready?</b>\n`+
                `Send me a PDF file to get started.`,

                help: `📚 <b>PDF Tools Bot — Help</b>\n\n` +
                `<b>❓ How do I use the bot?</b>\n` +
                `1. Send a <b>PDF file</b>.\n` +
                `2. Wait while it's analyzed.\n` +
                `3. Choose the tool you need.\n` +
                `4. Receive your processed file.\n\n` +

                `<b>❓ What can the bot do?</b>\n` +
                `Process PDF files directly inside Telegram — merge, split, compress, convert, protect, extract text or images, create long images, and much more.\n\n` +

                `<b>❓ Are my files safe?</b>\n` +
                `🔒 Yes. Your files are processed automatically and permanently deleted after 12 hours.\n\n` +

                `<b>❓ Need higher limits?</b>\n` +
                `Premium plans are designed for users who work with PDF files regularly and need higher limits.`,

                about: `🤖 <b>About PDF Tools Bot</b>\n\n` +
                `PDF Tools Bot is a professional PDF processing platform built for Telegram. Work with PDF files without installing apps, creating accounts, or leaving Telegram.\n\n` +

                `<b>✨ Why choose PDF Tools Bot?</b>\n` +
                `• Professional-grade PDF tools\n` +
                `• Supports PDF files up to 2GB\n` +
                `• Free traffic resets every month\n` +
                `• Free features stay free forever\n` +
                `• High-availability infrastructure (99.99% SLA)\n` +
                `• Built with privacy and security in mind\n` +
                `• Designed to respect both your time and your privacy\n` +
                `• No signup required\n` +
                `• Built to help you work — not to spam you\n` +
                `• No intrusive advertising\n` +
                `• No forced subscriptions to partner channels\n` +
                `• Pay only if you need higher limits\n` +
                `• Free users receive a small QR code, bot link, and marketplace link at the end of supported files\n\n` +

                `<b>🔒 Privacy & Security</b>\n` +
                `• Every file is processed in an isolated workspace\n` +
                `• Files are never shared with third parties\n` +
                `• Automatically deleted after processing\n` +
                `• Permanently removed within 12 hours\n\n` +

                `<b>🌐 LMDN Bot Marketplace</b>\n` +
                `Discover more professional Telegram bots and services:\n` +
                `https://lmdnbot.com\n\n` +

                `Thank you for choosing PDF Tools Bot ❤️`,

                analysis,
                status,
                actions,
                common,
                queue,
                subscriptions,
                notifications,
        },

        errors,

} as const;
