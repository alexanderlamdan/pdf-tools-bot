import { Postgresql } from '../Postgresql.js';
import { QueryBuilder } from '../query/QueryBuilder.js';
import { CaseConverter } from '../../utils/CaseConverter.js';
export class BaseRepository {
    tableName;
    db = Postgresql.getInstance();
    constructor(tableName) {
        this.tableName = tableName;
    }
    normalize(rows) {
        return rows.map(row => CaseConverter.objectToCamel(row));
    }
    async findOne(criteria) {
        const { sql, values } = QueryBuilder.select(this.tableName, criteria, 1);
        const res = await this.db.query(sql, values);
        return this.normalize(res)[0];
    }
    async findAll(criteria = {}, limit = 100, orderBy) {
        const { sql, values } = QueryBuilder.select(this.tableName, criteria, limit, orderBy);
        const res = await this.db.query(sql, values);
        return this.normalize(res);
    }
    async create(data) {
        const { sql, values } = QueryBuilder.insert(this.tableName, data);
        const res = await this.db.query(sql, values);
        return this.normalize(res)[0];
    }
    async save(data, conflictKey = 'id') {
        const { sql, values } = QueryBuilder.upsert(this.tableName, data, conflictKey);
        const res = await this.db.query(sql, values);
        return this.normalize(res)[0];
    }
    async update(criteria, data) {
        const { sql, values } = QueryBuilder.update(this.tableName, criteria, data);
        const res = await this.db.query(sql, values);
        return this.normalize(res)[0];
    }
    async delete(criteria) {
        const { clause, values } = QueryBuilder.buildWhere(criteria);
        await this.db.query(`DELETE FROM ${this.tableName} ${clause}`, values);
    }
    async count(criteria = {}) {
        const { clause, values } = QueryBuilder.buildWhere(criteria);
        const res = await this.db.query(`SELECT COUNT(*) as c FROM ${this.tableName} ${clause}`, values);
        return Number(res[0].c);
    }
    async query(sql, params) {
        return this.db.query(sql, params);
    }
}
