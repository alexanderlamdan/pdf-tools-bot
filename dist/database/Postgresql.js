import pg from 'pg';
import { dbConfig } from './config/configLocal.js';
import { DbLogger } from './DbLogger.js';
const { Pool } = pg;
export class Postgresql {
    static instance;
    pool;
    constructor() {
        this.pool = new Pool(dbConfig);
        this.pool.on('error', (err) => DbLogger.getInstance().error('PG_POOL', err));
    }
    static getInstance() {
        if (!Postgresql.instance)
            Postgresql.instance = new Postgresql();
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
