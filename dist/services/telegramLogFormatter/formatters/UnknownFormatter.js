export class UnknownFormatter {
    canFormat(_message) {
        return true;
    }
    format(_message) {
        return {
            typeLine: "❓ <b>Message format:</b> unknown/not standard",
            fileLine: ""
        };
    }
}
