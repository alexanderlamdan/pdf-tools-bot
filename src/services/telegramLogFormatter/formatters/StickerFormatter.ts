import type {Message} from 'grammy/types';
import type {IMessageFormatter} from '../interfaces/IMessageFormatter.js';


export class StickerFormatter implements IMessageFormatter{

	canFormat(message:Message):boolean{

		return !!message.sticker;

	}

	format(message:Message):{typeLine:string,fileLine:string}{

		const sticker = message.sticker!;
		let fileLine = `\n• <b>file_id:</b> <code>${sticker.file_id}</code>`;

		if(sticker.emoji) fileLine += `\n• <b>Emoji:</b> ${sticker.emoji}`;
		if(sticker.set_name) fileLine += `\n• <b>Set:</b> ${sticker.set_name}`;
		if(sticker.file_size) fileLine += `\n• <b>File size:</b> ${(sticker.file_size / 1024 / 1024).toFixed(2)} MB`;

		return{

			typeLine:"🧩 <b>Message format:</b> Sticker",
			fileLine

		};

	}

}
