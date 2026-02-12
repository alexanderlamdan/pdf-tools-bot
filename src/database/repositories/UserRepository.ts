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
    
}
