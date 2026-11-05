export function isEffectiveAdmin(ctx:any, adminId:number|undefined):boolean{
    
    const realAdmin = ctx.from?.id === adminId;
    if(!realAdmin) return false;
    
    if(ctx.session?.simulateUser) return false;
    
    return true;
    
}

export function getEffectiveUser<T extends {isVip?:number, subType?:string}>(ctx:any, realUser:T):T{
    
    if(!ctx.session?.simulateUser) return realUser;
    
    return {
        
        ...realUser,
        isVip: 0,
        subType: ctx.session.simulatedPlan || 'free',
        
    };
    
}
