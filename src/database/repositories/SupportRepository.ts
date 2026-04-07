import { BaseRepository } from './BaseRepository.js';
import { Postgresql } from '../Postgresql.js';

export interface ISupportSession{
    
    id:number;
    userId:number;
    username:string;
    firstName:string;
    lastName:string;
    category:string;
    status:'open' | 'closed';
    createdAt:number;
    updatedAt:number;
    
}

export interface ISupportMessage{
    
    id:number;
    sessionId:number;
    userId:number;
    adminMsgId:number;
    createdAt:number;
    
}

const TTL_MS = 14 * 24 * 60 * 60 * 1000;

export class SupportRepository extends BaseRepository<ISupportSession>{
    
    private msgRepo:BaseRepository<ISupportMessage>;
    
    constructor(){
        
        super('support_sessions');
        this.msgRepo = new class extends BaseRepository<ISupportMessage>{
            
            constructor(){super('support_messages');}
            
        }();
        
    }
    
    public async createSession(data:{
        
        userId:number;
        username:string;
        firstName:string;
        lastName:string;
        category:string;
        
    }):Promise<ISupportSession>{
        
        const now = Date.now();
        return this.create({
            
            ...data,
            status:'open',
            createdAt:now,
            updatedAt:now
            
        } as any);
        
    }
    
    public async getOpenSession(userId:number):Promise<ISupportSession | undefined>{
        
        const cutoff = Date.now() - TTL_MS;
        
        const res = await this.query(
            `SELECT * FROM support_session WHERE user_id = $1 AND status='open' AND created_at > $2 ORDER BY created_at DESC LIMIT 1`,[userId,cutoff]
        );
        
        return this.normalize(res)[0];
        
    }
    
    public async getActiveSessions():Promise<ISupportSession[]>{
        
        const cutoff = Date.now() - TTL_MS;
        
        const res = await this.query(
            `SELECT * FROM support_sessions WHERE status = 'open' AND created_at >$1 ORDER BY created_at DESC`,[cutoff]
        );
        
        return this.normalize(res);
        
    }
    
    public async closeSession(sessionId:number):Promise<void>{
        
        await this.update(
            {id:sessionId} as any,
            {status:'closed',updatedAt:Date.now()} as any
        );
        
    }
    
    public async closeSessionByUser(userId:number):Promise<void>{
        
        await this.query(
            `UPDATE support_sessions SET status = 'closed', updated_at = $1 WHERE user_id = $2 AND status = 'open'`,
            [Date.now(),userId]
        );
        
    }
    
    public async findSessionByUserIdentifier(identifier:string):Promise<ISupportSession | undefined>{
        
        const cutoff = Date.now() - TTL_MS;
        
        const byUsername = await this.query(
            `SELECT * FROM support_sessions WHERE username = $1 AND status='open' AND created_at > $2 ORDER BY created_at  DESC LIMIT 1`,[identifier.replace('@',''),cutoff]
        );
        
        if(byUsername.length > 0) return this.normalize(byUsername)[0];
        
        const numId = Number(identifier);
        if(!isNaN(numId)){
            
            const byId = await this.query(
                `SELECT * FROM support_session WHERE user_id = $1 AND status = 'open' AND created_at > $2 ORDER BY created_at DESC LIMIT 1`,[numId,cutoff]
            );
            
            if(byId.length > 0) return this.normalize(byId)[0];
            
        }
        
        return undefined;
        
    }
    
    public async saveMessage(sessionId:number,userId:number,adminMsgId:number):Promise<void>{
        
        await this.msgRepo.create({
            
            sessionId,
            userId,
            adminMsgId,
            createdAt:Date.now()
            
        } as any);
        
    }
    
    public async findUserByAdminMsg(adminMsgId:number):Promise<{userId:number,sessionId:number} | undefined>{
        
        const res = await this.query(
            `SELECT user_id, session_id FROM support_messages WHERE admin_msg_id = $1 LIMIT 1`,[adminMsgId]
        );
        
        if(!res.length)return undefined;
        
        return{
            userId:Number(res[0].user_id),
            sessionId:Number(res[0].session_id)
        };
        
    }
    
}
