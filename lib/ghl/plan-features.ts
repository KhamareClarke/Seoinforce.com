import { getSiteUrl } from '@/lib/site-url';

export function planDisplayName(plan: string): string {
  const p = (plan || 'free').toLowerCase();
  if (p === 'free') return 'Free';
  return p.charAt(0).toUpperCase() + p.slice(1);
}

export function planFeaturesSummary(plan: string): string {
  switch ((plan || 'free').toLowerCase()) {
    case 'starter':
      return '500 API credits, 100 keywords, monthly audits, priority support';
    case 'growth':
      return '2,000 API credits, 1,000 keywords, weekly reports, priority support';
    case 'empire':
      return '10,000 API credits, unlimited keywords, daily reports, 24/7 priority support';
    case 'brand':
      return '1,000 API credits, white-label reports, agency dashboard';
    default:
      return 'limited audits and core SEO tools';
  }
}

export function isPaidPlan(plan: string): boolean {
  return !['free', ''].includes((plan || 'free').toLowerCase());
}

export function dashboardUrl(): string {
  return `${getSiteUrl()}/audit/dashboard`;
}
