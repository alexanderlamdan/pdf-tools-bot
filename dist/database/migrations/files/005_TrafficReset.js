import { Schema } from '../core/Schema.js';
import { Blueprint } from '../core/Blueprint.js';
export class Migration005 {
    async up() {
        await Schema.table('users', (table) => {
            table.timestamp('last_reset_at');
        });
        console.log('✅ Migration 005: last_reset_at added to users');
    }
}
