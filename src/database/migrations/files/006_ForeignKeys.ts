import {Postgresql} from '../../Postgresql.js';

export class Migration006{
    
    async up():Promise<void>{
        
        const db = Postgresql.getInstance();
        
        await db.query('ALTER TABLE activity_logs ADD CONSTRAINT fk_activity_logs_user_id FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE').catch((e:any)=>{
            
            if(e.message?.includes('already exists')) return;
            throw e;
            
        });
        
        await db.query('ALTER TABLE feedbacks ADD CONSTRAINT fk_feedbacks_user_id FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE').catch((e:any)=>{
            
            if(e.message?.includes('already exists')) return;
            throw e;
            
        });
        
        await db.query('ALTER TABLE support_sessions ADD CONSTRAINT fk_support_sessions_user_id FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE').catch((e:any)=>{
            
            if(e.message?.includes('already exists')) return;
            throw e;
            
        });
        
        await db.query('ALTER TABLE support_messages ADD CONSTRAINT fk_support_messages_user_id FOREIGN KEY(session_id) REFERENCES support_sessions(id) ON DELETE CASCADE').catch((e:any)=>{
            
            if(e.message?.includes('already exists')) return;
            throw e;
            
        });
        
        console.log('✅ Migration 005: FK CASCADE added to all tables');
        
    }
    
}
