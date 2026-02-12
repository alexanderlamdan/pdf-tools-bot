export class QueryBuilder {
    static buildWhere(criteria, startParamIndex = 1) {
        const keys = Object.keys(criteria);
        const values = Object.values(criteria);
        if (keys.length === 0)
            return { clause: '', values: [], nextIndex: startParamIndex };
        const clause = 'WHERE ' + keys.map((k, i) => `"${k}" = $${startParamIndex + i}`).join(' AND ');
        return { clause, values, nextIndex: startParamIndex + values.length };
    }
    static insert(table, data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const columns = keys.map(k => `"${k}"`).join(', ');
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`;
        return { sql, values };
    }
    static upsert(table, data, conflictKey = 'id') {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const columns = keys.map(k => `"${k}"`).join(', ');
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const updateColumns = keys.filter(k => k !== conflictKey);
        const updateClause = updateColumns.map(k => `"${k}" = EXCLUDED."${k}"`).join(', ');
        const sql = `
            INSERT INTO ${table} (${columns})
            VALUES (${placeholders}) ON CONFLICT ("${conflictKey}") DO UPDATE SET ${updateClause} RETURNING *
        `;
        return { sql, values };
    }
    static update(table, criteria, data) {
        const dataKeys = Object.keys(data);
        const dataValues = Object.values(data);
        let idx = 1;
        const setClause = dataKeys.map(k => `"${k}" = $${idx++}`).join(', ');
        const { clause: whereClause, values: whereValues } = this.buildWhere(criteria, idx);
        const sql = `UPDATE ${table} SET ${setClause} ${whereClause} RETURNING *`;
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
