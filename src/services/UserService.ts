export class UserService{

	private userIds = new Set<number>();
	private adminMsgIdToUserId = new Map<number,number>();

	addUserId(userId:number){

		this.userIds.add(userId);

	}

	hasUserId(userId:number){

		return this.userIds.has(userId);

	}

	getSingleUserId(){

		return this.userIds.size === 1 ? [...this.userIds][0] : undefined;

	}

	saveAdminMessageLink(adminMsgId:number,userId:number){

		this.adminMsgIdToUserId.set(adminMsgId,userId);

	}

	getUserIdByAdminMessage(adminMsgId:number):number | undefined{

		return this.adminMsgIdToUserId.get(adminMsgId);

	}

}
