import { Keyboard } from 'grammy';
import { LocalizationService } from './LocalizationService.js';
export class Keyboards {
    localization;
    constructor(localization) {
        this.localization = localization;
    }
    build(lang, layout) {
        const kb = new Keyboard();
        for (const row of layout) {
            for (const key of row) {
                const text = key.startsWith('btn_') ? this.localization.t(lang, key) : key;
                kb.text(text);
            }
            kb.row();
        }
        return kb.resized();
    }
    getFileActionsMenu(lang, excludeKeys = []) {
        const fullLayout = [
            ['btn_compress', 'btn_protect'],
            ['btn_split', 'btn_extract'],
            ['btn_cancel']
        ];
        const filteredLayout = fullLayout.map(row => {
            return row.filter(key => !excludeKeys.includes(key));
        }).filter(row => row.length > 0);
        return this.build(lang, filteredLayout);
    }
    getEncryptedFileMenu(lang) {
        return this.build(lang, [
            ['btn_unlock'],
            ['btn_cancel']
        ]);
    }
    getMainMenu(lang) {
        return this.build(lang, [
            ['btn_status', 'btn_help']
        ]);
    }
}
