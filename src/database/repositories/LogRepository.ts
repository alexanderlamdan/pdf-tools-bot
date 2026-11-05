import {BaseRepository} from './BaseRepository.js';
export class LogRepository extends BaseRepository<any>{
    
    constructor(){
        super('activity_logs');
    }
    
    public async log(userId:number,action:string,size:number = 0){
        
        await this.create({
            user_id:userId,
            action_type:action,
            file_size:size,
            created_at:Date.now()
        });
        
    }
    
    public async getStatsByAction(){
        
        const res = await this.query(`SELECT action_type, COUNT(*) as count FROM activity_logs GROUP BY action_type`,[]);
        const stats:Record<string,number> = {};
        res.forEach((r:any)=>stats[r.action_type] = Number(r.count));
        return stats;
        
    }
    
    public async getUserStats(userId:number){
        
        const res = await this.query(`SELECT action_type, COUNT(*) as count FROM activity_logs WHERE user_id = $1 GROUP BY action_type`,[userId]);
        const stats:Record<string,number> = {};
        res.forEach((r:any)=>stats[r.action_type] = Number(r.count));
        return stats;
        
    }
    
    public async getUserFileHistory(userId:number){
        
        return await this.query(
            `SELECT action_type, file_size, created_at FROM activity_logs WHERE user_id = $1 AND file_size > 0 ORDER BY created_at ASC`,[userId]
        );
        
    }
    
    public async getUserFirstActivity(userId:number):Promise<number|null>{
        
        const res = await this.query(`SELECT MIN(created_at) as first_at FROM activity_logs WHERE user_id = $1`,[userId]);
        return res[0]?.first_at ? Number(res[0].first_at) : null;
        
    }
    
}
