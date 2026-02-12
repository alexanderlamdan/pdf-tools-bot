import {UserRepository} from '../database/repositories/UserRepository.js';
import {LogRepository} from '../database/repositories/LogRepository.js';
import {DbInit} from '../database/DbInit.js';
import {DbLogger} from '../database/DbLogger.js';
import {Migrator} from '../database/migrations/Migrator.js';
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
    
    private async init(){
        
        if(this.initialized) return;
        await DbInit.run();
        this.initialized = true;
        
    }
    
    public async registerUser(userId:number,username:string = '',firstName:string = ''){
        
        await this.init();
        const existing = await this.userRepo.findOne({id:userId} as any);
        
        if(existing){
            
            await this.userRepo.update({id:userId} as any,{
                username,
                firstName,
                lastActiveAt:Date.now()
            }as any);
            
        }else{
            
            await this.userRepo.create({
                id:userId,
                username,
                firstName,
                joinedAt:Date.now(),
                lastActiveAt:Date.now()
            } as any);
            
        }
        
        
    }
    
    public async logAction(userId:number,action:string,size:number){
        
        await this.init();
        await this.logRepo.log(userId,action,size);
        if(size > 0) await this.userRepo.incrementTraffic(userId,size);
        
    }
    
    public async getUser(id:number):Promise<IUser|undefined>{
        
        await this.init();
        const user = await this.userRepo.findOne({id} as any);
        if(user){
            
            user.stats = await this.logRepo.getUserStats(id);
            user.totalTrafficBytes = Number(user.totalTrafficBytes || (user as any).monthly_traffic || 0);
            
        }
        
        return user;
        
    }
    
    public async getGlobalStats(){
        
        await this.init();
        return {
            
            traffic:0,
            actions:await this.logRepo.getStatsByAction()
            
        };
        
    }
    
    public async getUserCounts(){
        
        await this.init();
        return{
            
            total:await this.userRepo.count(),
            active:await this.userRepo.countActive(15),
            subscribers:{
                
                pro:await this.userRepo.count({sub_type:'pro'} as any),
                premium:await this.userRepo.count({sub_type:'premium'} as any),
                enterprise: await this.userRepo.count({sub_type:'enterprise'} as any),
                vip:await this.userRepo.count({is_vip:true} as any)
                
            },
            models:{monthly:0,yearly:0}
            
        };
        
    }
    
}
