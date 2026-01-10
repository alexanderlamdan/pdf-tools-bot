import type {Message} from 'grammy/types';
import type {IMessageFormatter} from '../interfaces/IMessageFormatter.js';


export class UnknownFormatter implements IMessageFormatter{

	canFormat(_message:Message):boolean{

		return true;

	}

	format(_message:Message):{typeLine:string,fileLine:string}{

		return{

			typeLine:"❓ <b>Message format:</b> unknown/not standard",
			fileLine: ""

		};

	}

}
