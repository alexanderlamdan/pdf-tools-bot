import { Schema } from '../core/Schema.js';
import { Blueprint } from '../core/Blueprint.js';

export class Migration010 {

    async up() {

        await Schema.table('users', (table: Blueprint) => {

            table.integer('images_used_this_week', 0);
            table.timestamp('images_reset_at');

        });

        console.log('✅ Migration 010: images_used_this_week + images_reset_at added to users');

    }

}
