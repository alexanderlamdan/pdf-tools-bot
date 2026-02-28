export const GIGABYTE = 1024 * 1024 * 1024;
export const SUBSCRIPTION_LIMITS = {
    free: 2 * GIGABYTE,
    pro: 12 * GIGABYTE,
    premium: 24 * GIGABYTE,
    enterprise: 48 * GIGABYTE,
    sovereign_protocol: 90 * GIGABYTE
};
const WARNING_THRESHOLD = 0.80;
const WARNING_THRESHOLD2 = 0.85;
export function getTrafficState(user) {
    if (user.isVip === 1) {
        return {
            status: 'normal',
            usedBytes: user.totalTrafficBytes,
            limitBytes: Infinity,
            remainBytes: Infinity,
            usedPercent: 0,
            remainMB: '∞'
        };
    }
    const plan = user.subType || 'free';
    const limitBytes = SUBSCRIPTION_LIMITS[plan] ?? SUBSCRIPTION_LIMITS['free'];
    const usedBytes = Number(user.totalTrafficBytes || 0);
    const remainBytes = Math.max(0, limitBytes - usedBytes);
    const usedPercent = usedBytes / limitBytes;
    const remainMB = remainBytes < GIGABYTE ? `${(remainBytes / 1024 / 1024).toFixed(0)}MB` : `${(remainBytes / GIGABYTE).toFixed(2)} GB`;
    let status;
    if (usedPercent >= 1.0) {
        status = 'blocked';
    }
    else if (usedPercent >= WARNING_THRESHOLD2) {
        status = 'warning_strong';
    }
    else if (usedPercent >= WARNING_THRESHOLD) {
        status = 'warning';
    }
    else {
        status = 'normal';
    }
    return { status, usedBytes, limitBytes, remainBytes, usedPercent, remainMB };
}
export function getTrafficStateAfterFile(user, fileSizeBytes) {
    const fake = {
        ...user,
        totalTrafficBytes: Number(user.totalTrafficBytes || 0) + fileSizeBytes
    };
    return getTrafficState(fake);
}
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
