import { Bot } from 'grammy';
export class BotMenuService {
    bot;
    config = {
        en: {
            commands: [
                { command: 'start', description: 'Start Bot' },
                { command: 'help', description: 'Show help' },
                { command: 'merge', description: 'Merge PDF Files' },
                { command: 'split', description: 'Split PDF' },
                { command: 'compress', description: 'Compress PDF file' },
                { command: 'protect', description: 'Set password for PDF file' },
                { command: 'unlock', description: 'Remove or unlock the password from PDF file' },
                { command: 'extract', description: 'Extract images or text from PDF file' },
                { command: 'status', description: 'Show your current usage status' },
                { command: 'upgrade', description: 'Upgrade to pro or for bussiness plan' }
            ],
            description: "🚀 PDF Tools Bot — Professional PDF management.\n\n" +
                "✅ Features:\n" +
                "• Merge multiple files\n" +
                "• Split PDF by pages\n" +
                "• Advanced Compression\n" +
                "• Password Protection\n\n" +
                "⚡️ Fast, secure, and reliable.Send me a file to start!\n\n" +
                "Powered by Linux & Go",
            shortDescription: "Professional PDF tools: Merge, Split, Compress and more."
        },
        ru: {
            commands: [
                { command: 'start', description: 'Запуск бота' },
                { command: 'help', description: 'Показать помощь' },
                { command: 'merge', description: 'Склеить или объединить PDF файлы' },
                { command: 'split', description: 'Разрезать pdf файл' },
                { command: 'compress', description: 'Сжать pdf файл' },
                { command: 'protect', description: 'Установить пароль для pdf файла' },
                { command: 'unlock', description: 'Удалить или сбросить пароль для pdf файла' },
                { command: 'extract', description: 'Извлечь текст или фото с pdf файла' },
                { command: 'status', description: 'Посмотреть статус пользования ботом' },
                { command: 'upgrade', description: 'Обновиться до про или для бизнеса подписки' }
            ],
            description: "🚀 PDF Tools Bot — профессиональная работа с PDF.\n\n" +
                "✅ Возможности:\n" +
                "• Склеить несколько PDF в один\n" +
                "• Разделить на отдельные страницы\n" +
                "• Быстрое сжатие\n" +
                "• Установка и снятие паролей\n\n" +
                "⚡️ Быстро, безопасно и надежно. Просто отправь мне файл!\n\n",
            shortDescription: "Профессиональные PDF инструменты: Склейка, Разделение, Сжатие и многое другое."
        },
        heb: {
            commands: [
                { command: 'start', description: 'להפעיל את הבוט' },
                { command: 'help', description: 'עזרה עם הבוט' },
                { command: 'merge', description: 'לחבר קבצי pdf' },
                { command: 'split', description: 'לחתוך קובץ pdf' },
                { command: 'compress', description: 'למחוץ קובץ pdf' },
                { command: 'protect', description: 'להתקין סיסמא על הקובץ pdf' },
                { command: 'unlock', description: 'למחוק סיסמא מקובץ pdf' },
                { command: 'extract', description: 'להוציא טקסט או תמונות מקובץ pdf' },
                { command: 'status', description: 'לראות שימוש נוכחי' },
                { command: 'upgrade', description: 'לעדכן למנוי פרו ,פרמיום או לעסקים' }
            ],
            description: "🚀 PDF Tools Bot — ניהול קבצי PDF מקצועי.\n\n" +
                "✅ מה אני יודע לעשות:\n" +
                "• מיזוג מספר קבצים לאחד\n" +
                "• פיצול PDF לפי עמודים\n" +
                "• דחיסה מהירה\n" +
                "• הוספה או הסרה של סיסמאות\n\n" +
                "⚡️ מהיר, מאובטח ואמין. פשוט שלחו קובץ כדי להתחיל!\n\n" +
                "🇮🇱 פותח בישראל",
            shortDescription: "כלי PDF מקצועיים: מיזוג, פיצול, דחיסה ועוד."
        }
    };
    constructor(bot) {
        this.bot = bot;
    }
    async syncMenu() {
        console.log('Started to configure menu and languages in Telegram...');
        for (const [lang, settings] of Object.entries(this.config)) {
            const langCode = (lang === 'en' ? undefined : lang);
            try {
                await this.bot.api.setMyCommands(settings.commands, { language_code: langCode });
                await this.bot.api.setMyDescription(settings.description, { language_code: langCode });
                await this.bot.api.setMyShortDescription(settings.shortDescription, { language_code: langCode });
                console.log(`Language set: ${lang.toUpperCase()}`);
            }
            catch (e) {
                console.error(`Error in language ${lang}:`, e);
            }
        }
        console.log('Settings menu language is done.');
    }
}
