import { en } from './en.js';
import { heb } from './heb.js';
import { ru } from './ru.js';
const allLangs = { en, ru, heb };
export class LanguageCode {
    static get(userLang) {
        if (!userLang)
            return en;
        if (userLang.startsWith('ru'))
            return ru;
        if (userLang.startsWith('heb') || userLang.startsWith('iw'))
            return heb;
        return en;
    }
}
