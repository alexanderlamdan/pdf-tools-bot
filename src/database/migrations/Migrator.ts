import {Postgresql} from '../Postgresql.js';
import {Migration001} from './files/001_Initial.js';
import { Migration002 } from './files/002_AddLang.js';
import { Migration003 } from './files/003_Support.js';
import {Migration004} from './files/004_Feedback.js';
import { Migration005 } from './files/005_TrafficReset.js';
import { Migration006 } from './files/006_ForeignKeys.js';
import {Migration007} from './files/007_Payments.js';
import {Migration008} from './files/008_BlockedTracking.js';
import {Migration009} from './files/009_TrafficPackages.js';
import {Migration010} from './files/010_ImageQuota.js';
import { Migration011 } from './files/011_PreferredCurrency.js';
import { Migration012 } from './files/012_WidenPreferredCurrency.js';
import { Migration013 } from './files/013_OfficeQuota.js';
export class Migrator{
    
    private db = Postgresql.getInstance();
    
    private migrations:any[] = [
        {name:'001_Initial',class:Migration001},
        {name:'002_AddLang',class:Migration002},
        {name:'003_Support',class:Migration003},
        {name:'004_Feedback',class:Migration004},
        { name: '005_TrafficReset', class:Migration005 },
        { name: '006_ForeignKeys', class:Migration006 },
        {name: '007_Payments',class:Migration007},
        {name: '008_BlockedTracking',class:Migration008},
        {name:'009_TrafficPackages',class:Migration009},
        {name:'010_ImageQuota',class:Migration010},
        {name:'011_PreferredCurrency',class:Migration011},
        {name:'012_WidenPreferredCurrency',class:Migration012},
        {name:'013_OfficeQuota',class:Migration013}
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
