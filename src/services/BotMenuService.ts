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
                         "• Merge multiple files\n" +
                         "• Split PDF by pages\n" +
                         "• Advanced Compression\n" +
                         "• Password Protection\n" +
                         "• Extract pictures or text from file\n" +
                         "• Add Watermark\n" +
                         "• Repair/Quick fix your broken PDF file\n" +
                         "• Metadata wiper - clean PDF from every metadata\n" +
                         "• PDF To Long image\n" +
                         "• Convert from docx, excel and pictures to PDF\n\n" +
                         "🛡 Why choose us:\n" +
                         "• Isolated processing: Each file stays in its own secure container\n" +
                         "• Auto-wipe: All files are permanently deleted every 12 hours\n" +
                         "• RAM-only storage: Data is wiped upon server reboot\n" +
                         "• Privacy first: No hidden data collection; logs only for security and bug fixes\n" +
                         "• GDPR Compliant: Your privacy is guaranteed by EU regulations\n" +
                         "• No limits: Upload files up to 2GB (Telegram limit)\n" +
                         "• Fair usage: Use freely as long as traffic allows\n\n" +
                         "⚡️ Fast, secure, and reliable. Send me a file to start!\n\n" +
                         "Powered by Linux, TypeScript and Go",
            shortDescription: "Professional PDF tools: Merge, Split, Compress, Protect, add watermark, convert, and repair, and much more tools. Upload up to 2GB files without any problem."
            
        },
        
        ru:{
            
            commands:[
                
                {command:'start',description:'Запуск бота'},
                {command:'help',description:'Показать помощь'},
                {command:'about',description:'О боте'}
                
            ],
            description: "🚀 PDF Tools Bot — профессиональная работа с PDF.\n\n" +
            "✅ Возможности:\n" +
            "• Склеить несколько PDF в один\n" +
            "• Разделить на отдельные страницы\n" +
            "• Быстрое сжатие\n" +
            "• Установка и снятие паролей\n" +
            "• Извлечь картинки или текст\n" +
            "• Добавить водяной знак или печать\n" +
            "• Исправить/починить битый pdf файл\n" +
            "• Очистка от метаданных\n" +
            "• PDF в длинную картинку\n" +
            "• Конвертация из Word, Excel и фото в PDF\n\n" +
            "🛡 Преимущества и безопасность:\n" +
            "• Изоляция: Файлы обрабатываются в защищенных, отдельных папках\n" +
            "• Автоочистка: Полное удаление файлов каждые 12 часов\n" +
            "• RAM-хранилище: Данные хранятся до перезагрузки сервера\n" +
            "• Честность: Никакого скрытого сбора данных (логи только для фикса ошибок)\n" +
            "• GDPR: Ваша приватность защищена юрисдикцией Евросоюза\n" +
            "• Без лимитов: Загрузка до 2ГБ (максимум Telegram)\n" +
            "• Свобода: Пользуйтесь без ограничений, пока есть трафик\n\n" +
            "⚡️ Быстро, безопасно и надежно. Просто отправь мне файл!",
            shortDescription: "Профессиональные PDF инструменты: Склейка, Разделение, Сжатие, Защита и Конвертация, и многие другие инструменты. Лимит загрузки до 2ГБ."
        },
        
        he:{
            
            commands:[
                
                {command:'start',description:'להפעיל את הבוט'},
                {command:'help',description:'עזרה עם הבוט'},
                {command:'about',description:'על הבוט'}
                
            ],
            description: "🚀 PDF Tools Bot — ניהול קבצי PDF מקצועי.\n\n" +
                         "✅ מה אני יודע לעשות:\n" +
                         "• מיזוג מספר קבצים לאחד\n" +
                         "• פיצול PDF לפי עמודים\n" +
                         "• דחיסה מהירה\n" +
                         "• הוספה או הסרה של סיסמאות\n" +
                         "• להוציא תמונות או טקסט מקובץ\n" +
                         "• להוסיף חתימה/סימן מים\n" +
                         "• לתקן קובץ פגום\n" +
                         "• ניקוי מטא-דאטה\n" +
                         "• מקובץ PDF לתמונה ארוכה\n" +
                         "• המרה מ-docx, excel ותמונות ל-PDF\n\n" +
                         "🛡 אבטחה ויתרונות:\n" +
                         "• בידוד: עיבוד קבצים בתיקיות נפרדות ומאובטחות\n" +
                         "• מחיקה אוטומטית: כל הקבצים נמחקים לצמיתות כל 12 שעות\n" +
                         "• אחסון מוגן: המידע נשמר בזיכרון זמני עד לאתחול השרת\n" +
                         "• פרטיות: ללא איסוף נתונים נסתר (לוגים לתחזוקה בלבד)\n" +
                         "• תאימות GDPR: הפרטיות שלך מובטחת תחת הרגולציה האירופית\n" +
                         "• ללא הגבלה: העלאת קבצים עד 2GB (מגבלת טלגרם)\n" +
                         "• שימוש חופשי: תהנו מהשירות כל עוד יש תעבורה פנויה\n\n" +
                         "⚡️ מהיר, מאובטח ואמין. פשוט שלחו קובץ כדי להתחיל!\n\n" +
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
