import type {Message} from 'grammy/types';
import type {IMessageFormatter} from '../interfaces/IMessageFormatter.js';

export class VideoFormatter implements IMessageFormatter{

	canFormat(message:Message):boolean{

		return !!message.video;

	}

	format(message:Message):{typeLine:string,fileLine:string}{

		const video = message.video!;
		let fileLine = `\n• <b>file_id:</b> <code>${video.file_id}</code>`;

		if(video.file_name) fileLine += `\n• <b>file_name:</b> <code>${video.file_name}</code>`;
		if(video.file_size) fileLine += `\n• <b>File size:</b> ${(video.file_size / 1024 / 1024).toFixed(2)} MB`;
		if(video.mime_type) fileLine += `\n• <b>MIME:</b> <code>${video.mime_type}</code>`;
		if(video.duration) fileLine += `\n• <b>Duration:</b> ${video.duration} sec`;
		if(video.width && video.height) fileLine += `\n• <b>Resolution:</b> ${video.width}x${video.height}`;

		return{

			typeLine: "🎬 <b>Message format:</b> Video",
			fileLine

		};

	}

}
