export const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

export const isValidFutureDate = (value) => {
    if (typeof value !== 'string') return false;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    return date.getTime() > Date.now();
};

export const isValidString = (str, maxLength = null) => {
    if (typeof str !== 'string' || !str.trim()) return false;
    if (maxLength && str.trim().length > maxLength) return false;
    return true;
};

export const isValidOptionalString = (str) => {
    if (str === undefined || str === null) return true;
    return typeof str === 'string';
};

export const isValidHttpUrl = (value) => {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};