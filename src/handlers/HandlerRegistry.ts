import type {Bot} from 'grammy';

import {StartCommandHandler} from './commands/StartCommandHandler.js';
import {HelpCommandHandler} from './commands/HelpCommandHandler.js';

import {LoggerService} from '../services/LoggerService.js';
import {UserService} from '../services/UserService.js';

import type {IBotConfig} from '../config/interfaces/IBotConfig.js';

import { DocumentMessageHandler } from './message/DocumentMessageHandler.js';



interface CommandBinding{

	command:string;
	Handler: new (...args:any[]) => {handle(ctx:any):Promise<void> | void};

}

export class HandlerRegistry{

  private readonly userService:UserService;

	private commandBindings:CommandBinding[] = [

		{command:'start',Handler: StartCommandHandler},
		{command:'help',Handler:HelpCommandHandler},

	];

	constructor(private readonly bot: Bot, private readonly config:IBotConfig){

		this.userService = new UserService();

	}


	public registerAll():void{

		for(const {command,Handler} of this.commandBindings){

			const instance = new Handler(this.config);

			this.bot.command(command,instance.handle.bind(instance));

		}
		
		const docHandler = new DocumentMessageHandler(this.config);
        
        // Ловим документы
        this.bot.on('message:document', async (ctx) => {
            if (docHandler.isSupportedDocument(ctx)) {
                await docHandler.handle(ctx);
            }
        });

	}

}
