import {Schema} from '../core/Schema.js';
import {Blueprint} from '../core/Blueprint.js';

export class Migration001{
    
    async up(){
        
        await Schema.create('users',(table:Blueprint)=>{
            
            table.primary('id');
            table.string('username');
            table.string('first_name');
            table.boolean('is_vip',false);
            table.boolean('is_admin',false);
            table.timestamp('joined_at');
            table.timestamp('last_active_at');
            table.string('sub_type',50);
            table.string('sub_period',50);
            table.timestamp('sub_expires_at');
            table.bigInteger('monthly_traffic',false,0);
            
        });
        
        await Schema.create('activity_logs',(table)=>{
            
            table.serial('id');
            table.bigInteger('user_id');
            table.string('action_type',50);
            table.bigInteger('file_size',false,0);
            table.timestamp('created_at');
            
            // table.foreign('userId','users','id');
            
        });
        
        await Schema.createIndex('activity_logs','user_id');
        await Schema.createIndex('activity_logs','action_type');
    }
    
}
