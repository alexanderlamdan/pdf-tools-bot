import {Schema} from '../core/Schema.js';
import {Blueprint} from '../core/Blueprint.js';

export class Migration009{
    
    async up(){
        
        await Schema.create('traffic_packages',(table:Blueprint)=>{
            
            table.serial('id');
            table.bigInteger('user_id');
            table.string('label',50);
            table.bigInteger('size_bytes',false);
            table.bigInteger('used_bytes',false,0);
            table.integer('price_cents',0);
            table.timestamp('purchased_at');
            
        });
        
        await Schema.createIndex('traffic_packages','user_id');
        
        console.log('✅ Migration 009: traffic_packages table created');
        
    }
    
}
