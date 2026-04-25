export class UserRoleUtils {
    adminId;
    constructor(config) {
        this.adminId = config.adminId;
    }
    isAdmin(user) {
        return user.id === this.adminId;
    }
}
