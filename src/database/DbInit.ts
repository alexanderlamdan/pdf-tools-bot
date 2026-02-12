import {Postgresql} from './Postgresql.js';

export class DbInit{
    
    public static async run(){
        
        const db = Postgresql.getInstance();
        
        await db.query(`CREATE TABLE IF NOT EXISTS users(
            id BIGINT PRIMARY KEY,
            username VARCHAR(255),
            first_name VARCHAR(255),
            is_vip BOOLEAN DEFAULT FALSE,
            is_admin BOOLEAN DEFAULT FALSE,
            joined_at BIGINT,
            last_active_at BIGINT,
            sub_type VARCHAR(50) DEFAULT 'free',
            sub_period VARCHAR(50) DEFAULT 'monthly',
            sub_expires_at BIGINT DEFAULT 0,
            monthly_traffic BIGINT DEFAULT 0
            )`);
            
        await db.query(`CREATE TABLE IF NOT EXISTS activity_logs(
            id SERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL,
            action_type VARCHAR(50),
            file_size BIGINT DEFAULT 0,
            created_at BIGINT
            )`);
        
        try{
            
            await db.query(`CREATE INDEX IF NOT EXISTS idx_logs_user ON activity_logs(user_id)`);
            
        }catch{}
        
        console.log("✅ PostgreSQL Initialized (Tables ready)");
        
    }
    
}
