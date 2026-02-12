import { CaseConverter } from '../../utils/ CaseConverter.js';
export class QueryBuilder {
    static buildWhere(criteria, startParamIndex = 1) {
        const snakeCriteria = CaseConverter.objectToSnake(criteria);
        const keys = Object.keys(snakeCriteria);
        const values = Object.values(snakeCriteria);
        if (keys.length === 0)
            return { clause: '', values: [], nextIndex: startParamIndex };
        const clause = 'WHERE ' + keys.map((k, i) => `"${k}" = $${startParamIndex + i}`).join(' AND ');
        return { clause, values, nextIndex: startParamIndex + values.length };
    }
    static insert(table, data) {
        const snakeData = CaseConverter.objectToSnake(data);
        const keys = Object.keys(snakeData);
        const values = Object.values(snakeData);
        const columns = keys.map(k => `"${k}"`).join(', ');
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`;
        return { sql, values };
    }
    static upsert(table, data, conflictKey = 'id') {
        const snakeData = CaseConverter.objectToSnake(data);
        const snakeConflictKey = CaseConverter.toSnake(conflictKey);
        const keys = Object.keys(snakeData);
        const values = Object.values(snakeData);
        const columns = keys.map(k => `"${k}"`).join(', ');
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const updateColumns = keys.filter(k => k !== snakeConflictKey);
        const updateClause = updateColumns.map(k => `"${k}" = EXCLUDED."${k}"`).join(', ');
        const sql = `
            INSERT INTO ${table} (${columns})
            VALUES (${placeholders}) ON CONFLICT ("${snakeConflictKey}") DO UPDATE SET ${updateClause} RETURNING *
        `;
        return { sql, values };
    }
    static update(table, criteria, data) {
        const snakeData = CaseConverter.objectToSnake(data);
        const dataKeys = Object.keys(snakeData);
        const dataValues = Object.values(snakeData);
        let idx = 1;
        const setClause = dataKeys.map(k => `"${k}" = $${idx++}`).join(', ');
        const { clause, values: whereClause } = this.buildWhere(criteria, idx);
        const sql = `UPDATE ${table} SET ${setClause} ${clause} RETURNING *`;
        return { sql, values: [...dataValues, ...whereClause] };
    }
    static select(table, criteria = {}, limit, orderBy) {
        const { clause, values } = this.buildWhere(criteria);
        let sql = `SELECT * FROM ${table} ${clause}`;
        if (orderBy)
            sql += ` ORDER BY ${orderBy}`;
        if (limit)
            sql += ` LIMIT ${limit}`;
        return { sql, values };
    }
}
