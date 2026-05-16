/** Canonical public site origin (no trailing slash). */
export function getSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_APP_URL || 'https://seoinforce.com').trim();
  return /^https?:\/\//i.test(raw) ? raw.replace(/\/$/, '') : 'https://seoinforce.com';
}
