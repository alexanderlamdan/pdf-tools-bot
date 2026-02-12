import { Postgresql } from '../../Postgresql.js';
import { Blueprint } from './Blueprint.js';
export class Schema {
    static async create(tableName, callback) {
        const table = new Blueprint();
        callback(table);
        const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n  ${table.getDefinition()}\n);`;
        await Postgresql.getInstance().query(sql);
        console.log(`✅ Table '${tableName}' checked/created`);
    }
    static async table(tableName, callback) {
        const table = new Blueprint();
        callback(table);
        const db = Postgresql.getInstance();
        for (const line of table.getLines()) {
            if (line.startsWith('CONSTRAINT')) {
                try {
                    await db.query(`ALTER TABLE ${tableName} ADD ${line}`);
                }
                catch { }
            }
            else {
                try {
                    await db.query(`ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${line}`);
                    console.log(`➕ Column added to '${tableName}': ${line.split(' ')[0]}`);
                }
                catch (e) { }
            }
        }
    }
    static async createIndex(tableName, column) {
        const idxName = `idx_${tableName}_${column}`;
        await Postgresql.getInstance().query(`CREATE INDEX IF NOT EXISTS ${idxName} ON ${tableName}(${column})`);
    }
}
