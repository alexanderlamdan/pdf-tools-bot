import {UserRepository} from '../database/repositories/UserRepository.js';
import {LogRepository} from '../database/repositories/LogRepository.js';
import {DbInit} from '../database/DbInit.js';
import {DbLogger} from '../database/DbLogger.js';
import {Migrator} from '../database/migrations/Migrator.js';
import { Postgresql } from '../database/Postgresql.js';
import type {LoggerService} from './LoggerService.js';
import type {IUser} from '../types/User.js';

export class DatabaseService{
    
    private userRepo:UserRepository;
    private logRepo:LogRepository;
    private initialized = false;
    
    constructor(logger:LoggerService){
        
        DbLogger.getInstance().setExternalLogger(logger);
        this.userRepo = new UserRepository();
        this.logRepo = new LogRepository();
        
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
    
    public async registerUser(userId:number,username:string = '',firstName:string = '',lang:string = 'en'){
        
        const existing = await this.userRepo.findOne({id:userId} as any);
        
        if(existing){
            
            await this.userRepo.update({id:userId} as any,{
                username,
                firstName,
                lastActiveAt:Date.now(),
                langCode:lang
            }as any);
            
        }else{
            
            await this.userRepo.create({
                id:userId,
                username,
                firstName,
                joinedAt:Date.now(),
                lastActiveAt:Date.now(),
                langCode:lang,
                isVip:false
            } as any);
            
        }
        
        
    }
    
    public async logAction(userId:number,action:string,size:number){
        
        await this.logRepo.log(userId,action,size);
        if(size > 0) await this.userRepo.incrementTraffic(userId,size);
        
    }
    
    public async getUser(id:number):Promise<IUser|undefined>{
        
        const user = await this.userRepo.findOne({id} as any);
        if(user){
            
            user.stats = await this.logRepo.getUserStats(id);
            user.totalTrafficBytes = Number(user.totalTrafficBytes || (user as any).monthlyTraffic || 0);
            
        }
        
        return user;
        
    }
    
    public async getGlobalStats(){
        
        return {
            
            traffic:0,
            actions:await this.logRepo.getStatsByAction()
            
        };
        
    }
    
    public async getUserCounts(){
        
        return{
            
            total:await this.userRepo.count(),
            active:await this.userRepo.countActive(15),
            subscribers:{
                
                pro:await this.userRepo.count({sub_type:'pro'} as any),
                premium:await this.userRepo.count({sub_type:'premium'} as any),
                enterprise: await this.userRepo.count({sub_type:'enterprise'} as any),
                vip:await this.userRepo.count({is_vip:true} as any),
                sovereign: await this.userRepo.count({sub_type:'sovereign_protocol'} as any)
                
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
    
}
