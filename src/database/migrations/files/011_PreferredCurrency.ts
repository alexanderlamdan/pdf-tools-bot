import { Schema } from '../core/Schema.js';
import { Blueprint } from '../core/Blueprint.js';

export class Migration011{
    
    async up(){
        
        await Schema.table('users',(table:Blueprint)=>{
            
            table.string('preferred_currency',3);
            
        });
        
        console.log('✅ Migration 011: preferred_currency added to users');
        
    }
    
}
