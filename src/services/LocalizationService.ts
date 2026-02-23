import locales from '../locales/index.js';
import type {Locale} from '..//locales/index.js';

export class LocalizationService{
    
    private readonly defaultLang = 'en';
    private availableLangs:string[] = [];
    
    public getUserLanguage(code?:string):{lang:string,isFallback:boolean}{
        
        if(!code) return {lang:this.defaultLang,isFallback:false};
        
        const shortCode = code.split('-')[0];
        
        if(this.availableLangs.includes(shortCode)){
            
            return {lang:shortCode,isFallback:false};
            
        }
        
        return {lang:this.defaultLang,isFallback:true};
        
    }
    
    public t(lang:string,key:string):string{
        
        let val = this.getValue((locales as any)[lang],key);
        
        if(!val){
            
            val = this.getValue((locales as any)[this.defaultLang],key);
            
        }
        
        return val || `[MISSING: ${key}]`;
        
    }
    
    private getValue(locale:Locale | undefined, path:string):string|null{
        
        if(!locale) return null;
        const keys = path.split('.');
        let current = locale;
        
        for(const k of keys){
            
            if(current[k] === undefined) return null;
            current = current[k];
            
        }
        
        return typeof current === 'string' ? current : null;
        
    }
    
    public getActionKeyByText(text:string):string | null{
        
        for(const lang of Object.keys(locales)){
            
            const localeButtons = (locales as any)[lang]?.buttons;
            if(!localeButtons)continue;
            
            const key = this.findKeyByValue(localeButtons, text);
            
        }
        
        return null;
        
    }
    
    private findKeyByValue(obj:any,value:string,currentPath:string = ''):string|null{
        
        if(!obj) return null;
        for(const key of Object.keys(obj)){
            
            const newPath = currentPath ? `${currentPath}.${key}` : key;
            if(typeof obj[key] === 'object'){
                
                const found = this.findKeyByValue(obj[key], value,newPath);
                if(found) return found;
                
            }else if(obj[key] === value){
                
                return newPath;
                
            }
            
        }
        
        return null;
        
    }
    
    public getMainMenuButtons(lang:string,isAdmin:boolean):string[]{
        
        const main = this.getSection(lang,'buttons.main');
        const admin = isAdmin ? this.getSection(lang,'buttons.admin') : {};
        
        return [...Object.values(main), ...Object.values(admin)] as string[];
        
    }
    
    public getFileActionsButtons(lang:string,excludeKeys:string[] = []):string[]{
        
        const files = this.getSection(lang,'buttons.files');
        const common = this.getSection(lang,'buttons.common');
        
        const result:string[] = [];
        for(const [key,val] of Object.entries(files)){
            
            if(!excludeKeys.includes(`buttons.files.${key}`)){
                
                result.push(val as string);
                
            }
            
        }
        
        return [...result,...(Object.values(common) as string[])];
        
    }
    
    public getEncryptedMenuButtons(lang:string):string[]{
        
        const unlock = this.t(lang,'buttons.files.btn_unlock');
        const cancel = this.t(lang,'buttons.common.btn_cancel');
        return [unlock,cancel];
        
    }
    
    private getSection(lang:string,sectionPath:string):Record<string,string>{
        
        let obj = this.getValueAsObject(locales[lang],sectionPath);
        if(!obj && lang !== this.defaultLang){
            
            obj = this.getValueAsObject(locales[this.defaultLang],sectionPath);
            
        }
        
        return obj || {};
        
    }
    
    private getValueAsObject(obj:any,path:string):Record<string,string> | null{
        
        if(!obj) return null;
        
        const keys = path.split('.');
        let current = obj;
        for(const k of keys){
            
            if(current[k] === undefined) return null;
            current = current[k];
            
        }
        
        return typeof current === 'object' ? current : null;
        
    }
    
}
