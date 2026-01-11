import axios from "axios"
import fs from "fs";
import type {IBotConfig} from '../config/interfaces/IBotConfig.js';

interface WorkerResponse{
    
    status: 'ok' | 'error';
    info?:string;
    error?:string;
    
}

export class PdfWorkerService{
    
    constructor(private readonly config:IBotConfig){}
    
    public async getPdfInfo(filePath:string):Promise<string>{
        
        const socketPath = this.config.workerSocketPath;
        
        if(!fs.existsSync(socketPath)){
            
            throw new Error('System error: PDF Worker is not on(socket not found).');
            
        }
        
        try{
            
            const response = await axios.post<WorkerResponse>(
                'http://localhost/process',
                {
                    action:'info',
                    inputPath: filePath
                },
                {
                    socketPath:socketPath,
                    headers:{'Content-Type':'application/json'},
                    timeout:10000
                }
            );
            
            const data = response.data;
            if(data.status === 'error'){
                
                throw new Error(data.error);
                
            }
            return data.info || 'No Information';
            
        }catch(e:any){
            
            console.error(`Worker Communication Error: ${e.message}`);
            if(e.code === 'ENOENT' || e.code === 'ECONNREFUSED'){
                
                throw new Error('PDF Service is under construction.');
                
            }
            
            throw new Error(e.response?.data?.error || e.message);
            
        }
        
    }
    
}
