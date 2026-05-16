/**
 * Print copy-paste payloads + env keys for remaining GHL workflows.
 * Usage: node scripts/ghl-workflow-setup-payloads.cjs
 */
const payloads = {
  subscription_renewed: {
    env: 'GHL_WEBHOOK_SUBSCRIPTION_RENEWED_URL',
    workflow: 'Seoinforce - Subscription Renewed',
    body: {
      event: 'subscription_updated',
      source: 'seoinforce',
      email: 'YOUR@EMAIL.com',
      changeType: 'renewed',
      previousPlan: 'growth',
      newPlan: 'growth',
      nextBillingDate: '2026-06-16',
      features: '2,000 API credits, 1,000 keywords, weekly reports',
      dashboardUrl: 'https://seoinforce.com/audit/dashboard',
      link: 'https://seoinforce.com/audit/dashboard',
      renewalDate: '2026-05-16',
      subscriptionStatus: 'active',
      fullName: 'Test User',
      userId: 'test',
      timestamp: new Date().toISOString(),
    },
    tags: ['active_subscriber'],
    removeTags: ['at_risk'],
  },
  rank_gain: {
    env: 'GHL_WEBHOOK_RANK_GAIN_URL',
    workflow: 'Seoinforce - Rank Gain',
    body: {
      event: 'rank_change',
      source: 'seoinforce',
      direction: 'up',
      email: 'YOUR@EMAIL.com',
      domain: 'example.com',
      keyword: 'seo audit tool',
      previousPosition: 18,
      newPosition: 8,
      positionsMoved: 10,
      dashboardUrl: 'https://seoinforce.com/audit/dashboard',
      userId: 'test',
      timestamp: new Date().toISOString(),
    },
    tags: ['has-rank-improvement'],
  },
  competitor: {
    env: 'GHL_WEBHOOK_COMPETITOR_URL',
    workflow: 'Seoinforce - Competitor Alert',
    body: {
      event: 'competitor_movement',
      source: 'seoinforce',
      email: 'YOUR@EMAIL.com',
      domain: 'example.com',
      keyword: 'seo audit tool',
      competitorDomain: 'rival.com',
      positionsMoved: 12,
      newPosition: 3,
      critical: true,
      dashboardUrl: 'https://seoinforce.com/audit/dashboard',
      link: 'https://seoinforce.com/audit/dashboard',
      lastCompetitorAlert: new Date().toISOString().slice(0, 10),
      userId: 'test',
      timestamp: new Date().toISOString(),
    },
    tags: ['competitor_monitoring'],
  },
};

console.log(JSON.stringify(payloads, null, 2));
