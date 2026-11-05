import {Schema} from '../core/Schema.js';
import {Blueprint} from '../core/Blueprint.js';

export class Migration004{
    
    async up(){
        
        await Schema.create('feedbacks',(table:Blueprint)=>{
            
            table.serial('id');
            table.bigInteger('user_id',false);
            table.string('username',255);
            table.string('first_name',255);
            table.string('text',1000);
            table.timestamp('created_at');
            
        });
        
        await Schema.createIndex('feedbacks','user_id');
        await Schema.createIndex('feedbacks','created_at');
        
        console.log('✅ Migration 004: feedbacks created');
        
    }
    
}
