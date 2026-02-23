import type {IUser} from '../types/User.js';

export const GIGABYTE = 1024 * 1024 * 1024;

export const SUBSCRIPTION_LIMITS:Record<string,number> = {
    
    free:2 * GIGABYTE,
    pro:12 * GIGABYTE,
    premium: 24 * GIGABYTE,
    enterprise: 48 * GIGABYTE,
    sovereign_protocol: 90 * GIGABYTE
    
};

export function getPaymentLink(langCode:string,plan:string):string{
    
    const domain = langCode === 'ru' ? 'ru.lmdnbot.com' : langCode === 'he' ? 'he.lmdnbot.com' : 'lmdnbot.com';
    return `https://${domain}`;
    
}

export function getVipExpirationTimestamp():number{
    
    const now = new Date();
    return new Date(now.getFullYear(),11,31,23,59,59).getTime();
    
}

export function getUserLimit(user:IUser):number{
    
    if(user.isVip === 1) return Infinity;
    const plan = user.subType || 'free';
    
    return SUBSCRIPTION_LIMITS[plan] || SUBSCRIPTION_LIMITS['free'];
    
}
