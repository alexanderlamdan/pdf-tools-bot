import fs from 'fs';
import path from 'path';
export class LocalizationService {
    locales = {};
    defaultLang = 'en';
    supportedLangs = ['en', 'heb', 'ru'];
    constructor() {
        this.loadLocales();
    }
    loadLocales() {
        const localesDir = path.join(process.cwd(), 'locales');
        if (!fs.existsSync(localesDir)) {
            console.warn(`[LocalizationService] Warning: Locales dir not found at ${localesDir}`);
            return;
        }
        for (const lang of this.supportedLangs) {
            const filePath = path.join(localesDir, `${lang}.json`);
            if (fs.existsSync(filePath)) {
                try {
                    const content = fs.readFileSync(filePath, 'utf-8');
                    this.locales[lang] = JSON.parse(content);
                    console.log(`[LocalizationService] Loaded ${lang}`);
                }
                catch (e) {
                    console.error(`[LocalizationService] Error loading ${lang}`);
                }
            }
        }
    }
    getUserLanguage(code) {
        if (!code)
            return { lang: this.defaultLang, isFallback: false };
        const shortCode = code.split('-')[0];
        if (this.supportedLangs.includes(shortCode)) {
            return { lang: shortCode, isFallback: false };
        }
        return { lang: this.defaultLang, isFallback: true };
    }
    t(lang, key) {
        const dict = this.locales[lang] || this.locales[this.defaultLang];
        return dict?.[key] || `[MISSING: ${key}]`;
    }
}
