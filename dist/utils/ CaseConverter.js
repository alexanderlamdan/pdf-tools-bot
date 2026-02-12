export class CaseConverter {
    static toCamel(s) {
        return s.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    }
    static toSnake(s) {
        return s.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }
    static objectToCamel(obj) {
        if (!obj || typeof obj !== 'object')
            return obj;
        if (Array.isArray(obj))
            return obj.map(i => this.objectToCamel(i));
        const newObj = {};
        for (const key of Object.keys(obj)) {
            newObj[this.toCamel(key)] = obj[key];
        }
        return newObj;
    }
    static objectToSnake(obj) {
        if (!obj || typeof obj !== 'object')
            return obj;
        const newObj = {};
        for (const key of Object.keys(obj)) {
            newObj[this.toSnake(key)] = obj[key];
        }
        return newObj;
    }
}
