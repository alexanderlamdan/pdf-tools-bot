export interface IPlanPeriod{
    
    productIds:{
        creem?:string;
        dodo?:string;
    };
    label:string;
    durationMs:number;
    available:boolean;
    
}

export interface IPlan{
    
    trafficBytes:number;
    queuePriority:number;
    periods:Record<string,IPlanPeriod>;
    
}

const DAY = 24 * 60 * 60 * 1000;
const GB = 1024 * 1024 * 1024;

export const IMAGES_WEEKLY_LIMIT: Record<string, number> = {
    free:     15,
    starter:  25,
    pro:      50,
    ultra:    100,
    business: 300,
};

export function getImagesWeeklyLimit(plan: string, isVip?: boolean): number{
    
    if(isVip) return Infinity;
    return IMAGES_WEEKLY_LIMIT[plan] ?? IMAGES_WEEKLY_LIMIT['free'];
    
}

export function isPhotoOnlyTier(plan: string): boolean{
    
    return plan === 'free' || plan === 'starter' || !plan;
    
}

export const IMAGES_TIER_MIME_TYPES: Record<string, string[]> = {
    pro:      ['image/jpeg', 'image/png', 'image/webp'],
    ultra:    ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
    business: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif', 'image/x-adobe-dng'],
};

export function getAllowedImageMimeTypes(plan: string, isVip?: boolean): string[]{
    
    if(isVip) return IMAGES_TIER_MIME_TYPES['business'];
    return IMAGES_TIER_MIME_TYPES[plan] ?? IMAGES_TIER_MIME_TYPES['pro'];
    
}

export const OFFICE_WEEKLY_LIMIT:Record<string,number> = {
    free:3,
    starter:9,
    pro:18,
    ultra:36,
    business:200
};

export function getOfficeWeeklyLimit(plan:string,isVip?:boolean):number{
    
    if(isVip) return Infinity;
    return OFFICE_WEEKLY_LIMIT[plan] ?? OFFICE_WEEKLY_LIMIT['free'];
    
}

export const OFFICE_TIER_EXTENSIONS:Record<string,string[]> = {
    
    free:     ['docx'],
    starter:  ['docx', 'csv'],
    pro:      ['docx', 'xlsx', 'csv', 'md'],
    ultra:    ['docx', 'xlsx', 'pptx', 'csv', 'md'],
    business: [
        'docx', 'xlsx', 'pptx', 'csv', 'md',
        'odt', 'ods', 'odp',
        'txt', 'py', 'js', 'ts', 'json', 'html', 'htm', 'css', 'xml', 'sql', 'yaml', 'yml', 'sh', 'log',
    ]
    
}

export function getAllowedOfficeExtensions(plan:string,isVip?:boolean):string[]{
    
    if(isVip) return OFFICE_TIER_EXTENSIONS['business'];
    return OFFICE_TIER_EXTENSIONS[plan] ?? OFFICE_TIER_EXTENSIONS['free'];
    
}

