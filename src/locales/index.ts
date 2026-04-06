import en from './en.js';

type WidenStrings<T> = {
    [K in keyof T]: T[K] extends object ? WidenStrings<T[K]> : string
};
type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;

export type FullLocale = WidenStrings<typeof en>;

export type Locale = DeepPartial<FullLocale>;
export const locales: Record<string, Locale> = {en};

