import type {ProviderName} from './SubscriptionPlans.js';

export const RU_BOT_CURRENCIES = ['RUB','UAH','BYN','KZT','ILS','USD','EUR'] as const;
export const HE_BOT_CURRENCIES = ['ILS','USD','EUR'] as const;

export const EN_BOT_CURRENCIES = ['USD','AUTO'] as const;

export type CurrencyCode = typeof RU_BOT_CURRENCIES[number] | typeof HE_BOT_CURRENCIES[number] | typeof EN_BOT_CURRENCIES[number];

const PREFERRED_PROVIDER:Record<CurrencyCode,ProviderName | null> = {
    
    USD:'creem',
    AUTO:'dodo',
    EUR:'dodo',
    RUB:'russian',
    UAH:'russian',
    BYN:'russian',
    KZT:'russian',
    ILS:'israeli'
    
};

const READY_PROVIDERS:Set<ProviderName> = new Set(['creem','dodo']);

export function isProviderReady(provider:ProviderName | null):boolean{
    
    if(!provider) return false;
    return READY_PROVIDERS.has(provider);
    
}

export function getProviderForCurrency(currency:string,availableProviders:ProviderName[]):ProviderName | null{
    
    const preferred = PREFERRED_PROVIDER[currency  as CurrencyCode] ?? null;
    
    if(preferred && availableProviders.includes(preferred)) return preferred;
    if(availableProviders.includes('dodo')) return 'dodo';
    
    return null;
}
