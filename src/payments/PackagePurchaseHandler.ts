import { InlineKeyboard }           from 'grammy';
import type { BotContext }          from '../types/BotContext.js';
import type { IBotConfig }          from '../config/interfaces/IBotConfig.js';
import type { IPaymentProvider }    from './interfaces/IPaymentProvider.js';
import type { LocalizationService } from '../services/LocalizationService.js';
import { LoggerService }            from '../services/LoggerService.js';
import { DatabaseService }          from '../services/DatabaseService.js';
import { CreemService }             from './providers/creem/CreemService.js';
import { DodoService }              from './providers/dodo/DodoService.js';
import { TRAFFIC_PACKAGES, getPackageProductId } from '../utils/TrafficPackagesConfig.js';
import type { ProviderName }        from '../utils/SubscriptionPlans.js';
import { getProviderForCurrency, isProviderReady } from '../utils/CurrencyProvideMap.js';

export class PackagePurchaseHandler{
    
    private readonly logger:LoggerService;
    private readonly db:DatabaseService;
    
    private readonly providers: Partial<Record<ProviderName, IPaymentProvider>> = {};
    
    constructor(private readonly config:IBotConfig,private readonly localization:LocalizationService){
        
        this.logger = new LoggerService(config);
        this.db     = new DatabaseService(this.logger);
        
        if(config.creemApiKey && config.creemWebhookSecret){
            
            this.providers.creem = new CreemService(config.creemApiKey,config.creemWebhookSecret,config.creemTestMode ?? false);
            
        }
        
        if(config.dodoApiKey && config.dodoWebhookSecret){
            
            this.providers.dodo = new DodoService(config.dodoApiKey, config.dodoWebhookSecret, config.dodoTestMode ?? false);
            
        }
        
    }
    
    async showPackageMenu(ctx:BotContext):Promise<void>{
        
        const {title,kb} = this.buildPage(1);
        await ctx.reply(title,{parse_mode:'HTML',reply_markup:kb});
        
    }
    
    async switchPackagePage(ctx:BotContext, page:1|2):Promise<void>{
        
        await ctx.answerCallbackQuery();
        
        const {title,kb} = this.buildPage(page);
        await ctx.editMessageText(title,{parse_mode:'HTML',reply_markup:kb}).catch(async ()=>{
            
            await ctx.reply(title,{parse_mode:'HTML',reply_markup:kb});
            
        });
        
    }
    
    private buildPage(page:1|2):{title:string;kb:InlineKeyboard}{
        
        const i18n = this.localization.get();
        const n = i18n.messages.packages_traffic as any;
        
        const allIds = Object.keys(TRAFFIC_PACKAGES);
        const pageIds = page === 1 ? allIds.slice(0,5) : allIds.slice(5,10);
        
        const kb = new InlineKeyboard();
        
        for(const id of pageIds){
            
            const pkg = TRAFFIC_PACKAGES[id];
            kb.text(pkg.label,`buy_package:${id}`).row();
            
        }
        
        if(page === 1){
            
            kb.text((n.package_next as string) ?? '➡️ Next','package_page:2');
            
        }else{
            
            kb.text((n.package_back as string) ?? '⬅️ Back','package_page:1');
            
        }
        
        const title = (n.package_menu_title as string) ?? '📦 One-time traffic packages';
        return {title,kb};
        
    }

    private async resolveProviderName(ctx: BotContext): Promise<ProviderName | null> {
        
        if(this.config.enableCurrencyPicker !== true){
            
            if(this.providers.creem) return 'creem';
            if(this.providers.dodo)  return 'dodo';
            return null;
            
        }
        
        const user = await this.db.getUser(ctx.from!.id);
        if(!user?.preferredCurrency) return null;
        
        return getProviderForCurrency(user.preferredCurrency, Object.keys(this.providers) as ProviderName[]);
        
    }
    
    async handleBuyPackage(ctx: BotContext, packageId: string): Promise<void>{
 
        await ctx.answerCallbackQuery();
 
        const i18n = this.localization.get();
        const n    = i18n.messages.packages_traffic as any;
        const pkg  = TRAFFIC_PACKAGES[packageId];
 
        if(!pkg){
 
            await ctx.reply(n.package_checkout_error as string);
            return;
 
        }
 
        const providerName = await this.resolveProviderName(ctx);
        const provider = providerName ? this.providers[providerName] : undefined;
 
        if(!provider || !providerName || !isProviderReady(providerName)){
 
            await ctx.reply(n.package_checkout_error as string);
            return;
 
        }
 
        const productId = getPackageProductId(packageId, providerName as 'creem' | 'dodo');
 
        if(!productId){
 
            await ctx.reply(n.package_payment_not_available as string);
            return;
 
        }
 
        const userId    = ctx.from!.id;
        const statusMsg = await ctx.reply(n.package_checkout_loading as string);
 
        try{
 
            const result = await provider.createCheckout({
                productId,
                userId,
                successUrl: `https://t.me/${ctx.me.username}`,
                botLang:    this.config.forceLang,
            });
 
            await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
 
            const kb = new InlineKeyboard().url(
                `💳 Buy ${pkg.label}`,
                result.checkoutUrl,
            );
 
            await ctx.reply(n.package_checkout_ready as string, {
                parse_mode:   'HTML',
                reply_markup: kb,
            });
 
            await this.logger.logAction(
                'PackagePurchaseHandler', ctx.from!,
                'Package checkout created',
                `Provider: ${providerName} | Package: ${pkg.label} | Price: $${(pkg.priceCents / 100).toFixed(2)}`,
            );
 
        }catch(e: any){
 
            await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
            await ctx.reply(n.package_checkout_error as string);
 
            await this.logger.error('PackagePurchaseHandler:handleBuyPackage', e, {user: ctx.from!, message: ctx.message!});
 
        }
 
    }
    
}
