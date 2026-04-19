import { locales }         from '../locales/index.js';
import type { FullLocale } from '../locales/index.js';

export class LocalizationService {

    private readonly lang: string;

    constructor(forceLang: string) {
        if (!(forceLang in locales)) {
            throw new Error(`[LocalizationService] Unknown lang: "${forceLang}". Check LocalConfig.ts → forceLang`);
        }
        this.lang = forceLang;
    }

    public get(): FullLocale {
        return locales[this.lang] as FullLocale;
    }

    public getLang(): string {
        return this.lang;
    }

    public getMainMenuButtons(isAdmin: boolean): string[] {
        const i18n = this.get();
        const main  = Object.values(i18n.buttons.main);
        const admin = isAdmin ? Object.values(i18n.buttons.admin) : [];
        return [...main, ...admin] as string[];
    }

    public getFileActionsButtons(excludeKeys: string[] = [], isPaid: boolean = false): string[] {
        const i18n = this.get();
        const files = i18n.buttons.files;

        const alwaysExclude = ['btn_merge_one_by_one', 'btn_merge_archive', 'btn_merge_bulk', 'btn_execute_merge'];
        const planExclude   = isPaid ? ['btn_bot_watermark'] : ['btn_watermark'];

        const result: string[] = [];
        for (const [key, val] of Object.entries(files)) {
            if (
                !excludeKeys.includes(key)    &&
                !alwaysExclude.includes(key)  &&
                !planExclude.includes(key)
            ) {
                result.push(val as string);
            }
        }

        const common = Object.values(i18n.buttons.common) as string[];
        return [...result, ...common];
    }

    public getEncryptedMenuButtons(): string[] {
        const i18n = this.get();
        return [i18n.buttons.files.btn_unlock, i18n.buttons.common.btn_cancel];
    }

    public getSubscriptionButtons(): string[] {
        const i18n = this.get();
        const sub  = i18n.buttons.subscription;
        return [
            sub.buy.replace('{{name}}', 'Pro'),
            sub.buy.replace('{{name}}', 'Premium'),
            sub.buy.replace('{{name}}', 'Enterprise'),
            i18n.buttons.common.btn_cancel,
        ];
    }

    public getActionKeyByText(text: string): string | null {
        return this.searchDeep(this.get().buttons, text);
    }

    public getSubscriptionPlanByButton(text: string): 'pro' | 'premium' | 'enterprise' | null {
        const sub = this.get().buttons.subscription;
        if (text === sub.buy.replace('{{name}}', 'Pro'))        return 'pro';
        if (text === sub.buy.replace('{{name}}', 'Premium'))    return 'premium';
        if (text === sub.buy.replace('{{name}}', 'Enterprise')) return 'enterprise';
        return null;
    }

    private searchDeep(obj: any, target: string): string | null {
        for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                const found = this.searchDeep(obj[key], target);
                if (found) return found;
            } else if (obj[key] === target) {
                return key;
            }
        }
        return null;
    }

}
