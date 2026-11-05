import {Postgresql} from '../../Postgresql.js';
import {Blueprint} from './Blueprint.js';

export class Schema{
    
    public static async create(tableName:string,callback:(table:Blueprint)=>void){
        
        const table = new Blueprint();
        callback(table);
        
        const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n  ${table.getDefinition()}\n);`;
        await Postgresql.getInstance().query(sql);
        console.log(`✅ Table '${tableName}' checked/created`);
        
    }
    
    public static async table(tableName:string,callback:(table:Blueprint)=>void){
        
        const table = new Blueprint();
        callback(table);
        const db = Postgresql.getInstance();
        
        for(const line of table.getLines()){
            
            if(line.startsWith('CONSTRAINT')){
                
                try{await db.query(`ALTER TABLE ${tableName} ADD ${line}`);}catch{}
                
            }else{
                
                try{
                    
                    await db.query(`ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${line}`);
                    console.log(`➕ Column added to '${tableName}': ${line.split(' ')[0]}`);
                    
                }catch(e){}
                
            }
            
        }
        
    }
    
    public static async createIndex(tableName:string,column:string){
        
        const idxName = `idx_${tableName}_${column}`;
        await Postgresql.getInstance().query(`CREATE INDEX IF NOT EXISTS ${idxName} ON ${tableName}(${column})`);
        
    }
    
}
