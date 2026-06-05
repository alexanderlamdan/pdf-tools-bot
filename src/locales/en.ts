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
                start: '👋 <b>Hello!</b> I\'m <b>PDF Tools Bot</b> — your all-in-one PDF assistant.\n\nSend me any PDF file and I\'ll analyze it instantly.\n👇 <i>Just drop the file below to get started.</i>',

                help: `📚 <b>PDF Tools Bot — Help</b>\n\n` +
                `<b>How to use:</b>\n` +
                `1. Send a <b>PDF file</b>\n` +
                `2. Wait for the instant analysis\n` +
                `3. Choose an action from the menu\n\n` +
                `<b>Available tools:</b>\n` +
                `🗜 <b>Compress</b> — reduce file size, keep quality\n` +
                `✂️ <b>Split</b> — extract specific pages\n` +
                `🔗 <b>Merge</b> — combine multiple PDFs into one\n` +
                `🔐 <b>Protect</b> — encrypt with password (AES-256) or asymmetric key (RSA-4096)\n` +
                `🔓 <b>Unlock</b> — remove PDF password\n` +
                `🧹 <b>Wipe Metadata</b> — remove author, dates, hidden data\n` +
                `🖼 <b>Extract</b> — pull out images or text\n\n` +
                `<b>Privacy:</b>\n` +
                `🛡 Files are processed in an isolated environment and deleted immediately after delivery. Nothing is stored.`,

                about: `🤖 <b>PDF Tools Bot</b>\n\n` +
                `Your files go <b>directly to my server</b>, bypassing Telegram's own data centers. ` +
                `This is possible thanks to my local Telegram API setup — maximum speed, maximum privacy.\n\n` +
                `🔒 <b>Your files are safe:</b>\n` +
                `• Processed in an isolated file system\n` +
                `• Deleted immediately after sending back to you\n` +
                `• Each user's files are kept in a separate folder\n` +
                `• Auto-wiped every 12 hours as an extra layer of safety\n\n` +
                `I don't store, read, or share your documents. Only what's needed to run the operation is temporarily used.`,

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
