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
    getMainMenu(isAdmin) {
        return this.buildFromList(this.localization.getMainMenuButtons(isAdmin), 2);
    }
    getFileActionsMenu(excludeKeys = [], isPaid = false) {
        return this.buildFromList(this.localization.getFileActionsButtons(excludeKeys, isPaid), 2);
    }
    getEncryptedMenu() {
        return this.buildFromList(this.localization.getEncryptedMenuButtons(), 2);
    }
    getSubscriptionMenu() {
        return this.buildFromList(this.localization.getSubscriptionButtons(), 1);
    }
}
