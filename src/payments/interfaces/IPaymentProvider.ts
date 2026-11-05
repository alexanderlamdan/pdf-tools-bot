export interface ICheckoutParams{
    
    productId:string;
    userId:number;
    successUrl:string;
    botLang:string;
    userEmail?:string;
    
}

export interface ICheckoutResult{
    
    checkoutUrl:string;
    checkoutId:string;
    
}

export interface IPaymentEvent{
    
    type: 'checkout.completed' | 'subscription.paid' | 'subscription.expired' | 'subscription.past_due';
    telegramUserId:number;
    productId:string;
    orderId:string;
    customerId?:string;
    subscriptionId?:string;
    customerEmail?:string;
    amount:number;
    currency:string;
    
}

export interface IWebhookExtraHeaders{
    
    webhookId?:string;
    timestamp?:string;
    
}

export interface IPaymentProvider{
    
    createCheckout(params:ICheckoutParams):Promise<ICheckoutResult>;
    verifyWebhook(rawBody:string,signature:string,extra?:IWebhookExtraHeaders):boolean;
    parseEvent(rawBody:string):IPaymentEvent | null;
    
}
