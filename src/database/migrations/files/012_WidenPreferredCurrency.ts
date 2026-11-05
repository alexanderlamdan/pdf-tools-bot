import { Postgresql } from '../../Postgresql.js';

export class Migration012 {

    async up() {

        await Postgresql.getInstance().query(`
            ALTER TABLE users
            ALTER COLUMN preferred_currency TYPE VARCHAR(10);
        `);
        console.log('✅ Migration 012: preferred_currency widened to VARCHAR(10)');

    }

}
