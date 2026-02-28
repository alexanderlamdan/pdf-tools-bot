import { Keyboard } from 'grammy';
import { LocalizationService } from './LocalizationService.js';
export class Keyboards {
    localization;
    constructor(localization) {
        this.localization = localization;
    }
    buildFromList(buttons, columns = 2) {
        const kb = new Keyboard();
        let i = 0;
        for (const btn of buttons) {
            kb.text(btn);
            i++;
            if (i % columns === 0)
                kb.row();
        }
        return kb.resized();
    }
    getMainMenu(lang, isAdmin) {
        const buttons = this.localization.getMainMenuButtons(lang, isAdmin);
        return this.buildFromList(buttons, 2);
    }
    getFileActionsMenu(lang, excludeKeys = []) {
        const buttons = this.localization.getFileActionsButtons(lang, excludeKeys);
        return this.buildFromList(buttons, 2);
    }
    getEncryptedFileMenu(lang) {
        const buttons = this.localization.getEncryptedMenuButtons(lang);
        return this.buildFromList(buttons, 1);
    }
    getSubscriptionMenu(lang) {
        const i18n = this.localization.get(lang);
        const buttons = this.localization.getSubscriptionButtons(lang);
        const kb = new Keyboard();
        for (const btn of buttons) {
            kb.text(btn).row();
        }
        return kb.resized();
    }
}
