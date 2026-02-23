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
    async initDatabase() {
        console.log('🚀 [System] Connecting to PostgreSQL...');
        await Postgresql.getInstance().query('SELECT NOW()');
        console.log('✅ [System] PostgreSQL connected.');
        console.log('📦 [System] Checking migrations...');
        const migrator = new Migrator();
        await migrator.migrate();
        console.log('✅ [System] Database is ready.');
    }
    async registerUser(userId, username = '', firstName = '', lang) {
        const existing = await this.userRepo.findOne({ id: userId });
        if (existing) {
            const updateData = {
                username,
                firstName,
                lastActiveAt: Date.now()
            };
            if (lang) {
                updateData.langCode = lang;
            }
            await this.userRepo.update({ id: userId }, updateData);
        }
        else {
            await this.userRepo.create({
                id: userId,
                username,
                firstName,
                joinedAt: Date.now(),
                lastActiveAt: Date.now(),
                langCode: lang || 'en',
                isVip: false
            });
        }
    }
    async logAction(userId, action, size) {
        await this.logRepo.log(userId, action, size);
        if (size > 0)
            await this.userRepo.incrementTraffic(userId, size);
    }
    async getUser(id) {
        const user = await this.userRepo.findOne({ id });
        if (user) {
            user.stats = await this.logRepo.getUserStats(id);
            user.totalTrafficBytes = Number(user.totalTrafficBytes || user.monthlyTraffic || 0);
        }
        return user;
    }
    async getGlobalStats(adminId) {
        const traffic = await this.userRepo.getTotalTrafficExcludingAdmin(adminId);
        return {
            traffic,
            actions: await this.logRepo.getStatsByAction()
        };
    }
    async getUserCounts() {
        return {
            total: await this.userRepo.count(),
            active: await this.userRepo.countActive(15),
            subscribers: {
                pro: await this.userRepo.count({ sub_type: 'pro' }),
                premium: await this.userRepo.count({ sub_type: 'premium' }),
                enterprise: await this.userRepo.count({ sub_type: 'enterprise' }),
                vip: await this.userRepo.count({ is_vip: true }),
                sovereign: await this.userRepo.count({ sub_type: 'sovereign_protocol' })
            },
            models: { monthly: 0, yearly: 0 }
        };
    }
    async getUserIdsByLang(lang) {
        return this.userRepo.findIdsByLanguage(lang);
    }
    async setVip(userId) {
        await this.userRepo.setVipStatus(userId, true);
    }
}
