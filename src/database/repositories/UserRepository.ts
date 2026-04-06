import {BaseRepository} from './BaseRepository.js';
import type {IUser} from '../../types/User.js';

export class UserRepository extends BaseRepository<IUser>{
    
    constructor(){
        
        super('users');
        
    }
    
    public async findByUsername(username:string):Promise<IUser|undefined>{
        
        return this.findOne({username} as any);
        
    }
    
    public async findVIPs():Promise<IUser[]>{
        
        return this.findAll({is_vip:true} as any);
        
    }
    
    public async incrementTraffic(userId:number,bytes:number){
        
        await this.query(`UPDATE users SET monthly_traffic = COALESCE(monthly_traffic,0) + $1 WHERE id=$2`,[bytes,userId]);
        
    }
    
    public async countActive(minutes:number):Promise<number>{
        
        const time = Date.now() - minutes * 60 * 1000;
        const res = await this.query(`SELECT COUNT(*) as c FROM users WHERE last_active_at > $1`,[time]);
        return Number(res[0].c);
        
    }
    
    public async findIdsByLanguage(lang:string):Promise<number[]>{
        
        const res = await this.query(`SELECT id FROM users WHERE lang_code = $1`,[lang]);
        return res.map((row:any) => Number(row.id));
        
    }
    
    public async setVipStatus(userId:number,status:boolean){
        
        await this.update({id:userId} as any,{is_vip:status} as any);
        
    }
    
    public async getTotalTrafficExcludingAdmin(adminId:number):Promise<number>{
        
        const res = await this.query(`SELECT SUM(monthly_traffic) as total FROM users WHERE id != $1`,[adminId]);
        return Number(res[0]?.total || 0);
        
    }
    
    public async setVipStatusWithExpiry(userId:number,expiresAtMs:number){
        
       await this.update({id:userId} as any,{
        
        isVip:true,
        subType:'vip',
        subPeriod:'yearly',
        subExpiresAt:expiresAtMs,
        monthlyTraffic:0
        
       } as any);
       
    }
    
    public async getZeroTrafficVips():Promise<IUser[]>{
        
        return this.findAll({isVip:true,monthly_traffic:0} as any);
        
    }
    
    public async getExpiredVips(nowMs:number):Promise<IUser[]>{
        
        const res = await this.query(`SELECT * FROM users WHERE is_vip = true AND sub_expires_at > 0 AND sub_expires_at < $1`,[nowMs]);
        return this.normalize(res);
        
    }
    
    public async getExpiringSubscriptions(startMs:number,endMs:number):Promise<IUser[]>{
        
        const res = await this.query(`SELECT * FROM users WHERE sub_type != 'free' AND is_vip = false AND sub_expires_at BETWEEN $1 AND $2`,[startMs,endMs]);
        return this.normalize(res);
        
    }
    
    public async getExpiredSubscriptions(nowMs:number):Promise<IUser[]>{
        
        const res = await this.query(`SELECT * FROM users WHERE sub_type != 'free' AND is_vip = false AND sub_expires_at > 0 AND sub_expires_at < $1`,[nowMs]);
        return this.normalize(res);
        
    }
    
    public async downgradeToFree(userId:number){
        
        await this.update({id:userId} as any,{
            
            subType:'free',
            isVip:false,
            subExpiresAt:0,
            monthlyTraffic:0
            
        }as any);
        
    }
    
}
