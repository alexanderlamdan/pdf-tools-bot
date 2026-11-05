import {Schema} from '../core/Schema.js';
import {Blueprint} from '../core/Blueprint.js';

export class Migration003{
    
    async up(){
        
        await Schema.create('support_sessions',(table:Blueprint)=>{
            
            table.serial('id');
            table.bigInteger('user_id',false);
            table.string('username',255);
            table.string('first_name',255);
            table.string('last_name',255);
            table.string('category',50);
            table.string('status',20);
            table.timestamp('created_at');
            table.timestamp('updated_at');
            
        });
        
        await Schema.create('support_messages',(table:Blueprint)=>{
            
            table.serial('id');
            table.integer('session_id');
            table.bigInteger('user_id',false);
            table.bigInteger('admin_msg_id',false);
            table.timestamp('created_at');
            
        });
        
        await Schema.createIndex('support_sessions','user_id');
        await Schema.createIndex('support_sessions','status');
        await Schema.createIndex('support_messages','admin_msg_id');
        await Schema.createIndex('support_messages','session_id');
        
        console.log('✅ Migration 003: support_sessions + support_messages created');
        
    }
    
}
