export class CaseConverter{
    
    static toCamel(s:string):string{
        
        return s.replace(/_([a-z])/g,(g)=>g[1].toUpperCase());
        
    }
    
    static toSnake(s:string):string{
        
        return s.replace(/[A-Z]/g,letter=>`_${letter.toLowerCase()}`);
        
    }
    
    static objectToCamel(obj:any):any{
        
        if(!obj || typeof obj !== 'object') return obj;
        if(Array.isArray(obj)) return obj.map(i=>this.objectToCamel(i));
        
        const newObj:any = {};
        for(const key of Object.keys(obj)){
            
            newObj[this.toCamel(key)] = obj[key];
            
        }
        
        return newObj;
        
    }
    
    static objectToSnake(obj:any):any{
        
        if(!obj || typeof obj !== 'object') return obj;
        const newObj:any = {};
        for(const key of Object.keys(obj)){
            
            newObj[this.toSnake(key)] = obj[key];
            
        }
        
        return newObj;
        
    }
    
}
