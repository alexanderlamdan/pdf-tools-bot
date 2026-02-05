import {Keyboard} from 'grammy';
import { LocalizationService } from './LocalizationService.js';

export class Keyboards{
    
    constructor(private readonly localization:LocalizationService){}
    
    public build(lang:string,layout:string[][]):Keyboard{
        
        const kb = new Keyboard();
        
        for(const row of layout){
            
            for(const key of row){
                
                const text = key.startsWith('btn_') ? this.localization.t(lang,key) : key;
                
                kb.text(text);
                
            }
            kb.row();
        }
        
        return kb.resized();
        
    }
    
    public getFileActionsMenu(lang:string,excludeKeys:string[] = []):Keyboard{
        
        const fullLayout = [
            
            ['btn_compress','btn_protect'],
            ['btn_split','btn_extract'],
            ['btn_cancel']
            
        ];
        const filteredLayout = fullLayout.map(row=>{
            
            return row.filter(key => !excludeKeys.includes(key));
            
        }).filter(row=>row.length > 0);
        
        return this.build(lang,filteredLayout);
        
        
    }
    
    public getEncryptedFileMenu(lang:string):Keyboard{
        
        return this.build(lang,[
            ['btn_unlock'],
            ['btn_cancel']
        ]);
        
    }
    
    public getMainMenu(lang:string):Keyboard{
        
        return this.build(lang,[
            ['btn_status','btn_help']
        ]);
        
    }
    
}
