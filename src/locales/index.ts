import en from './en.js';
import ru from './ru.js';
import he from './he.js';

type WidenStrings<T> = {
    [K in keyof T]: T[K] extends object ? WidenStrings<T[K]> : string
};
type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;
export type Locale = DeepPartial<WidenStrings<typeof en>>;
const locales: Record<string, Locale> = {
    en: en as unknown as Locale,
    ru: ru as unknown as Locale,
    he: he as unknown as Locale
};
export default locales;
