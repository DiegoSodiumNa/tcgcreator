export function appUrl(path = '/') { return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}${path}`; }
export const siteOrigin = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173';
