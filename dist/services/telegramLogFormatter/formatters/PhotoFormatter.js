export class PhotoFormatter {
    canFormat(message) {
        return !!message.photo;
    }
    format(message) {
        const photo = message.photo[message.photo.length - 1];
        let fileLine = `\n• <b>file_id:</b> <code>${photo.file_id}</code>`;
        if (photo.file_size) {
            fileLine += `\n• <b>File size:</b> ${(photo.file_size / 1024 / 1024).toFixed(2)} MB`;
        }
        return {
            typeLine: "🖼 <b>Message format:</b> Picture",
            fileLine
        };
    }
}
