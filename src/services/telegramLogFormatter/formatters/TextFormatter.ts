import type {Message} from 'grammy/types';
import type {IMessageFormatter} from '../interfaces/IMessageFormatter.js';

export class TextFormatter implements IMessageFormatter{

	canFormat(message:Message):boolean{

		return !!message.text;

	}

	format(message:Message):{typeLine:string,fileLine:string}{

		return{

			typeLine: "💬 <b>Message format:</b> Text",
			fileLine: `\n• <b>Text:</b> <code>${message.text!.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code>`,
		};

	}

}
