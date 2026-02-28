import {Keyboard} from 'grammy';
import { LocalizationService } from './LocalizationService.js';

export class Keyboards{
    
    constructor(private readonly localization:LocalizationService){}
    
    private buildFromList(buttons:string[],columns:number = 2):Keyboard{
        
        const kb = new Keyboard();
        let i = 0;
        for(const btn of buttons){
            
            kb.text(btn);
            i++;
            if(i % columns === 0) kb.row();
            
        }
        
        return kb.resized();
        
    }
    
    public getMainMenu(lang:string,isAdmin:boolean):Keyboard{
        
        const buttons = this.localization.getMainMenuButtons(lang, isAdmin);
        return this.buildFromList(buttons,2);
        
    }
    
    public getFileActionsMenu(lang:string,excludeKeys:string[] = []):Keyboard{
        
        const buttons = this.localization.getFileActionsButtons(lang,excludeKeys);
        return this.buildFromList(buttons,2);
        
    }
    
    public getEncryptedFileMenu(lang:string):Keyboard{
        
        const buttons = this.localization.getEncryptedMenuButtons(lang);
        return this.buildFromList(buttons,1);
    }
    
    public getSubscriptionMenu(lang:string):Keyboard{
        
        const i18n = this.localization.get(lang);
        const buttons = this.localization.getSubscriptionButtons(lang);
        
        const kb = new Keyboard();
        for(const btn of buttons){
            
            kb.text(btn).row();
            
        }
        
        return kb.resized();
        
    }
    
}
