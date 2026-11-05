interface LangTimeConfig{
    timezone:string;
    locale:string;
}

const LANG_TIME_MAP:Record<string,LangTimeConfig> = {
    
    en:{timezone:'UTC',locale:'en-US'},
    ru:{timezone:'Asia/Yekaterinburg',locale:'ru-RU'},
    he:{timezone:'Asia/Jerusalem',locale:'he-IL'}
    
};

const DEFAULT_TIME_CONFIG:LangTimeConfig = LANG_TIME_MAP.en;

function resolve(lang:string):LangTimeConfig{
    
    return LANG_TIME_MAP[lang] ?? DEFAULT_TIME_CONFIG;
    
}

export function formatDate(timestampMs:number,lang:string):string{
    
    if(!timestampMs) return '-';
    
    const cfg = resolve(lang);
    
    return new Date(timestampMs).toLocaleDateString(cfg.locale,{
        
        timeZone:cfg.timezone,
        year:'numeric',
        month:'long',
        day:'numeric'
        
    });
    
}

export function formatDateTime(timestampMs:number,lang:string):string{
    
    if(!timestampMs) return '-';
    
    const cfg = resolve(lang);
    
    return new Date(timestampMs).toLocaleString(cfg.locale,{
        
        timeZone:cfg.timezone,
        year:'numeric',
        month:'long',
        day:'numeric',
        hour:'2-digit',
        minute:'2-digit'
        
    });
    
}

export function formatTime(timestampMs:number,lang:string):string{
    
    if(!timestampMs) return '-';
    
    const cfg = resolve(lang);
    
    return new Date(timestampMs).toLocaleTimeString(cfg.locale,{
        
        timeZone:cfg.timezone,
        hour:'2-digit',
        minute:'2-digit'
        
    });
    
}

export function getTimezone(lang:string):string{
    
    return resolve(lang).timezone;
    
}
