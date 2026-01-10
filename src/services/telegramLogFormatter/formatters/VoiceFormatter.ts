import type {Message} from 'grammy/types';
import type {IMessageFormatter} from '../interfaces/IMessageFormatter.js';

export class VoiceFormatter implements IMessageFormatter{

	canFormat(message:Message):boolean{

		return !!message.voice;

	}

	format(message:Message):{typeLine:string,fileLine:string}{

		const voice = message.voice!;
		let fileLine = `\n• <b>file_id:</b> <code>${voice.file_id}</code>`;

		if(voice.file_size) fileLine += `\n• <b>File size:</b> ${(voice.file_size / 1024 / 1024).toFixed(2)} MB`;
		if(voice.mime_type) fileLine += `\n• <b>MIME:</b> <code>${voice.mime_type}</code>`;

		return{

			typeLine:"🎤 <b>Message format:</b> Voice message",
			fileLine

		};

	}

}
