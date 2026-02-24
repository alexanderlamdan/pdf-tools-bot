import {Bot} from 'grammy'; 
import type { BotContext } from '../types/BotContext.js';
export class BotMenuService{
    
    private readonly config = {
        
        en:{
            
            commands:[
                
                {command:'start',description:'Start Bot'},
                {command:'help',description:'Show help'},
                {command:'about',description:'About bot'}
                
            ],
            description: "🚀 PDF Tools Bot — Your professional PDF assistant.\n\n" +
                         "✅ Features:\n" +
                         "• Merge, Split & Compress\n" +
                         "• Extract text/images & Convert\n" +
                         "• Protect & Unlock\n" +
                         "• Repair broken PDFs\n" +
                         "• Watermarks & Metadata Wiper\n" +
                         "• PDF to Long Image\n\n" +
                         "🛡 Secure & Private: GDPR compliant, RAM-only storage, auto-wipe every 12h, and isolated processing.\n\n" +
                         "⚡️ Upload up to 2GB. Send a file to start!",
            shortDescription: "Professional PDF tools: Merge, Split, Compress, Protect, Convert & Repair. Upload files up to 2GB effortlessly."
            
        },
        
        ru:{
            
            commands:[
                
                {command:'start',description:'Запуск бота'},
                {command:'help',description:'Показать помощь'},
                {command:'about',description:'О боте'}
                
            ],
            description: "🚀 PDF Tools Bot — профессиональная работа с PDF.\n\n" +
            "✅ Возможности:\n" +
            "• Склейка и разделение\n" +
            "• Быстрое сжатие и конвертация\n" +
            "• Защита и снятие паролей\n" +
            "• Извлечение текста и фото\n" +
            "• Водяные знаки и очистка метаданных\n" +
            "• Починка битых файлов\n\n" +
            "🛡 Безопасно: GDPR, RAM-хранилище, автоочистка каждые 12ч и изоляция файлов.\n\n" +
            "⚡️ Загрузка до 2ГБ. Просто отправь мне PDF файл!",
            shortDescription: "Профессиональные PDF инструменты: Склейка, Разделение, Сжатие, Защита и Конвертация. Лимит загрузки до 2ГБ."
        },
        
        he:{
            
            commands:[
                
                {command:'start',description:'להפעיל את הבוט'},
                {command:'help',description:'עזרה עם הבוט'},
                {command:'about',description:'על הבוט'}
                
            ],
            description: "🚀 PDF Tools Bot — ניהול קבצי PDF מקצועי.\n\n" +
                         "✅ אפשרויות:\n" +
                         "• מיזוג ופיצול קבצים\n" +
                         "• דחיסה והמרה\n" +
                         "• הגנה והסרת סיסמאות\n" +
                         "• חילוץ טקסט ותמונות\n" +
                         "• סימני מים וניקוי מטא-דאטה\n" +
                         "• תיקון קבצים פגומים\n\n" +
                         "🛡 מאובטח: תאימות GDPR, אחסון RAM, מחיקה אוטומטית כל 12 שעות, ובידוד קבצים.\n\n" +
                         "⚡️ העלאת קבצים עד 2GB. פשוט שלחו קובץ כדי להתחיל!\n" +
                         "🇮🇱 פותח בישראל",
            shortDescription: "כלי PDF מקצועיים: מיזוג, פיצול, דחיסה, הגנה והמרה. העלאת קבצים עד 2GB ללא בעיה."
        }
        
    }
    
    constructor(private readonly bot:Bot<BotContext>){}
    
    public async syncMenu(){
        
        console.log('Started to configure menu and languages in Telegram...');
        
        for(const [lang,settings] of Object.entries(this.config)){
            
            const langCode = (lang === 'en' ? undefined : lang) as any;
            
            try{
                
                await this.bot.api.setMyCommands(settings.commands,{language_code:langCode});
                await this.bot.api.setMyDescription(settings.description,{language_code:langCode});
                await this.bot.api.setMyShortDescription(settings.shortDescription,{language_code:langCode});
                
                console.log(`Language set: ${lang.toUpperCase()}`);
                
            }catch(e){
                
                console.error(`Error in language ${lang}:`,e);
                
            }
            
        }
        
        console.log('Settings menu language is done.');
        
    }
    
}
