export type Locale = Record<string, any>;
export type FullLocale = Record<string, any>;

const registry: Record<string, Locale> = {};

export function registerLocale(lang: string, locale: Locale): void {
    registry[lang] = locale;
}

export class LocalizationService {

    private readonly lang: string;

    constructor(forceLang: string) {
        if (!(forceLang in registry)) {
            throw new Error(`[LocalizationService] Unknown lang: "${forceLang}". Check LocalConfig.ts → forceLang`);
        }
        this.lang = forceLang;
    }

    public get(): FullLocale {
        return registry[this.lang] as FullLocale;
    }

    public getLang(): string {
        return this.lang;
    }

    public getMainMenuButtons(isAdmin: boolean): string[] {
        const i18n = this.get();
        const main  = Object.values(i18n.messages.user.buttons.main);
        const admin = isAdmin ? Object.values(i18n.messages.admin.buttons) : [];
        return [...main, ...admin] as string[];
    }

    private getAllActionButtons(): Record<string,string> {
        const i18n = this.get();
        const a = i18n.messages.actions;
        return {
            ...a.compress.buttons,
            ...a.split.buttons,
            ...a.merge.buttons,
            btn_protect: a.protect.buttons.btn_protect,
            btn_unlock:  a.unlock.buttons.btn_unlock,
            ...a.long_image.buttons,
            ...a.extract.buttons,
            ...a.rename.buttons,
            ...a.images_to_pdf.buttons,
            ...a.metadata.buttons,
            btn_to_pdf: i18n.messages.convert_menu.btn_to_pdf,
            ...i18n.buttons.files,
        };
    }

    public getFileActionsButtons(excludeKeys: string[] = [], isPaid: boolean = false): string[] {
        const i18n  = this.get();
        const files = this.getAllActionButtons();
        const alwaysExclude = [
            'btn_merge_one_by_one', 'btn_merge_archive', 'btn_merge_bulk', 'btn_execute_merge',
            'btn_long_image_pages', 'btn_long_image_bulk', 'btn_long_image_execute',
            'btn_extract_text', 'btn_extract_images', 'btn_extract_search', 'btn_extract_wordcount',
            'btn_images_execute',
        ];        
        const planExclude   = isPaid ? [] : ['btn_watermark','btn_metadata_wiper'];
        const result: string[] = [];
        for (const [key, val] of Object.entries(files)) {
            if (!excludeKeys.includes(key) && !alwaysExclude.includes(key) && !planExclude.includes(key)) {
                result.push(val as string);
            }
        }

        return result;
    }

    public getEncryptedMenuButtons(): string[] {
        const i18n = this.get();
        return [i18n.messages.actions.unlock.buttons.btn_unlock];
    }

    public getSubscriptionButtons(): string[] {
        const i18n = this.get();
        const sub  = i18n.messages.user.buttons.plan_buttons;
        return [
            sub.starter,
            sub.pro,
            sub.ultra,
            sub.business,
            i18n.messages.user.buttons.common.btn_cancel,
        ];
    }

    public isCancelFamilyButton(text: string): boolean {
        const i18n = this.get();
        const common = i18n.messages.user.buttons.common;
        return text === common.btn_cancel
            || text === common.btn_back
            || text === common.btn_cancel_process;
    }

    public getActionKeyByText(text: string): string | null {
        const i18n = this.get();
        const combined = {
            ...i18n.messages.user.buttons,
            admin: i18n.messages.admin.buttons,
            actions: this.getAllActionButtons(),
        };
        return this.searchDeep(combined, text);
    }

    public getSubscriptionPlanByButton(text: string): 'starter' | 'pro' | 'ultra' | 'business' | null {
        const sub = this.get().messages.user.buttons.plan_buttons;
        if (text === sub.starter)        return 'starter';
        if (text === sub.pro)    return 'pro';
        if (text === sub.ultra) return 'ultra';
        if (text === sub.business) return 'business';
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
