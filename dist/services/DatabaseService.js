import { UserRepository } from '../database/repositories/UserRepository.js';
import { LogRepository } from '../database/repositories/LogRepository.js';
import { DbInit } from '../database/DbInit.js';
import { DbLogger } from '../database/DbLogger.js';
import { Migrator } from '../database/migrations/Migrator.js';
import { Postgresql } from '../database/Postgresql.js';
export class DatabaseService {
    userRepo;
    logRepo;
    initialized = false;
    constructor(logger) {
        DbLogger.getInstance().setExternalLogger(logger);
        this.userRepo = new UserRepository();
        this.logRepo = new LogRepository();
    }
    async init() {
        if (this.initialized)
            return;
        console.log('🔌 [DatabaseService] Initialization started...');
        try {
            console.log('⏳ [DatabaseService] Testing connection to Postgres...');
            await Postgresql.getInstance().query('SELECT NOW()');
            console.log('✅ [DatabaseService] Connection successful!');
            console.log('📦 [DatabaseService] Running migrations...');
            const migrator = new Migrator();
            await migrator.migrate();
            console.log('✅ [DatabaseService] Migrations done.');
            this.initialized = true;
        }
        catch (error) {
            console.error('❌ [DatabaseService] FATAL ERROR during init:', error);
            throw error;
        }
    }
    async registerUser(userId, username = '', firstName = '') {
        await this.init();
        const existing = await this.userRepo.findOne({ id: userId });
        if (existing) {
            await this.userRepo.update({ id: userId }, {
                username,
                firstName,
                lastActiveAt: Date.now()
            });
        }
        else {
            await this.userRepo.create({
                id: userId,
                username,
                firstName,
                joinedAt: Date.now(),
                lastActiveAt: Date.now()
            });
        }
    }
    async logAction(userId, action, size) {
        await this.init();
        await this.logRepo.log(userId, action, size);
        if (size > 0)
            await this.userRepo.incrementTraffic(userId, size);
    }
    async getUser(id) {
        await this.init();
        const user = await this.userRepo.findOne({ id });
        if (user) {
            user.stats = await this.logRepo.getUserStats(id);
            user.totalTrafficBytes = Number(user.totalTrafficBytes || user.monthly_traffic || 0);
        }
        return user;
    }
    async getGlobalStats() {
        await this.init();
        return {
            traffic: 0,
            actions: await this.logRepo.getStatsByAction()
        };
    }
    async getUserCounts() {
        await this.init();
        return {
            total: await this.userRepo.count(),
            active: await this.userRepo.countActive(15),
            subscribers: {
                pro: await this.userRepo.count({ sub_type: 'pro' }),
                premium: await this.userRepo.count({ sub_type: 'premium' }),
                enterprise: await this.userRepo.count({ sub_type: 'enterprise' }),
                vip: await this.userRepo.count({ is_vip: true })
            },
            models: { monthly: 0, yearly: 0 }
        };
    }
}
