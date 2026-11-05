export interface SessionData{
    
    currentAction: 'idle' | 'merge' | 'split' | 'compress' | 'protect' | 'unlock' | 'asymmetric' | 'long_image' |'analyze' | 'ready' | 'extract' | 'rename' | 'images';
    
    pendingSubscribePlan?: string;
    
    step:
    'idle' |
    'waiting_for_file' |
    'waiting_for_password' |
    'processing' |
    'waiting_for_split_pages' |
    'waiting_for_long_image_pages' |
    'waiting_for_long_image_bulk' |
    'waiting_for_long_image_files' |
    'waiting_for_merge_files' |
    'waiting_for_merge_archive' |
    'waiting_for_merge_bulk' |
    'waiting_for_merge_confirm' |
    'waiting_for_metadata_confirm' |
    'waiting_for_metadata_mode' |
    'waiting_for_protect_method' |
    'waiting_for_unlock_method' |
    'waiting_for_private_key' |
    'waiting_for_encrypted_key' |
    'waiting_for_search_query' |
    'waiting_for_rename' |
    'waiting_for_images_bulk' |
    'waiting_for_support_category' |
    'waiting_for_feedback' |
    'waiting_for_support_message';

    
    filePaths: string[];
    
    tempParams:{
        password?:string,
        originalName?:string,
        willExceedLimit?:string,
        trafficWarning?:string,
        metadataHasSignature?:boolean,
        supportCategory?:string,
        protectMethod?:     'password' | 'asymmetric';
        unlockMethod?:      'password' | 'asymmetric';
        privateKeyPath?:    string,
    };
    
    lastRequestTime:number;
    adminMode:boolean;
    simulateUser:boolean;
    simulatedPlan:'free'|'starter'|'pro'|'ultra'|'business';
    redirectShown:boolean;
    
}

export function initialSession():SessionData{
    
    return{
        
        currentAction:'idle',
        step:'idle',
        filePaths:[],
        tempParams:{},
        lastRequestTime:0,
        adminMode:false,
        simulateUser:false,
        simulatedPlan:'free',
        redirectShown:false
        
    };
    
}
