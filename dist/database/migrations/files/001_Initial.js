import { Schema } from '../core/Schema.js';
import { Blueprint } from '../core/Blueprint.js';
export class Migration001 {
    async up() {
        await Schema.create('users', (table) => {
            table.primary('id');
            table.string('username');
            table.string('firstName');
            table.boolean('isVip', false);
            table.boolean('isAdmin', false);
            table.timestamp('joinedAt');
            table.timestamp('lastActiveAt');
            table.string('subType', 50);
            table.string('subPeriod', 50);
            table.timestamp('subExpiresAt');
            table.bigInteger('monthlyTraffic', false, 0);
        });
        await Schema.create('activityLogs', (table) => {
            table.serial('id');
            table.bigInteger('userId');
            table.string('actionType', 50);
            table.bigInteger('fileSize', false, 0);
            table.timestamp('createdAt');
        });
        await Schema.createIndex('activity_logs', 'userId');
        await Schema.createIndex('activity_logs', 'actionType');
    }
}
