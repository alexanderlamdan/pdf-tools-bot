export interface ISubscription{
    
    type:'free' | 'pro' | 'premium' | 'enterprise';
    period:'monthly' | 'yearly';
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
    stats?:Record<string,number>;
    totalTrafficBytes:number;
    
}
