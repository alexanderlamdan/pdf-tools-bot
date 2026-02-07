import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
export class DatabaseService {
    db;
    constructor() {
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir))
            fs.mkdirSync(dataDir, { recursive: true });
        this.db = new Database(path.join(dataDir, 'pdf-tools-bot.db'));
        this.db.pragma('journal_mode=WAL');
        this.initTables();
    }
    initTables() {
        this.db.exec(`CREATE TABLE IF NOT EXISTS users(
            
                id INTEGER PRIMARY KEY,
                username TEXT,
                first_name TEXT,
                is_vip INTEGER DEFAULT 0,
                is_admin INTEGER DEFAULT 0,
                joined_at INTEGER,
                last_active_at INTEGER,
                sub_type TEXT DEFAULT 'free',
                sub_period TEXT DEFAULT 'monthly',
                sub_expires_at INTEGER DEFAULT 0
            
            )`);
        this.db.exec(`CREATE TABLE IF NOT EXISTS activity_logs(
            
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action_type TEXT, -- 'upload','compress','unlock','protect'
                file_size INTEGER DEFAULT 0,
                created_at INTEGER,
                FOREIGN KEY(user_id) REFERENCES users(id)
            
            )`);
        this.db.exec('CREATE INDEX IF NOT EXISTS idx_logs_user ON activity_logs(user_id)');
        this.db.exec('CREATE INDEX IF NOT EXISTS idx_logs_action ON activity_logs(action_type)');
    }
    registerUser(userId, username = '', firstName = '') {
        const now = Date.now();
        const insertUser = this.db.prepare(`
            INSERT OR IGNORE INTO users(id,username,first_name,joined_at,last_active_at) VALUES(?,?,?,?,?)
        `);
        insertUser.run(userId, username, firstName, now, now);
        this.updateActivity(userId, username, firstName);
    }
    updateActivity(userId, username, firstName) {
        const now = Date.now();
        if (username && firstName) {
            this.db.prepare(`
                    UPDATE users SET last_active_at = ?, username = ?, first_name = ? WHERE id =?
                `).run(now, username, firstName, userId);
        }
        else {
            this.db.prepare(`
                    UPDATE users SET last_active_at = ? WHERE id = ?
                `).run(now, userId);
        }
    }
    logAction(userId, actionType, fileSize = 0) {
        this.db.prepare("INSERT INTO activity_logs (user_id, action_type, file_size, created_at) VALUES (?, ?, ?, ?)").run(userId, actionType, fileSize, Date.now());
    }
    getUser(userId) {
        const user = this.db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        if (!user)
            return undefined;
        const rawStats = this.db.prepare('SELECT action_type, COUNT(*) as count FROM activity_logs WHERE user_id = ? GROUP BY action_type').all(userId);
        const statsObj = {};
        rawStats.forEach(row => statsObj[row.action_type] = row.count);
        const traffic = this.db.prepare('SELECT SUM(file_size) as total FROM activity_logs WHERE user_id = ?').get(userId);
        return {
            id: user.id,
            username: user.username,
            firstName: user.first_name,
            isVip: user.is_vip,
            isAdmin: user.is_admin,
            joinedAt: user.joined_at,
            lastActiveAt: user.last_active_at,
            subType: user.sub_type,
            subPeriod: user.sub_period,
            subExpiresAt: user.sub_expires_at,
            stats: statsObj,
            totalTrafficBytes: traffic.total || 0
        };
    }
    getGlobalStats() {
        const traffic = this.db.prepare('SELECT SUM(file_size) as total FROM activity_logs').get();
        const actions = this.db.prepare('SELECT action_type, COUNT(*) as count FROM activity_logs GROUP BY action_type').all();
        const actionsMap = {};
        actions.forEach(r => actionsMap[r.action_type] = r.count);
        return {
            traffic: traffic.total || 0,
            actions: actionsMap
        };
    }
    getUserCounts() {
        const total = this.db.prepare('SELECT COUNT(*) as count FROM users').get();
        const active = this.db.prepare('SELECT COUNT(*) as count FROM users WHERE last_active_at > ?').get(Date.now() - 15 * 60 * 1000);
        const subscribers = {
            pro: this.db.prepare("SELECT COUNT(*) as count FROM users WHERE sub_type = 'pro'").get(),
            premium: this.db.prepare("SELECT COUNT(*) as count FROM users WHERE sub_type = 'premium'").get(),
            enterprise: this.db.prepare("SELECT COUNT(*) as count FROM users WHERE sub_type = 'enterprise'").get(),
            vip: this.db.prepare("SELECT COUNT(*) as count FROM users WHERE is_vip = 1").get(),
        };
        const models = {
            monthly: this.db.prepare("SELECT COUNT(*) as count FROM users WHERE sub_period = 'monthly' AND sub_type != 'free'").get(),
            yearly: this.db.prepare("SELECT COUNT(*) as count FROM users WHERE sub_period = 'yearly' AND sub_type != 'free'").get(),
        };
        return {
            total: total.count,
            active: active.count,
            subscribers: {
                pro: subscribers.pro.count,
                premium: subscribers.premium.count,
                enterprise: subscribers.enterprise.count,
                vip: subscribers.vip.count
            },
            models: { monthly: models.monthly.count, yearly: models.yearly.count }
        };
    }
}
