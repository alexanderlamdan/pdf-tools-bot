export interface ISubscription{
    
    type:'free' | 'starter' | 'pro' | 'ultra';
    period:'monthly' | 'quarterly' | 'semiannual' | 'yearly';
    expiresAt:number;
    
}


export interface IUser{
    
    id:number;
    username:string;
    firstName:string;
    isVip:number;
    isAdmin:number;
    joinedAt:number;
    lastActiveAt:number;
    subType:string;
    subPeriod:string;
    subExpiresAt:number;
    subStartedAt:number;
    stats?:Record<string,number>;
    totalTrafficBytes:number;
    langCode:string;
    preferredCurrency?:string;
    
}
