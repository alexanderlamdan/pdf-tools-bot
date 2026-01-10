import type {Message} from 'grammy/types';
import type {IMessageFormatter} from '../interfaces/IMessageFormatter.js';

export class VideoNoteFormatter implements IMessageFormatter{

	canFormat(message:Message):boolean{

		return !!message.video_note;

	}

	format(message:Message):{typeLine:string,fileLine:string}{

		const videoNote = message.video_note!;
		let fileLine = `\n• <b>file_id:</b> <code>${videoNote.file_id}</code>`;

		if(videoNote.file_size) fileLine += `\n• <b>File size:</b> ${(videoNote.file_size / 1024 / 1024).toFixed(2)} MB`;
		return{

			typeLine:"📹 <b>Message format:</b> Video message",
			fileLine

		};

	}

}
