export class DocumentFormatter {
    canFormat(message) {
        return !!message.document;
    }
    format(message) {
        const doc = message.document;
        let fileLine = `\n• <b>file_id:</b> <code>${doc.file_id}</code>`;
        fileLine += `\n• <b>file_name:</b> <code>${doc.file_name}</code>`;
        if (doc.file_size)
            fileLine += `\n• <b>File size:</b> ${(doc.file_size / 1024 / 1024).toFixed(2)} MB`;
        if (doc.mime_type)
            fileLine += `\n• <b>MIME:</b> <code>${doc.mime_type}</code>`;
        return {
            typeLine: "📄 <b>Message format:</b> Document",
            fileLine,
        };
    }
}
