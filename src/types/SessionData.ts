export interface SessionData{
    
    currentAction: 'idle' | 'merge' | 'split' | 'compress' | 'protect' | 'unlock' | 'crack' | 'analyze' | 'ready';
    
    step: 'idle' | 'waiting_for_file' | 'waiting_for_password' | 'processing';
    
    filePaths: string[];
    
    tempParams:{
        password?:string,
        originalName?:string
    };
    
}

export function initialSession():SessionData{
    
    return{
        
        currentAction:'idle',
        step:'idle',
        filePaths:[],
        tempParams:{}
        
    };
    
}
