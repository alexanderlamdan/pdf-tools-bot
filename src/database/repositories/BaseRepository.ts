import { Postgresql } from '../Postgresql.js';
import {QueryBuilder} from '../query/QueryBuilder.js';
import { CaseConverter } from '../../utils/CaseConverter.js';
export abstract class  BaseRepository<T>{
    
    protected db = Postgresql.getInstance();
    
    constructor(protected tableName:string){}
    
    protected normalize(rows:any[]):T[]{
        
        return rows.map(row=>CaseConverter.objectToCamel(row)) as T[];
        
    }
    
    public async findOne(criteria:Partial<T>):Promise<T|undefined>{
        
        const {sql,values} = QueryBuilder.select(this.tableName,criteria,1);
        const res = await this.db.query(sql,values);
        return this.normalize(res)[0];
        
    }
    
    public async findAll(criteria:Partial<T> = {},limit:number = 100,orderBy?:string):Promise<T[]>{
        
        const {sql,values} = QueryBuilder.select(this.tableName,criteria,limit,orderBy);
        const res = await this.db.query(sql,values);
        return this.normalize(res);
        
    }
    
    public async create(data:Partial<T>):Promise<T>{
        
        const {sql,values} = QueryBuilder.insert(this.tableName,data);
        const res = await this.db.query(sql,values);
        return this.normalize(res)[0];
        
    }
    
    public async save(data:Partial<T>,conflictKey:string = 'id'):Promise<T>{
        
        const {sql,values} = QueryBuilder.upsert(this.tableName,data,conflictKey);
        const res = await this.db.query(sql,values);
        return this.normalize(res)[0];
        
    }
    
    public async update(criteria:Partial<T>,data:Partial<T>):Promise<T|undefined>{
        
        const {sql,values} = QueryBuilder.update(this.tableName,criteria,data);
        const res = await this.db.query(sql,values);
        return this.normalize(res)[0];
        
    }
    
    public async delete(criteria:Partial<T>):Promise<void>{
        
        const {clause,values} = QueryBuilder.buildWhere(criteria);
        await this.db.query(`DELETE FROM ${this.tableName} ${clause}`,values);
        
    }
    
    public async count(criteria:Partial<T> = {}):Promise<number>{
        
        const {clause,values} = QueryBuilder.buildWhere(criteria);
        const res = await this.db.query(`SELECT COUNT(*) as c FROM ${this.tableName} ${clause}`,values);
        return Number(res[0].c);
        
    }
    
    public async query(sql:string,params:any[]){
        
        return this.db.query(sql,params);
        
    }
    
}
