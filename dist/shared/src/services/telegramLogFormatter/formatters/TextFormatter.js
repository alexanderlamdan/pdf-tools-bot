export class TextFormatter {
    canFormat(message) {
        return !!message.text;
    }
    format(message) {
        return {
            typeLine: "💬 <b>Message format:</b> Text",
            fileLine: `\n• <b>Text:</b> <code>${message.text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code>`,
        };
    }
}
