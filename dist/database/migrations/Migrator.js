import { Postgresql } from '../Postgresql.js';
import { Migration001 } from './files/001_Initial.js';
import { Migration002 } from './files/002_AddLang.js';
import { Migration003 } from './files/003_Support.js';
import { Migration004 } from './files/004_Feedback.js';
export class Migrator {
    db = Postgresql.getInstance();
    migrations = [
        { name: '001_Initial', class: Migration001 },
        { name: '002_AddLang', class: Migration002 },
        { name: '003_Support', class: Migration003 },
        { name: '004_Feedback', class: Migration004 }
    ];
    async migrate() {
        await this.db.query(`CREATE TABLE IF NOT EXISTS _migrations(id SERIAL PRIMARY KEY, name VARCHAR(255) UNIQUE, run_at BIGINT)`);
        const executed = await this.db.query('SELECT name FROM _migrations');
        const executedNames = new Set(executed.map((r) => r.name));
        for (const m of this.migrations) {
            if (!executedNames.has(m.name)) {
                console.log(`🔄 Migrating: ${m.name}...`);
                try {
                    const instance = new m.class();
                    await instance.up();
                    await this.db.query('INSERT INTO _migrations(name,run_at) VALUES($1,$2)', [m.name, Date.now()]);
                    console.log(`✅ Migrated: ${m.name}`);
                }
                catch (e) {
                    console.error(`❌ Migration failed: ${m.name}`, e);
                    throw e;
                }
            }
        }
    }
}
