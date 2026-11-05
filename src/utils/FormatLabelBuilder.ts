export function buildFormatLabel(extensions: readonly string[], template: string, templateMore: string, maxShown: number = 3): string{

    const upper = extensions.map(e => e.toUpperCase());

    if(upper.length <= maxShown) return template.replace('{{formats}}', upper.join('/'));

    const shown = upper.slice(0, maxShown).join('/');
    const rest  = upper.length - maxShown;
    return templateMore.replace('{{formats}}', shown).replace('{{more}}', String(rest));

}

export const IMAGES_TIER_EXTENSIONS_FOR_LABEL: Record<string, string[]> = {
    free:     ['jpg', 'png'],
    starter:  ['jpg', 'png'],
    pro:      ['jpg', 'png', 'webp'],
    ultra:    ['jpg', 'png', 'webp', 'heic'],
    business: ['jpg', 'png', 'webp', 'heic', 'gif', 'dng'],
};

export function getImageExtensionsForLabel(plan: string, isVip?: boolean): string[]{

    if(isVip) return IMAGES_TIER_EXTENSIONS_FOR_LABEL['business'];
    return IMAGES_TIER_EXTENSIONS_FOR_LABEL[plan] ?? IMAGES_TIER_EXTENSIONS_FOR_LABEL['free'];

}
