import type {Message} from 'grammy/types';

export interface IMessageFormatter{

	canFormat(message:Message):boolean;
	format(message:Message):{typeLine:string,fileLine:string};

}
