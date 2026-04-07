export interface SessionData{
    
    currentAction: 'idle' | 'merge' | 'split' | 'compress' | 'protect' | 'unlock' | 'crack' | 'analyze' | 'ready';
    
    step:
        'idle' |
        'waiting_for_file' |
        'waiting_for_password' |
        'processing' |
        'waiting_for_split_pages' |
        'waiting_for_merge_files' |
        'waiting_for_merge_archive' |
        'waiting_for_merge_bulk' |
        'waiting_for_merge_confirm' |
        'waiting_for_metadata_confirm' |
        'waiting_for_metadata_mode' |
        'waiting_for_support_category' |
        'waiting_for_support_message'; 
    
    filePaths: string[];
    
    tempParams:{
        password?:string,
        originalName?:string,
        willExceedLimit?:string,
        trafficWarning?:string,
        metadataHasSignature?:boolean,
        supportCategory?:string
    };
    
    lastRequestTime:number;
    adminMode:boolean;
    simulateUser:boolean;
    
}

export function initialSession():SessionData{
    
    return{
        
        currentAction:'idle',
        step:'idle',
        filePaths:[],
        tempParams:{},
        lastRequestTime:0,
        adminMode:false,
        simulateUser:false
        
    };
    
}
