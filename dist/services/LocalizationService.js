import { locales } from '../locales/index.js';
export class LocalizationService {
    defaultLang;
    availableLangs = Object.keys(locales);
    constructor(forceLang) {
        this.defaultLang = forceLang || 'en';
    }
    getUserLanguage(code) {
        if (!code)
            return { lang: this.defaultLang, isFallback: false };
        const shortCode = code.split('-')[0];
        if (this.availableLangs.includes(shortCode)) {
            return { lang: shortCode, isFallback: false };
        }
        return { lang: this.defaultLang, isFallback: false };
    }
    get(lang) {
        const baseI18n = locales[this.defaultLang];
        const targetI18n = locales[lang];
        if (!targetI18n || lang === this.defaultLang) {
            return baseI18n;
        }
        return this.deepMerge(baseI18n, targetI18n);
    }
    deepMerge(base, override) {
        const result = { ...base };
        for (const key in override) {
            if (override[key] && typeof override[key] === 'object' && !Array.isArray(override[key])) {
                result[key] = this.deepMerge(result[key], override[key]);
            }
            else if (override[key] !== undefined) {
                result[key] = override[key];
            }
        }
        return result;
    }
    getActionKeyByText(text) {
        for (const lang of Object.keys(locales)) {
            const buttons = locales[lang]?.buttons;
            if (!buttons)
                continue;
            const searchDeep = (obj) => {
                for (const key in obj) {
                    if (typeof obj[key] === 'object' && obj[key] !== null) {
                        const found = searchDeep(obj[key]);
                        if (found)
                            return found;
                    }
                    else if (obj[key] === text) {
                        return key;
                    }
                }
                return null;
            };
            const matchedKey = searchDeep(buttons);
            if (matchedKey)
                return matchedKey;
        }
        return null;
    }
    getMainMenuButtons(lang, isAdmin) {
        const i18n = this.get(lang);
        const main = Object.values(i18n.buttons.main || {});
        const admin = isAdmin ? Object.values(i18n.buttons.admin || {}) : [];
        return [...main, ...admin];
    }
    getFileActionsButtons(lang, excludeKeys = []) {
        const i18n = this.get(lang);
        const files = i18n.buttons.files || {};
        const common = Object.values(i18n.buttons.common || {});
        const alwaysExclude = [
            'btn_merge_one_by_one',
            'btn_merge_archive',
            'btn_merge_bulk',
            'btn_execute_merge',
        ];
        const result = [];
        for (const [key, val] of Object.entries(files)) {
            if (!excludeKeys.includes(key) && !alwaysExclude.includes(key)) {
                result.push(val);
            }
        }
        return [...result, ...common];
    }
    getEncryptedMenuButtons(lang) {
        const i18n = this.get(lang);
        const unlock = i18n.buttons.files.btn_unlock;
        const cancel = i18n.buttons.common.btn_cancel;
        return [unlock, cancel];
    }
    getSubscriptionButtons(lang) {
        const i18n = this.get(lang);
        const sub = i18n.buttons.subscription;
        return [
            sub.buy.replace('{{name}}', 'Pro'),
            sub.buy.replace('{{name}}', 'Premium'),
            sub.buy.replace('{{name}}', 'Enterprise'),
            i18n.buttons.common.btn_cancel
        ];
    }
    getSubscriptionPlanByButton(text) {
        for (const lang of Object.keys(locales)) {
            const i18n = this.get(lang);
            const sub = i18n.buttons.subscription;
            if (text === sub.buy.replace('{{name}}', 'Pro'))
                return 'pro';
            if (text === sub.buy.replace('{{name}}', 'Premium'))
                return 'premium';
            if (text === sub.buy.replace('{{name}}', 'Enterprise'))
                return 'enterprise';
        }
        return null;
    }
}
