import type {IUser} from '../types/User.js';
import { PLAN_TRAFFIC_LIMITS } from './SubscriptionPlans.js';
import { formatDate } from './LocalizedTime.js';


export const GIGABYTE = 1024 * 1024 * 1024;

export const SUBSCRIPTION_LIMITS:Record<string,number> = PLAN_TRAFFIC_LIMITS;
const WARNING_THRESHOLD = 0.80;
const WARNING_THRESHOLD2 = 0.85;

export type TrafficStatus = 'normal' | 'warning' | 'warning_strong' | 'blocked';

export interface TrafficState{
    
    status:TrafficStatus;
    usedBytes:number;
    limitBytes:number;
    remainBytes:number;
    usedPercent:number;
    
}

export function getTrafficState(user:IUser,adminId?:number):TrafficState{
    
     if(user.isVip === 1 || (adminId && user.id === adminId)){
        
        return {
            
            status:'normal',
            usedBytes:user.totalTrafficBytes,
            limitBytes:Infinity,
            remainBytes:Infinity,
            usedPercent:0,
            
        };
        
     }
     
     const plan = user.subType || 'free';
     const limitBytes = SUBSCRIPTION_LIMITS[plan] ?? SUBSCRIPTION_LIMITS['free'];
     const usedBytes = Number(user.totalTrafficBytes || 0);
     const remainBytes = Math.max(0,limitBytes - usedBytes);
     const usedPercent = usedBytes / limitBytes;
     
     let status: TrafficStatus;
     
     if(usedPercent >= 1.0){
        
        status = 'blocked';
        
     }else if(usedPercent >= WARNING_THRESHOLD2){
        
        status = 'warning_strong';
        
     }else if(usedPercent >= WARNING_THRESHOLD){
        
        status = 'warning';
        
     }else{
        
        status = 'normal';
        
     }
     
     return {status,usedBytes,limitBytes,remainBytes,usedPercent};
    
}

export function getTrafficStateAfterFile(user:IUser,fileSizeBytes:number,adminId?:number):TrafficState{
    
    const fake:IUser = {
        
        ...user,
        totalTrafficBytes:Number(user.totalTrafficBytes || 0) + fileSizeBytes
        
    };
    
    return getTrafficState(fake,adminId);
    
}

export function getPaymentLink(langCode:string,plan:string):string{
    
    const domain = langCode === 'ru' ? 'lmdnbot.com/ru' : langCode === 'he' ? 'lmdnbot.com/he' : 'lmdnbot.com';
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

export interface TrafficStateWithPackages extends TrafficState{
    packagesRemainingBytes:number;
}

export function getTrafficStateWithPackages(user:IUser, packagesRemainingBytes:number, adminId?:number):TrafficStateWithPackages{
    
    const base = getTrafficState(user, adminId);
    
    if(base.status === 'blocked' && packagesRemainingBytes > 0){
        
        return {...base, status: 'normal', packagesRemainingBytes};
        
    }
    
    return {...base, packagesRemainingBytes};
    
}

export function calcNextWeeklyReset(joinedAt:number,lang:string,countdown:{days:string,hours:string}):string{
    
    if(!joinedAt) return '-';
    
    const joinDow = new Date(Number(joinedAt)).getUTCDay();
    const now = new Date();
    const nowDow = now.getUTCDay();
    
    let daysUntil = joinDow - nowDow;
    if(daysUntil <= 0) daysUntil += 7;
    
    const resetDate = new Date(now);
    resetDate.setUTCDate(now.getUTCDate() + daysUntil);
    resetDate.setUTCHours(0,0,0,0);
    
    const diffMs = resetDate.getTime() - Date.now();
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    const dateStr = formatDate(resetDate.getTime(), lang);
    
    if(diffDays > 0) return `${dateStr} ${countdown.days.replace('{{days}}', String(diffDays)).replace('{{hours}}', String(diffHours % 24))}`;
    return `${dateStr} ${countdown.hours.replace('{{hours}}', String(diffHours))}`;
    
}
