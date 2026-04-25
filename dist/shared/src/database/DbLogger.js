import fs from 'fs';
import path from 'path';
export class DbLogger {
    static instance;
    loggerService;
    logDir;
    constructor() {
        this.logDir = path.join(process.cwd(), 'logs', 'database');
        if (!fs.existsSync(this.logDir))
            fs.mkdirSync(this.logDir, { recursive: true });
    }
    static getInstance() {
        if (!DbLogger.instance) {
            DbLogger.instance = new DbLogger();
        }
        return DbLogger.instance;
    }
    setExternalLogger(logger) {
        this.loggerService = logger;
    }
    async error(connectionName, error, query, params) {
        const timestamp = new Date().toISOString();
        const errorMessage = error.message || String(error);
        const stack = error.stack || '';
        const adminMsg = `🚨 <b>DATABASE ERROR</b> 🚨\n\n` +
            `📦 <b>Connection:</b> ${connectionName}\n` +
            `❌ <b>Error:</b> ${errorMessage}\n` +
            `📝 <b>Query:</b> <code>${query || 'N/A'}</code>\n` +
            `🔢 <b>Params:</b> <code>${JSON.stringify(params || [])}</code>`;
        const logFile = path.join(this.logDir, `${connectionName}_errors.log`);
        const fileLine = `[${timestamp}] ERROR: ${errorMessage}\nQUERY: ${query}\nPARAMS: ${JSON.stringify(params)}\nSTACK: ${stack}\n\n`;
        try {
            fs.appendFileSync(logFile, fileLine);
        }
        catch (e) {
            console.error('CRITICAL: Failed to write to DB log file', e);
            fs.appendFileSync('FATAL_DB_ERRORS.log', fileLine);
        }
        if (this.loggerService) {
            try {
                await this.loggerService.error('DB_CRASH', new Error(adminMsg));
            }
            catch (e) {
                console.error('Failed to send DB error to telegram', e);
            }
        }
        else {
            console.warn('DBLogger: External LoggerService not set. Skipping telegram notification');
        }
    }
}
