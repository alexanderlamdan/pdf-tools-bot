import { Blueprint } from '../core/Blueprint.js';
import { Schema } from '../core/Schema.js';
export class Migration002 {
    async up() {
        await Schema.table('users', (table) => {
            table.string('lang_code', 10);
        });
        console.log('✅ Migration 002: lang_code column added');
    }
}
