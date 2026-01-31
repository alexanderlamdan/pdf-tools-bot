import { Keyboard } from 'grammy';
import { LocalizationService } from './LocalizationService.js';
export class Keyboards {
    localization;
    constructor(localization) {
        this.localization = localization;
    }
    getMainMenu(lang) {
        return new Keyboard()
            .text(this.localization.t(lang, 'btn_merge'))
            .text(this.localization.t(lang, 'btn_split'))
            .row()
            .text(this.localization.t(lang, 'btn_compress'))
            .text(this.localization.t(lang, 'btn_protect'))
            .row()
            .text(this.localization.t(lang, 'btn_extract'))
            .text(this.localization.t(lang, 'btn_unlock'))
            .row()
            .text(this.localization.t(lang, 'btn_status'))
            .text(this.localization.t(lang, 'btn_help'))
            .resized();
    }
}
