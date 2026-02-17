import fs from 'fs';
import path from 'path';
export class LocalizationService {
    locales = {};
    defaultLang = 'en';
    availableLangs = [];
    constructor() {
        this.loadLocales();
    }
    loadLocales() {
        const localesDir = path.join(process.cwd(), 'locales');
        if (!fs.existsSync(localesDir)) {
            console.warn(`[LocalizationService] Warning: Locales dir not found at ${localesDir}`);
            return;
        }
        const files = fs.readdirSync(localesDir);
        for (const file of files) {
            if (file.endsWith('.json')) {
                const lang = file.replace('.json', '');
                try {
                    const content = fs.readFileSync(path.join(localesDir, file), 'utf-8');
                    this.locales[lang] = JSON.parse(content);
                    this.availableLangs.push(lang);
                    console.log(`[Localization] Loaded ${lang}`);
                }
                catch (e) {
                    console.error(`[LocalizationService] Error loading ${lang}`, e);
                }
            }
        }
    }
    getUserLanguage(code) {
        if (!code)
            return { lang: this.defaultLang, isFallback: false };
        const shortCode = code.split('-')[0];
        if (this.availableLangs.includes(shortCode)) {
            return { lang: shortCode, isFallback: false };
        }
        return { lang: this.defaultLang, isFallback: true };
    }
    t(lang, key) {
        let val = this.getValue(this.locales[lang], key);
        if (!val && lang !== this.defaultLang) {
            val = this.getValue(this.locales[this.defaultLang], key);
        }
        return val || `[MISSING: ${key}]`;
    }
    getValue(obj, path) {
        if (!obj)
            return null;
        const keys = path.split('.');
        let current = obj;
        for (const k of keys) {
            if (current[k] === undefined)
                return null;
            current = current[k];
        }
        return typeof current === 'string' ? current : null;
    }
    getActionKeyByText(text) {
        for (const lang of this.availableLangs) {
            const foundKey = this.findKeyByValue(this.locales[lang]?.buttons, text);
            if (foundKey)
                return `buttons.${foundKey}`;
        }
        return null;
    }
    findKeyByValue(obj, value, currentPath = '') {
        if (!obj)
            return null;
        for (const key of Object.keys(obj)) {
            const newPath = currentPath ? `${currentPath}.${key}` : key;
            if (typeof obj[key] === 'object') {
                const found = this.findKeyByValue(obj[key], value, newPath);
                if (found)
                    return found;
            }
            else if (obj[key] === value) {
                return newPath;
            }
        }
        return null;
    }
    getMainMenuButtons(lang, isAdmin) {
        const main = this.getSection(lang, 'buttons.main');
        const admin = isAdmin ? this.getSection(lang, 'buttons.admin') : {};
        return [...Object.values(main), ...Object.values(admin)];
    }
    getFileActionsButtons(lang, excludeKeys = []) {
        const files = this.getSection(lang, 'buttons.files');
        const common = this.getSection(lang, 'buttons.common');
        const result = [];
        for (const [key, val] of Object.entries(files)) {
            if (!excludeKeys.includes(`buttons.files.${key}`)) {
                result.push(val);
            }
        }
        return [...result, ...Object.values(common)];
    }
    getEncryptedMenuButtons(lang) {
        const unlock = this.t(lang, 'buttons.files.btn_unlock');
        const cancel = this.t(lang, 'buttons.common.btn_cancel');
        return [unlock, cancel];
    }
    getSection(lang, sectionPath) {
        let obj = this.getValueAsObject(this.locales[lang], sectionPath);
        if (!obj && lang !== this.defaultLang) {
            obj = this.getValueAsObject(this.locales[this.defaultLang], sectionPath);
        }
        return obj || {};
    }
    getValueAsObject(obj, path) {
        if (!obj)
            return null;
        const keys = path.split('.');
        let current = obj;
        for (const k of keys) {
            if (current[k] === undefined)
                return null;
            current = current[k];
        }
        return typeof current === 'object' ? current : null;
    }
}
