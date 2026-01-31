package i18n

var translations = map[string]map[string]string{

	"en": {"pages": "Pages", "author": "Author", "size": "Size", "enc": "Encrypted"},
	"ru": {"pages": "Страниц", "author": "Автор", "size": "Размер", "enc": "Зашифрован"},
	"he": {"pages": "עמודים", "author": "מחבר", "size": "גודל", "enc": "מוצפן"},
}

func T(lang, key string) string {

	if dict, ok := translations[lang]; ok {

		if val, ok := dict[key]; ok {

			return val

		}

	}

	return translations["en"][key]

}
