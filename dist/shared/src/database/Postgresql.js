import pg from 'pg';
import { DbLogger } from './DbLogger.js';
const { Pool } = pg;
export class Postgresql {
    static instance;
    pool;
    constructor(db) {
        this.pool = new Pool(db);
        this.pool.on('error', (err) => DbLogger.getInstance().error('PG_POOL', err));
    }
    static init(db) {
        if (Postgresql.instance) {
            console.warn('[Postgresql] Already initialized, skipping.');
            return;
        }
        Postgresql.instance = new Postgresql(db);
    }
    static getInstance() {
        if (!Postgresql.instance) {
            throw new Error('[Postgresql] Not initialized. Call Postgresql.init(config.db) in index.ts first');
        }
        return Postgresql.instance;
    }
    async query(text, params) {
        try {
            const res = await this.pool.query(text, params);
            return res.rows;
        }
        catch (err) {
            await DbLogger.getInstance().error('QUERY_FAIL', err, text, params);
            throw err;
        }
    }
}
