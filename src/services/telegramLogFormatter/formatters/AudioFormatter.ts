import type {Message} from 'grammy/types';
import type {IMessageFormatter} from '../interfaces/IMessageFormatter.js';

export class AudioFormatter implements IMessageFormatter{

	canFormat(message:Message):boolean{

		return !!message.audio;

	}

	format(message:Message):{typeLine:string,fileLine:string}{

		const audio = message.audio!;
		let fileLine = `\n• <b>file_id:</b> <code>${audio.file_id}</code>`;

		if(audio.file_name) fileLine += `\n• <b>file_name:</b> <code>${audio.file_name}</code>`;
		if(audio.file_size) fileLine += `\n• <b>File size:</b> ${(audio.file_size / 1024 / 1024).toFixed(2)} MB`;
		if(audio.mime_type) fileLine += `\n• <b>MIME:</b> <code>${audio.mime_type}</code>`;
		if(audio.performer) fileLine += `\n• <b>Artist:</b> ${audio.performer}`;
		if(audio.title) fileLine += `\n• <b>Track:</b> ${audio.title}`;

		return {

			typeLine:"🎵 <b>Message format:</b> Audio",
			fileLine

		};

	}

}
