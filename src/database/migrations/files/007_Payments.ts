import {Postgresql} from '../../Postgresql.js';

export class Migration007{
    
    async up():Promise<void>{
        
        const db = Postgresql.getInstance();
        
        await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255),ADD COLUMN IF NOT EXISTS creem_customer_id VARCHAR(255), ADD COLUMN IF NOT EXISTS creem_subscription_id VARCHAR(255), ADD COLUMN IF NOT EXISTS sub_started_at BIGINT DEFAULT 0`);
        
        await db.query(`CREATE TABLE IF NOT EXISTS payments (
            id                    SERIAL PRIMARY KEY,
            user_id               BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            creem_order_id        VARCHAR(255) NOT NULL UNIQUE,
            creem_customer_id     VARCHAR(255),
            creem_subscription_id VARCHAR(255),
            product_id            VARCHAR(255) NOT NULL,
            plan                  VARCHAR(50)  NOT NULL,
            period                VARCHAR(20)  NOT NULL DEFAULT 'monthly',
            amount                INTEGER      NOT NULL DEFAULT 0,
            currency              VARCHAR(10)  NOT NULL DEFAULT 'USD',
            status                VARCHAR(50)  NOT NULL DEFAULT 'paid',
            email                 VARCHAR(255),
            created_at            BIGINT       NOT NULL
            )
        `);
        
        await db.query(`CREATE INDEX IF NOT EXISTS idx_payments_user_id      ON payments(user_id)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_payments_order_id     ON payments(creem_order_id)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_payments_subscription ON payments(creem_subscription_id)`);
 
        console.log('✅ Migration 007: payments table created');
        
    }
    
}
