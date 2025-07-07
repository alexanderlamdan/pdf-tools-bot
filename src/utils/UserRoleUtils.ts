import type {User} from 'grammy/types';
import type {IBotConfig} from '../config/interfaces/IBotConfig.js';

export class UserRoleUtils{

	private readonly adminId:number;

	constructor(config:IBotConfig){

		this.adminId = config.adminId;

	}

	isAdmin(user:User):boolean{

		return user.id === this.adminId;

	}

}
