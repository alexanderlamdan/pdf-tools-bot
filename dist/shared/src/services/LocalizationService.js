import { locales } from '../locales/index.js';
export class LocalizationService {
    lang;
    constructor(forceLang) {
        if (!(forceLang in locales)) {
            throw new Error(`[LocalizationService] Unknown lang: "${forceLang}". Check LocalConfig.ts → forceLang`);
        }
        this.lang = forceLang;
    }
    get() {
        return locales[this.lang];
    }
    getLang() {
        return this.lang;
    }
    getMainMenuButtons(isAdmin) {
        const i18n = this.get();
        const main = Object.values(i18n.buttons.main);
        const admin = isAdmin ? Object.values(i18n.buttons.admin) : [];
        return [...main, ...admin];
    }
    getFileActionsButtons(excludeKeys = [], isPaid = false) {
        const i18n = this.get();
        const files = i18n.buttons.files;
        const alwaysExclude = ['btn_merge_one_by_one', 'btn_merge_archive', 'btn_merge_bulk', 'btn_execute_merge'];
        const planExclude = isPaid ? ['btn_bot_watermark'] : ['btn_watermark'];
        const result = [];
        for (const [key, val] of Object.entries(files)) {
            if (!excludeKeys.includes(key) &&
                !alwaysExclude.includes(key) &&
                !planExclude.includes(key)) {
                result.push(val);
            }
        }
        const common = Object.values(i18n.buttons.common);
        return [...result, ...common];
    }
    getEncryptedMenuButtons() {
        const i18n = this.get();
        return [i18n.buttons.files.btn_unlock, i18n.buttons.common.btn_cancel];
    }
    getSubscriptionButtons() {
        const i18n = this.get();
        const sub = i18n.buttons.subscription;
        return [
            sub.buy.replace('{{name}}', 'Pro'),
            sub.buy.replace('{{name}}', 'Premium'),
            sub.buy.replace('{{name}}', 'Enterprise'),
            i18n.buttons.common.btn_cancel,
        ];
    }
    getActionKeyByText(text) {
        return this.searchDeep(this.get().buttons, text);
    }
    getSubscriptionPlanByButton(text) {
        const sub = this.get().buttons.subscription;
        if (text === sub.buy.replace('{{name}}', 'Pro'))
            return 'pro';
        if (text === sub.buy.replace('{{name}}', 'Premium'))
            return 'premium';
        if (text === sub.buy.replace('{{name}}', 'Enterprise'))
            return 'enterprise';
        return null;
    }
    searchDeep(obj, target) {
        for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                const found = this.searchDeep(obj[key], target);
                if (found)
                    return found;
            }
            else if (obj[key] === target) {
                return key;
            }
        }
        return null;
    }
}
