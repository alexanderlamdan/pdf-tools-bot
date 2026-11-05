import {Blueprint} from '../core/Blueprint.js';
import {Schema} from '../core/Schema.js';

export class Migration008{
    
    async up(){
        
        await Schema.table('users',(table:Blueprint)=>{
            
            table.boolean('is_blocked', false);
            
        });
        
        console.log('✅ Migration 008: is_blocked column added');
        
    }
    
}
