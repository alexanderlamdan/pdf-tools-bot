export class StickerFormatter {
    canFormat(message) {
        return !!message.sticker;
    }
    format(message) {
        const sticker = message.sticker;
        let fileLine = `\n• <b>file_id:</b> <code>${sticker.file_id}</code>`;
        if (sticker.emoji)
            fileLine += `\n• <b>Emoji:</b> ${sticker.emoji}`;
        if (sticker.set_name)
            fileLine += `\n• <b>Set:</b> ${sticker.set_name}`;
        if (sticker.file_size)
            fileLine += `\n• <b>File size:</b> ${(sticker.file_size / 1024 / 1024).toFixed(2)} MB`;
        return {
            typeLine: "🧩 <b>Message format:</b> Sticker",
            fileLine
        };
    }
}
