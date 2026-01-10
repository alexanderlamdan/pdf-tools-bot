import type {User,Message} from 'grammy/types';
import type {IMessageFormatter} from './interfaces/IMessageFormatter.js';
import {
	AudioFormatter,
  DocumentFormatter,
  PhotoFormatter,
  StickerFormatter,
  TextFormatter,
  UnknownFormatter,
  VideoFormatter,
  VideoNoteFormatter,
  VoiceFormatter,
} from './formatters.js';

export class TelegramLogFormatter{

	private formatters: IMessageFormatter[];

	constructor(){

		this.formatters = [

			new PhotoFormatter(),
			new AudioFormatter(),
			new DocumentFormatter(),
			new StickerFormatter(),
			new TextFormatter(),
			new VideoFormatter(),
			new VideoNoteFormatter(),
			new VoiceFormatter(),
			new UnknownFormatter()

		];

	}

	formatErrorLog(params:{

		botName:string;
		user:User;
		message:Message;
		errorText:string;

	}):string{

		const {botName,user,message,errorText} = params;
		const userLine = `👤 <b>User:</b> ${user.first_name} (@${user.username || "нет username"}, ID: <code>${user.id}</code>)`;
		const botLine = `🤖 <b>Bot:</b> ${botName}`;

		const formatter = this.formatters.find((f)=>f.canFormat(message));
		const {typeLine,fileLine} = formatter!.format(message);

		return `${botLine}
${userLine}
${typeLine}
${fileLine}

❗️<b>Message from the logger:</b>
<code>${errorText}</code>`;

	}

}
