import { Bot } from 'grammy';
export class BotMenuService {
    bot;
    config = {
        en: {
            commands: [
                { command: 'start', description: 'Start Bot' },
                { command: 'help', description: 'Show help' },
                { command: 'about', description: 'About bot' }
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
                "• Metadata wiper - clean PDF from from every metadata\n" +
                "• PDF To Long image\n" +
                "• Convert from docx, excel and pictures to PDF\n" +
                "⚡️ Fast, secure, and reliable.Send me a file to start!\n\n" +
                "Powered by Linux, TypeScript and Go",
            shortDescription: "Professional PDF tools: Merge, Split, Compress and more."
        },
        ru: {
            commands: [
                { command: 'start', description: 'Запуск бота' },
                { command: 'help', description: 'Показать помощь' },
                { command: 'about', description: 'О боте' }
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
                "• Очистка от метаданных - очистка PDF от всех метаданных файла\n" +
                "• PDF в длинную картинку\n" +
                "• Конвертация из ворд, экселя и фото в PDF\n\n" +
                "⚡️ Быстро, безопасно и надежно. Просто отправь мне файл!\n\n",
            shortDescription: "Профессиональные PDF инструменты: Склейка, Разделение, Сжатие и многое другое."
        },
        he: {
            commands: [
                { command: 'start', description: 'להפעיל את הבוט' },
                { command: 'help', description: 'עזרה עם הבוט' },
                { command: 'about', description: 'על הבוט' }
            ],
            description: "🚀 PDF Tools Bot — ניהול קבצי PDF מקצועי.\n\n" +
                "✅ מה אני יודע לעשות:\n" +
                "• מיזוג מספר קבצים לאחד\n" +
                "• פיצול PDF לפי עמודים\n" +
                "• דחיסה מהירה\n" +
                "• הוספה או הסרה של סיסמאות\n" +
                "• להוציא תמונות או טקסט מקובץ\n" +
                "• להוסיף חתימה לקובץ נגד העתקה או גניבה\n" +
                "• לתקן קובץ שלא תקין\n" +
                "• מקובץ PDF לתמונה ארוכה\n" +
                "• להמיר מקבצי docx, excel ותמונות לקובץ pdf\n" +
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
