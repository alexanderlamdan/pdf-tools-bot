import { BaseRepository } from './BaseRepository.js';

export interface IFeedback{
    
    id:number;
    userId:number;
    username:string;
    firstName:string;
    text:string;
    createdAt:number;
    
}

const COOLDOWN_MS = 7 * 24  * 60 * 60 * 1000;

export class FeedbackRepository extends BaseRepository<IFeedback>{
    
    constructor(){
        
        super('feedbacks');
        
    }
    
    public async getLastByUser(userId:number):Promise<IFeedback | undefined>{
        
        const res = await this.query(
            `SELECT * FROM feedbacks WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
            [userId]
        );
        
        return this.normalize(res)[0];
    }
    
    public async canSubmit(userId:number):Promise<{allowed:boolean;remainMs:number}>{
        
        const last = await this.getLastByUser(userId);
        if(!last) return{allowed:true,remainMs:0};
        
        const elapsed = Date.now() - last.createdAt;
        const remainMs = Math.max(0,COOLDOWN_MS - elapsed);
        
        return {allowed:remainMs === 0,remainMs};
        
    }
    
    public async submit(data:{
        userId:number;
        username:string;
        firstName:string;
        text:string;
    }):Promise<IFeedback>{
        
        return this.create({
            ...data,
            createdAt:Date.now()
        } as any);
        
    }
    
}
