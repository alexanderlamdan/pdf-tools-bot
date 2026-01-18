import {Bot} from 'grammy'; 
export class BotMenuService{
    
    private readonly config = {
        
        en:{
            
            commands:[
                
                {command:'start',description:'Start Bot'},
                {command:'help',description:'Show help'},
                {command:'merge',description:'Merge PDF Files'},
                {command:'split',description:'Split PDF'},
                {command:'compress',description:'Compress PDF file'},
                {command:'protect',description:'Set password for PDF file'},
                {command:'unlock',description:'Remove or unlock the password from PDF file'},
                {command:'extract',description:'Extract images or text from PDF file'},
                {command:'status',description:'Show your current usage status'},
                {command:'upgrade',description:'Upgrade to Medium, pro or premium plan'}
                
            ],
            description:"🤖 <b>PDF Actions Bot</b>\n\nI can help you manage PDF files:\n• Merge & Split\n• Compress\nProtect & Unlock\nExtract\nStatus\nUpgrade",
            shortDescription:"Best PDF Tool. Merge, Split, Compress, Protect, Unlock, Extract and much more"
            
        },
        
        ru:{
            
            commands:[
                
                {command:'start',description:'Запуск бота'},
                {command:'help',description:'Показать помощь'},
                {command:'merge',description:'Склеить или объединить PDF файлы'},
                {command:'split',description:'Разрезать pdf файл'},
                {command:'compress',description:'Сжать pdf файл'},
                {command:'protect',description:'Установить пароль для pdf файла'},
                {command:'unlock',description:'Удалить или сбросить пароль для pdf файла'},
                {command:'extract',description:'Извлечь текст или фото с pdf файла'},
                {command:'status',description:'Посмотреть статус пользования ботом'},
                {command:'upgrade',description:'Обновиться до Средней, про или премиум подписки'}
                
            ],
            description:"<b><PDF Actions Bot/b>\n\nЯ умею работать с пдф файлами и облегчить тебе головную боль:\n Склеить и разрезать\nСжать\nУстановить пароль или сбросить пароль\nИзвлечь картинки или текст\nУзнать статус пользования ботом\nОбновиться до средней, про или премиум подписки",
            shortDescription:"Лучший инструмент для работы с пдф файлами. Склеить, Разрезать, Сжать, Защитить, Разблокировать и многое другое"
        },
        
        heb:{
            
            commands:[
                
                {command:'start',description:'להפעיל את הבוט'},
                {command:'help',description:'עזרה עם הבוט'},
                {command:'merge',description:'לחבר קבצי pdf'},
                {command:'split',description:'לחתוך קובץ pdf'},
                {command:'compress',description:'למחוץ קובץ pdf'},
                {command:'protect',description:'להתקין סיסמא על הקובץ pdf'},
                {command:'unlock',description:'למחוק סיסמא מקובץ pdf'},
                {command:'extract',description:'להוציא טקסט או תמונות מקובץ pdf'},
                {command:'status',description:'לראות שימוש נוכחית'},
                {command:'upgrade',description:'לעדכן למנוי בינוני, פרו או פרמיום'}
                
            ],
            description:"<b>PDF Actions Bot</b>. אני יודע לעבוד עם קבצי pdf ולהקל לך את הכאבי ראש יום יום:\n\n לחבר ולחתוך\nלדחוס\nלהתקין סיסמא או להסיר סיסמא\nלהוציא תמונות או טקסט\nלראות שימוש נוכחי\nלהיתעדכן לחבילה בינונית, פרו או פרמיום",
            shortDescription:"הבוט הכי טוב לעבודה עם קבצי pdf. תשכח מכל הכאבי ראש של אתרי אינטרנט.פשוט תעלה את הקובץ ותבחר מה אתה רוצה לעשות"
        }
        
    }
    
    constructor(private readonly bot:Bot){}
    
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
