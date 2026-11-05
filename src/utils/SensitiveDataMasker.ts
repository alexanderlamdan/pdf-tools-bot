export function escapeHtml(text:string):string{
    
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
}

const SENSITIVE_PATTERNS:RegExp[] = [
    /\+?\d[\d\s\-()]{6,}\d/g,
    /\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/g,
    /\b(?:\d[ -]?){12,19}\b/g,
];

export function maskSensitiveAndEscape(line:string):string{
    
    const ranges: Array<[number,number]> = [];
    
    for(const pattern of SENSITIVE_PATTERNS){
        
        pattern.lastIndex = 0;
        let m:RegExpExecArray | null;
        
        while((m = pattern.exec(line)) !== null){
            
            if(m[0].length > 0){
                
                ranges.push([m.index,m.index+m[0].length]);
                
            }else{
                
                pattern.lastIndex++;
                
            }
            
        }
        
    }
    
    if(ranges.length === 0){
        
        return escapeHtml(line);
        
    }
    
    ranges.sort((a,b)=>a[0]-b[0]);
    const merged:Array<[number,number]> = [];
    
    for(const r of ranges){
        
        const last = merged[merged.length -1];
        if(last && r[0] <= last[1]){
            
            last[1] = Math.max(last[1],r[1]);
            
        }else{
            
            merged.push([r[0],r[1]]);
            
        }
        
    }
    
    let result = '';
    let cursor = 0;
    
    for(const [start,end] of merged){
        
        result += escapeHtml(line.slice(cursor,start));
        result += `<tg-spoiler>${escapeHtml(line.slice(start, end))}</tg-spoiler>`;
        cursor = end;
        
    }
    
    result += escapeHtml(line.slice(cursor));
    return result;
    
}
