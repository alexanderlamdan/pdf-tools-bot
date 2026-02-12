import fs from 'fs';
import path from 'path';
import type {LoggerService} from '../services/LoggerService.js';

export class DbLogger{

    private static instance:DbLogger;
    private loggerService?:LoggerService;
    private logDir:string;

    private constructor(){

        this.logDir = path.join(process.cwd(),'logs','database');
        if(!fs.existsSync(this.logDir)) fs.mkdirSync(this.logDir,{recursive:true});
    
    }

    public static getInstance():DbLogger{

        if(!DbLogger.instance){

            DbLogger.instance = new DbLogger();
        
        }

        return DbLogger.instance;
    
    }

    public setExternalLogger(logger:LoggerService){

        this.loggerService = logger;
    
    }

    public async error(connectionName:string,error:any,query?:string,params?:any){

        const timestamp = new Date().toISOString();
        const errorMessage = error.message || String(error);
        const stack = error.stack || '';

        const adminMsg = `🚨 <b>DATABASE ERROR</b> 🚨\n\n` +
        `📦 <b>Connection:</b> ${connectionName}\n` +
        `❌ <b>Error:</b> ${errorMessage}\n` +
        `📝 <b>Query:</b> <code>${query || 'N/A'}</code>\n` +
        `🔢 <b>Params:</b> <code>${JSON.stringify(params || [])}</code>`;
        
        const logFile = path.join(this.logDir,`${connectionName}_errors.log`);
        const fileLine = `[${timestamp}] ERROR: ${errorMessage}\nQUERY: ${query}\nPARAMS: ${JSON.stringify(params)}\nSTACK: ${stack}\n\n`;

        try{
            
            fs.appendFileSync(logFile,fileLine);
            
        }catch(e){

            console.error('CRITICAL: Failed to write to DB log file',e);
            fs.appendFileSync('FATAL_DB_ERRORS.log',fileLine);

        }

        if(this.loggerService){
            
            try{
                
                await this.loggerService.logToTelegram(adminMsg,'DB_CRASH',{
                    
                    errorText:stack
                    
                });

            }catch(e){
                
                console.error('Failed to send DB error to telegram',e);
                
            }
            
        }else{
            
            console.warn('DBLogger: External LoggerService not set. Skipping telegram notification');
        }
        
    }

}
