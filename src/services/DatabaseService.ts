import {UserRepository} from '../database/repositories/UserRepository.js';
import {LogRepository} from '../database/repositories/LogRepository.js';
import {TrafficPackageRepository} from '../database/repositories/TrafficPackageRepository.js';
import {DbLogger} from '../database/DbLogger.js';
import {Migrator} from '../database/migrations/Migrator.js';
import { Postgresql } from '../database/Postgresql.js';
import type {LoggerService} from './LoggerService.js';
import type {IUser} from '../types/User.js';
import type {ITrafficPackage} from '../types/TrafficPackage.js';
import {getUserLimit} from '../utils/SubscriptionUtils.js';

export class DatabaseService{
    
    private userRepo:UserRepository;
    private logRepo:LogRepository;
    private trafficPackageRepo:TrafficPackageRepository;
    private initialized = false;
    
    constructor(logger:LoggerService){
        
        DbLogger.getInstance().setExternalLogger(logger);
        this.userRepo = new UserRepository();
        this.logRepo = new LogRepository();
        this.trafficPackageRepo = new TrafficPackageRepository();
        
    }
    
    public async initDatabase() {
        console.log('🚀 [System] Connecting to PostgreSQL...');
        
        await Postgresql.getInstance().query('SELECT NOW()');
        console.log('✅ [System] PostgreSQL connected.');

        console.log('📦 [System] Checking migrations...');
        const migrator = new Migrator();
        await migrator.migrate();
        console.log('✅ [System] Database is ready.');
    }
    
    public async registerUser(userId:number,username:string = '',firstName:string = '',lang?:string){
        
        const existing = await this.userRepo.findOne({id:userId} as any);
        
        if(existing){
            
          const updateData:any = {
            
            username,
            firstName,
            lastActiveAt:Date.now()
            
          };
            
          if(lang){
            
            updateData.langCode = lang;
            
          }
 
          if(!(existing as any).joinedAt){
 
            updateData.joinedAt = Date.now();
 
          }
          
          await this.userRepo.update({id:userId} as any,updateData);
          
        }else{
            
            await this.userRepo.create({
                id:userId,
                username,
                firstName,
                joinedAt:Date.now(),
                lastActiveAt:Date.now(),
                langCode:lang || 'en',
                isVip:false
            } as any);
            
        }
        
        
    }

    
    public async logAction(userId:number,action:string,size:number){
        
        await this.logRepo.log(userId,action,size);
        
        if(size > 0){
            
            const user = await this.userRepo.findOne({id:userId} as any);
            const limitBytes = user ? getUserLimit(user as any) : Infinity;
            const currentUsed = user ? Number((user as any).monthlyTraffic || 0) : 0;
            
            if(user && limitBytes !== Infinity && currentUsed >= limitBytes){
                
                await this.trafficPackageRepo.deductFifo(userId,size);
                
            }else{
                
                await this.userRepo.incrementTraffic(userId,size);
                
            }
            
        }
        
    }
    
    public async getUser(id:number):Promise<IUser|undefined>{
        
        const user = await this.userRepo.findOne({id} as any);
        if(user){
            
            user.stats = await this.logRepo.getUserStats(id);
            user.totalTrafficBytes = Number(user.totalTrafficBytes || (user as any).monthlyTraffic || 0);
            
        }
        
        return user;
        
    }
    
    public async getGlobalStats(adminId:number){
        
        const traffic = await this.userRepo.getTotalTrafficExcludingAdmin(adminId)
        
        return {
            
            traffic,
            actions:await this.logRepo.getStatsByAction()
            
        };
        
    }
    
    public async getUserCounts(){
        
        return{
            
            total:await this.userRepo.count(),
            active:await this.userRepo.countActive(15),
            subscribers:{
                
                starter:await this.userRepo.count({sub_type:'starter'} as any),
                pro:await this.userRepo.count({sub_type:'pro'} as any),
                ultra: await this.userRepo.count({sub_type:'ultra'} as any),
                vip:await this.userRepo.count({is_vip:true} as any),
                
            },
            models:{monthly:0,yearly:0}
            
        };
        
    }
    
    public async getUserIdsByLang(lang:string){
        
        return this.userRepo.findIdsByLanguage(lang);
        
    }
    
    public async setVip(userId:number){
        
        await this.userRepo.setVipStatus(userId, true);
        
    }
    
    public async setBlocked(userId:number, isBlocked:boolean){
        
        await this.userRepo.setBlockedStatus(userId, isBlocked);
        
    }
    
    public async getActivePackages(userId:number):Promise<ITrafficPackage[]>{
        
        return this.trafficPackageRepo.getActivePackages(userId);
        
    }
    
    public async getPackagesRemainingBytes(userId:number):Promise<number>{
        
        return this.trafficPackageRepo.getTotalRemainingBytes(userId);
        
    }
    
    public async addPackageUsage(packageId:number, bytes:number):Promise<void>{
        
        await this.trafficPackageRepo.addUsage(packageId, bytes);
        
    }
    
    public async getPackageHistory(userId:number){
        
        return this.trafficPackageRepo.getPurchaseHistory(userId);
        
    }
    
    public async createTrafficPackage(userId:number, label:string, sizeBytes:number, priceCents:number):Promise<ITrafficPackage>{
        
        return this.trafficPackageRepo.create({
            userId,
            label,
            sizeBytes,
            usedBytes:   0,
            priceCents,
            purchasedAt: Date.now(),
        });
        
    }
    
    public async incrementImageQuota(userId:number,count:number):Promise<void>{
        
        await this.userRepo.incrementImageQuota(userId,count);
        
    }
    
    public async incrementOfficeQuota(userId:number,count:number):Promise<void>{
        
        await this.userRepo.incrementOfficeQuota(userId,count);
        
    }
    
    public async setPreferredCurrency(userId:number,currency:string):Promise<void>{
        
        await this.userRepo.setPreferredCurrency(userId,currency);
        
    }
    
    public async getUserFileHistory(userId:number){
        
        return await this.logRepo.getUserFileHistory(userId);
        
    }
    
    public async getUserFirstActivity(userId:number):Promise<number|null>{
        
        return await this.logRepo.getUserFirstActivity(userId);
        
    }
    
    public async resetImageQuota(userId:number):Promise<void>{
        
        await this.userRepo.resetImageQuota(userId);
        
    }
    
    public async resetOfficeQuota(userId:number):Promise<void>{
        
        await this.userRepo.resetOfficeQuota(userId);
        
    }
    
    public async activateSubscription(userId:number,plan:string,period:'monthly'|'yearly' = 'monthly'):Promise<void>{
        
        const now = Date.now();
        
        const expiresAt = period === 'yearly' ? now + 365 * 24 * 60 * 60 * 1000 : now + 30 * 24 * 60 * 60 * 1000;
        
        await this.userRepo.update({id:userId} as any,{
            
            subType:plan,
            subPeriod:period,
            subExpiresAt:expiresAt,
            totalTrafficBytes:0,
            lastActiveAt:now
            
        });
        
        await this.logRepo.log(userId,`subscription_activated:${plan}:${period}`,0);
        console.log(`[DatabaseService] Subscription activated:userId=${userId} plan=${plan} period=${period} expiresAt=${new Date(expiresAt).toISOString()}`);
        
    }
    
    public async query(sql:string,params?:any[]):Promise<any[]>{
        
        return Postgresql.getInstance().query(sql,params);
        
    }
    
}
