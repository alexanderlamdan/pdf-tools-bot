import { buttons }      from './sections/buttons.js';
import { analysis }     from './sections/analysis.js';
import { status }       from './sections/status.js';
import { actions }      from './sections/actions.js';
import { queue }        from './sections/queue.js';
import { subscriptions } from './sections/subscriptions.js';
import { errors }       from './sections/errors.js';
import { common }       from './sections/common.js';
import {notifications} from './sections/notifications.js';
 
export const en = {
 
    buttons,
 
    messages: {
        start: '👋 <b>Hello!</b> I\'m <b>PDF Tools Bot</b> — your all-in-one PDF assistant.\n\nSend me any PDF file and I\'ll analyze it instantly.\n👇 <i>Just drop the file below to get started.</i>',
 
        help: `📚 <b>PDF Tools Bot — Help</b>
 
<b>How to use:</b>
1. Send a <b>PDF file</b>
2. Wait for the instant analysis
3. Choose an action from the menu
 
<b>Available tools:</b>
🗜 <b>Compress</b> — reduce file size, keep quality
✂️ <b>Split</b> — extract specific pages
🔗 <b>Merge</b> — combine multiple PDFs into one
🔐 <b>Protect</b> — encrypt with AES-256 password
🔓 <b>Unlock</b> — remove or crack PDF password
🚑 <b>Repair</b> — fix broken/corrupted files
🧹 <b>Wipe Metadata</b> — remove author, dates, hidden data
🖼 <b>Extract</b> — pull out images or text
 
<b>Privacy:</b>
🛡 Files are processed in an isolated environment and deleted immediately after delivery. Nothing is stored.`,
 
        about: `🤖 <b>PDF Tools Bot</b>
 
All your files go <b>directly to our server</b>, bypassing Telegram's own data centers. This is possible thanks to our local Telegram API setup — maximum speed, maximum privacy.
 
🔒 <b>Your files are safe:</b>
• Processed in an isolated file system
• Deleted immediately after sending back to you
• Each user's files are kept in a separate folder
• Auto-wiped every 12 hours as an extra layer of safety
 
The bot does not store, read, or share your documents. Only what's needed to run the operation is temporarily used.`,
 
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
