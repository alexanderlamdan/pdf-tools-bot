import path from 'path';

export class FileNameUtils{
    
    public static escapeHtml(unsafe:string):string{
    if(!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    
}
    
    public static getSafeName(originalName:string, suffix:string):string{
        
        const ext = path.extname(originalName);
        let baseName = path.basename(originalName,ext);
        
        const words = baseName
            .split(/[^a-zA-Z0-9а-яА-ЯёЁ\u0590-\u05FF0-9]+/g)
            .filter(w => w.length > 0);
        
        let newName = "";
        if(words.length === 0){
            
            newName = 'Document';
            
        }else if(words.length > 10){
            
            newName = words.map(w=>this.capitalize(w)).join('');
            
        }else{
            
            newName = words.join('-');
            
        }
        
        return `${newName}_${suffix.toUpperCase()}${ext}`;
        
    }
    
    private static capitalize(word:string):string{
        
        return word.charAt(0).toUpperCase() + word.slice(1);
        
    }
    
}
