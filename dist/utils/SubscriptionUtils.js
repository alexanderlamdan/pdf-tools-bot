export const GIGABYTE = 1024 * 1024 * 1024;
export const SUBSCRIPTION_LIMITS = {
    free: 2 * GIGABYTE,
    pro: 12 * GIGABYTE,
    premium: 24 * GIGABYTE,
    enterprise: 48 * GIGABYTE,
    sovereign_protocol: 90 * GIGABYTE
};
export function getPaymentLink(langCode, plan) {
    const domain = langCode === 'ru' ? 'ru.lmdnbot.com' : langCode === 'he' ? 'he.lmdnbot.com' : 'lmdnbot.com';
    return `https://${domain}`;
}
export function getVipExpirationTimestamp() {
    const now = new Date();
    return new Date(now.getFullYear(), 11, 31, 23, 59, 59).getTime();
}
export function getUserLimit(user) {
    if (user.isVip === 1)
        return Infinity;
    const plan = user.subType || 'free';
    return SUBSCRIPTION_LIMITS[plan] || SUBSCRIPTION_LIMITS['free'];
}
