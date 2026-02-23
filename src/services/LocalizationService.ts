import {locales} from '../locales/index.js';
import type {Locale} from '../locales/index.js';
import type {FullLocale} from '../locales/index.js';

export class LocalizationService{
    
    private readonly defaultLang = 'en';
    private availableLangs:string[] = Object.keys(locales);
    
    public getUserLanguage(code?:string):{lang:string,isFallback:boolean}{
        
        if(!code) return {lang:this.defaultLang,isFallback:false};
        
        const shortCode = code.split('-')[0];
        
        if(this.availableLangs.includes(shortCode)){
            
            return {lang:shortCode,isFallback:false};
            
        }
        
        return {lang:this.defaultLang,isFallback:true};
        
    }
    public get(lang:string):FullLocale{
        
        const baseI18n = (locales as any)[this.defaultLang];
        const targetI18n = (locales as any)[lang];
        
        if(!targetI18n || lang === this.defaultLang){
            
            return baseI18n as FullLocale;
            
        }
        
        return this.deepMerge(baseI18n,targetI18n) as FullLocale;
        
    }
    
    private deepMerge(base:any,override:any):any{
        
        const result = {...base};
        
        for(const key in override){
            
            if(override[key] && typeof override[key] === 'object' && !Array.isArray(override[key])){
                
                result[key] = this.deepMerge(result[key],override[key]);
                
            }else if(override[key] !== undefined){
                
                result[key] = override[key];
                
            }
            
        }
        
        return result;
        
    }
    
    public getActionKeyByText(text: string): string | null {
        // Проходим по всем языкам (en, ru, he)
        for (const lang of Object.keys(locales)) {
            const buttons = (locales as any)[lang]?.buttons;
            if (!buttons) continue;
    

            const searchDeep = (obj: any): string | null => {
                for (const key in obj) {
                    if (typeof obj[key] === 'object' && obj[key] !== null) {
                        const found = searchDeep(obj[key]);
                        if (found) return found; 
                    } else if (obj[key] === text) {
                        return key; 
                    }
                }
                return null;
            };
    
            const matchedKey = searchDeep(buttons);
            if (matchedKey) return matchedKey;
        }
        return null;
    }
    
    public getMainMenuButtons(lang:string,isAdmin:boolean):string[]{
        
        const i18n = this.get(lang);
        const main = Object.values(i18n.buttons.main || {});
        const admin = isAdmin ? Object.values(i18n.buttons.admin || {}) : [];
        
        return [...main,...admin] as string[];
        
    }
    
    public getFileActionsButtons(lang:string,excludeKeys:string[] = []):string[]{
        
       const i18n = this.get(lang);
       const files = i18n.buttons.files || {};
       const common = Object.values(i18n.buttons.common || {});
       
       const result:string[] = [];
       for(const [key,val] of Object.entries(files)){
        
            if(!excludeKeys.includes(key)){
                
                result.push(val as string);
                
            }
        
       }
        
       return [...result,...(common as string[])];
       
    }
    
    public getEncryptedMenuButtons(lang:string):string[]{
        
        const i18n = this.get(lang);
        const unlock = i18n.buttons.files.btn_unlock;
        const cancel = i18n.buttons.common.btn_cancel;
        return [unlock,cancel];
        
    }
    
}
