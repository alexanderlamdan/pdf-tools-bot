import {Bot} from 'grammy';
import type {BotContext} from './BotContext.js';
import type {IBotHandler} from '../types/IBotHandler.js';

import {StartHandler} from '../modules/StartHandler.js';
import {HelpHandler} from '../modules/HelpHandler.js';

export class BotKernel{

  private readonly modules:IBotHandler[];

	constructor(){

		this.modules = [

			new StartHandler(),
			new HelpHandler()

		];

	}

	public registerAll(bot:Bot<BotContext>):void{

		for(const module of this.modules){

			module.register(bot);

		}

	}

}
