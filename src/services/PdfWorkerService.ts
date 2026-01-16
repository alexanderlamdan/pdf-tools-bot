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
        
        // if(!fs.existsSync(socketPath)){
            
        //     throw new Error('System error: PDF Worker is not on(socket not found).');
            
        // }
        
        try{
            const response = await axios.post<WorkerResponse>(
                'http://localhost/process',
                {
                    action:'info',
                    inputPath: filePath
                },
                {
                    socketPath: socketPath, // Подключаемся к сокету напрямую
                    headers:{'Content-Type':'application/json'},
                    timeout: 2000 // Тайм-аут 2 секунды (хватит с головой)
                }
            );
            
            const data = response.data;
            if(data.status === 'error'){
                throw new Error(data.error);
            }
            return data.info || 'No Information';
            
        }catch(e:any){
            // Логируем реальную причину
            console.error(`[PdfWorkerService] Ошибка запроса к воркеру: ${e.message}`);
            
            if (e.code === 'ENOENT') {
                 throw new Error(`Файл сокета не найден: ${socketPath} (Проверь, запущен ли worker)`);
            }
            if (e.code === 'EACCES') {
                 throw new Error(`Нет прав доступа к сокету: ${socketPath} (Проверь chmod/user)`);
            }
            if (e.code === 'ECONNREFUSED') {
                 throw new Error('Воркер не принимает соединения (Воркер упал?)');
            }
            
            throw new Error(e.response?.data?.error || e.message);
        }
        
    }
    
}
