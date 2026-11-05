import { Schema } from '../core/Schema.js';
import { Blueprint } from '../core/Blueprint.js';

export class Migration013 {

    async up() {

        await Schema.table('users', (table: Blueprint) => {

            table.integer('office_used_this_week', 0);
            table.timestamp('office_reset_at');

        });

        console.log('✅ Migration 013: office_used_this_week + office_reset_at added to users');

    }

}
