import pg from 'pg';
import {DbLogger} from './DbLogger.js';
import type { IWithDatabase } from '../config/interfaces/IBotConfig.js';
const {Pool} = pg;

export class Postgresql{
    
    private static instance:Postgresql;
    private pool:pg.Pool;
    
    private constructor(db:IWithDatabase['db']){
        
        this.pool = new Pool(db);
        this.pool.on('error',(err)=>DbLogger.getInstance().error('PG_POOL',err));
        
        
    }
    
    public static init(db:IWithDatabase['db']):void{
        
        if(Postgresql.instance){
            
            console.warn('[Postgresql] Already initialized, skipping.');
            return;
        }
        
        Postgresql.instance = new Postgresql(db);
        
    }
    
    public static getInstance():Postgresql{
        
        if(!Postgresql.instance){
            
            throw new Error('[Postgresql] Not initialized. Call Postgresql.init(config.db) in index.ts first');
            
        }
        return Postgresql.instance;
        
    }
    
    public async query(text:string,params?:any[]):Promise<any>{
        
        try{
            
            const res = await this.pool.query(text,params);
            return res.rows;
            
        }catch(err){
            
            await DbLogger.getInstance().error('QUERY_FAIL',err,text,params);
            throw err;
            
        }
        
    }
    
}