export const SUBSCRIPTION_PLANS:Record<string,IPlan> = {
    
    free:{
        
        trafficBytes:8 * GB,
        queuePriority:10,
        periods:{}
        
    },
    
    starter:{
        trafficBytes:  500 * GB,
        queuePriority: 40,
        periods:{
            monthly:{
                productIds:{ creem: 'prod_*********', dodo: 'prod_*********' },
                label:      'Monthly — $10',
                durationMs: 30  * DAY,
                available:  true,
            },
            quarterly:{
                productIds:{ creem: 'prod_*********', dodo: 'prod_*********' },
                label:      '3 Months — $25',
                durationMs: 90  * DAY,
                available:  true,
            },
            semiannual:{
                productIds:{ creem: 'prod_*********', dodo: 'prod_*********' },
                label:      '6 Months — $50',
                durationMs: 180 * DAY,
                available:  true,
            },
            yearly:{
                productIds:{ creem: 'prod_*********', dodo: 'prod_*********' },
                label:      '1 Year — $100',
                durationMs: 365 * DAY,
                available:  true,
            },
        },
    },
 
    pro:{
        trafficBytes:  1000 * GB,
        queuePriority: 60,
        periods:{
            monthly:{
                productIds:{ creem: 'prod_*********', dodo: 'prod_*********' },
                label:      'Monthly — $25',
                durationMs: 30  * DAY,
                available:  true,
            },
            quarterly:{
                productIds:{ creem: 'prod_*********', dodo: 'prod_*********' },
                label:      '3 Months — $65',
                durationMs: 90  * DAY,
                available:  true,
            },
            semiannual:{
                productIds:{ creem: 'prod_*********', dodo: 'prod_*********' },
                label:      '6 Months — $135',
                durationMs: 180 * DAY,
                available:  true,
            },
            yearly:{
                productIds:{ creem: 'prod_*********', dodo: 'prod_*********' },
                label:      '1 Year — $250',
                durationMs: 365 * DAY,
                available:  true,
            },
        },
    },
 
    ultra:{
        trafficBytes:  2000 * GB,
        queuePriority: 80,
        periods:{
            monthly:{
                productIds:{ creem: 'prod_*********', dodo: 'prod_*********' },
                label:      'Monthly — $75',
                durationMs: 30  * DAY,
                available:  true,
            },
            quarterly:{
                productIds:{ creem: 'prod_*********', dodo: 'prod_*********' },
                label:      '3 Months — $180',
                durationMs: 90  * DAY,
                available:  true,
            },
            semiannual:{
                productIds:{ creem: 'prod_*********', dodo: 'prod_*********' },
                label:      '6 Months — $400',
                durationMs: 180 * DAY,
                available:  true,
            },
            yearly:{
                productIds:{ creem: 'prod_*********', dodo: 'prod_*********' },
                label:      '1 Year — $750',
                durationMs: 365 * DAY,
                available:  true,
            },
        },
    },
    business:{
        trafficBytes:  5000 * GB,
        queuePriority: 90,
        periods:{
            monthly:{
                productIds:{ creem: 'prod_*********', dodo: 'prod_*********' },
                label:      'Monthly — $100',
                durationMs: 30  * DAY,
                available:  true,
            },
            quarterly:{
                productIds:{ creem: 'prod_*********', dodo: 'prod_*********' },
                label:      '3 Months — $250',
                durationMs: 90  * DAY,
                available:  true,
            },
            semiannual:{
                productIds:{ creem: 'prod_*********', dodo: 'prod_*********' },
                label:      '6 Months — $500',
                durationMs: 180 * DAY,
                available:  true,
            },
            yearly:{
                productIds:{ creem: 'prod_*********', dodo: 'prod_*********' },
                label:      '1 Year — $1000',
                durationMs: 365 * DAY,
                available:  true,
            },
        },
    },
 
    vip:{
        
        trafficBytes:Infinity,
        queuePriority:100,
        periods:{}
        
    }
    
};

export type ProviderName = 'creem' | 'dodo' | 'russian' | 'israeli';

export const PRODUCT_TO_PLAN:Record<string,{plan:string,period:string}> = {};

for(const [planKey, plan] of Object.entries(SUBSCRIPTION_PLANS)){
    
    for(const [periodKey,period] of Object.entries(plan.periods)){
        
        for(const [provider,productId] of Object.entries(period.productIds)){
            
            if(productId){
                
                PRODUCT_TO_PLAN[`${provider}:${productId}`] = {plan:planKey,period:periodKey};
                
            }
            
        }
        
    }
    
}

export const PLAN_TRAFFIC_LIMITS:Record<string,number> = Object.fromEntries(
    Object.entries(SUBSCRIPTION_PLANS).map(([key,plan])=>[key,plan.trafficBytes])
);

export const PLAN_QUEUE_PRIORITY:Record<string,number> = Object.fromEntries(
    Object.entries(SUBSCRIPTION_PLANS).map(([key,plan])=>[key,plan.queuePriority])
);

export function getPeriodDurationMs(plan:string,period:string):number{
    
    return SUBSCRIPTION_PLANS[plan]?.periods[period]?.durationMs ?? 30 * DAY;
    
}

export function getProductId(plan:string,period:string,provider:ProviderName):string|undefined{
    
    const id = SUBSCRIPTION_PLANS[plan]?.periods[period]?.productIds[provider];
    return id || undefined;
    
}
