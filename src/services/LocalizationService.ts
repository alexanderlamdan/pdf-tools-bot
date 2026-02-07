import fs from 'fs'; 
import path from 'path';

export class LocalizationService{
    
    private readonly locales:Record<string,Record<string,string>> = {};
    private readonly defaultLang = 'en';
    private readonly supportedLangs = ['en','he','ru'];
    
    constructor(){
        
        this.loadLocales();
        
    }
    
    private loadLocales(){
        
        const localesDir = path.join(process.cwd(),'locales');
        
        if(!fs.existsSync(localesDir)){
            
            console.warn(`[LocalizationService] Warning: Locales dir not found at ${localesDir}`);
            return;
        }
        
        for(const lang of this.supportedLangs){
            
            const filePath = path.join(localesDir,`${lang}.json`);
            if(fs.existsSync(filePath)){
                
                try{
                    
                    const content = fs.readFileSync(filePath,'utf-8');
                    this.locales[lang] = JSON.parse(content);
                    console.log(`[LocalizationService] Loaded ${lang}`);
                    
                }catch(e){
                    
                    console.error(`[LocalizationService] Error loading ${lang}`);
                    
                }
                
            }
            
        }
        
    }
    
    public getUserLanguage(code?:string):{lang:string,isFallback:boolean}{
        
        if(!code) return {lang:this.defaultLang,isFallback:false};
        
        const shortCode = code.split('-')[0];
        
        if(this.supportedLangs.includes(shortCode)){
            
            return {lang:shortCode,isFallback:false};
            
        }
        
        return {lang:this.defaultLang,isFallback:true};
        
    }
    
    public t(lang:string,key:string):string{
        
        const dict = this.locales[lang] || this.locales[this.defaultLang];
        return dict?.[key] || `[MISSING: ${key}]`;
        
    }
    
    public getActionKeyByText(text:string):string | null{
        
        for(const lang of Object.keys(this.locales)){
            
            const dict = this.locales[lang];
            
            for(const [key,value] of Object.entries(dict)){
                
                if(value === text){
                    
                    return key;
                    
                }
                
            }
            
        }
        
        return null;
        
    }
    
}
