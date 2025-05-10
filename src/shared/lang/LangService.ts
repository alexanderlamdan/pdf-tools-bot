import {en} from './en.js';
import {heb} from './heb.js';
import {ru} from './ru.js';

const allLangs = {en,ru,heb} as const;
type langCode = keyof typeof allLangs;

export class LanguageCode{

	static get(userLang:string | undefined){

    if(!userLang) return en;
		if(userLang.startsWith('ru')) return ru;
		if(userLang.startsWith('heb') || userLang.startsWith('iw')) return heb;
		return en;

	}

}
