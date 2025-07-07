export class UserService {
    userIds = new Set();
    adminMsgIdToUserId = new Map();
    addUserId(userId) {
        this.userIds.add(userId);
    }
    hasUserId(userId) {
        return this.userIds.has(userId);
    }
    getSingleUserId() {
        return this.userIds.size === 1 ? [...this.userIds][0] : undefined;
    }
    saveAdminMessageLink(adminMsgId, userId) {
        this.adminMsgIdToUserId.set(adminMsgId, userId);
    }
    getUserIdByAdminMessage(adminMsgId) {
        return this.adminMsgIdToUserId.get(adminMsgId);
    }
}
