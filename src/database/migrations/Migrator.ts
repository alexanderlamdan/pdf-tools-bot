import {Postgresql} from '../Postgresql.js';
import {Migration001} from './files/001_Initial.js';

export class Migrator{
    
    private db = Postgresql.getInstance();
    
    private migrations:any[] = [
        {name:'001_Initial',class:Migration001}
    ];
    
    public async migrate(){
        
        await this.db.query(`CREATE TABLE IF NOT EXISTS _migrations(id SERIAL PRIMARY KEY, name VARCHAR(255) UNIQUE, run_at BIGINT)`);
        
        const executed = await this.db.query('SELECT name FROM _migrations');
        const executedNames = new Set(executed.map((r:any)=>r.name));
        
        for(const m of this.migrations){
            
            if(!executedNames.has(m.name)){
                
                console.log(`🔄 Migrating: ${m.name}...`);
                try{
                    
                    const instance = new m.class();
                    await instance.up();
                    
                    await this.db.query('INSERT INTO _migrations(name,run_at) VALUES($1,$2)',[m.name,Date.now()]);
                    console.log(`✅ Migrated: ${m.name}`);
                    
                }catch(e){
                    
                    console.error(`❌ Migration failed: ${m.name}`, e);
                    throw e;
                    
                }
            }
            
        }
        
    }
    
}
