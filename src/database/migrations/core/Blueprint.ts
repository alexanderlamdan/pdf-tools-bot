export class Blueprint{
    
    private lines:string[] = [];
    
    public id(){
        
        this.lines.push('id BIGSERIAL PRIMARY KEY');
        
    }
    
    public integer(name:string,def:number=0){
        
        this.lines.push(`${name} INTEGER DEFAULT ${def}`);
        
    }
    
    public bigInteger(name:string,nullable:boolean = false,def?:any){
        
        let line = `${name} BIGINT`;
        if(!nullable) line += ' NOT NULL';
        if(def !== undefined) line += ` DEFAULT ${def}`;
        this.lines.push(line);
        
    }
    
    public string(name:string,length:number = 255){
        
        this.lines.push(`${name} VARCHAR (${length})`);
        
    }
    
    public boolean(name:string,def:boolean = false){
        
        this.lines.push(`${name} BOOLEAN DEFAULT ${def ? 'TRUE' : 'FALSE'}`);
        
    }
    
    public timestamp(name:string){
        
        this.lines.push(`${name} BIGINT`);
        
    }
    
    public serial(name:string = 'id'){
        
        this.lines.push(`${name} SERIAL PRIMARY KEY`);
        
    }
    
    public primary(name:string){
        
        this.lines.push(`${name} BIGINT PRIMARY KEY`);
        
    }
    
    public foreign(column:string,onTable:string,references:string = 'id'){
        
        this.lines.push(`CONSTRAINT fk_${column} FOREIGN KEY(${column}) REFERENCES ${onTable}(${references}) ON DELETE CASCADE`);
        
    }
    
    public getDefinition():string{
        
        return this.lines.join(',\n ');
        
    }
    
    public getLines(){return this.lines;}
    
}
