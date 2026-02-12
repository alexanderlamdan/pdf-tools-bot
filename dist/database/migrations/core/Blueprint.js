export class Blueprint {
    lines = [];
    id() {
        this.lines.push('id BIGSERIAL PRIMARY KEY');
    }
    integer(name, def = 0) {
        this.lines.push(`${name} INTEGER DEFAULT ${def}`);
    }
    bigInteger(name, nullable = false, def) {
        let line = `${name} BIGINT`;
        if (!nullable)
            line += ' NOT NULL';
        if (def !== undefined)
            line += ` DEFAULT ${def}`;
        this.lines.push(line);
    }
    string(name, length = 255) {
        this.lines.push(`${name} VARCHAR (${length})`);
    }
    boolean(name, def = false) {
        this.lines.push(`${name} BOOLEAN DEFAULT ${def ? 'TRUE' : 'FALSE'}`);
    }
    timestamp(name) {
        this.lines.push(`${name} BIGINT`);
    }
    serial(name = 'id') {
        this.lines.push(`${name} SERIAL PRIMARY KEY`);
    }
    primary(name) {
        this.lines.push(`${name} BIGINT PRIMARY KEY`);
    }
    foreign(column, onTable, references = 'id') {
        this.lines.push(`CONSTRAINT fk_${column} FOREIGN KEY(${column}) REFERENCES ${onTable}(${references}) ON DELETE CASCADE`);
    }
    getDefinition() {
        return this.lines.join(',\n ');
    }
    getLines() { return this.lines; }
}
