/**
 * Test GHL Workflow 4 — subscription (upgraded | downgraded | renewed)
 * Usage: node scripts/test-ghl-subscription-webhook.cjs [upgraded|downgraded|renewed] [email]
 */
const path = require('path');
const fs = require('fs');

function loadEnvLocal() {
  const p = path.join(__dirname, '..', '.env.local');
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
}

loadEnvLocal();

const changeType = (process.argv[2] || 'upgraded').toLowerCase();
const email = process.argv[3] || process.env.EMAIL_USER || 'test@example.com';

const urlMap = {
  upgraded: process.env.GHL_WEBHOOK_SUBSCRIPTION_UPGRADED_URL,
  downgraded: process.env.GHL_WEBHOOK_SUBSCRIPTION_DOWNGRADED_URL,
  renewed: process.env.GHL_WEBHOOK_SUBSCRIPTION_RENEWED_URL,
  canceled: process.env.GHL_WEBHOOK_SUBSCRIPTION_CANCELED_URL,
};

const url =
  urlMap[changeType]?.trim() ||
  process.env.GHL_WEBHOOK_SUBSCRIPTION_URL?.trim();

if (!url) {
  console.error(`Set GHL_WEBHOOK_SUBSCRIPTION_${changeType.toUpperCase()}_URL or GHL_WEBHOOK_SUBSCRIPTION_URL`);
  process.exit(1);
}

const plans = {
  upgraded: { previousPlan: 'free', newPlan: 'growth' },
  downgraded: { previousPlan: 'growth', newPlan: 'free' },
  renewed: { previousPlan: 'growth', newPlan: 'growth' },
  canceled: { previousPlan: 'growth', newPlan: 'free' },
};

const today = new Date().toISOString().slice(0, 10);
const body = {
  event: 'subscription_updated',
  source: 'seoinforce',
  userId: 'test-sub',
  email,
  fullName: 'Test User',
  changeType,
  ...plans[changeType] || plans.upgraded,
  features: '2,000 API credits, 1,000 keywords, weekly reports, priority support',
  nextBillingDate: '2026-06-16',
  dashboardUrl: 'https://seoinforce.com/audit/dashboard',
  link: 'https://seoinforce.com/audit/dashboard',
  subscriptionStatus: changeType === 'downgraded' || changeType === 'canceled' ? 'churned' : 'active',
  upgradeDate: changeType === 'upgraded' ? today : undefined,
  churnDate: changeType === 'downgraded' || changeType === 'canceled' ? today : undefined,
  renewalDate: changeType === 'renewed' ? today : undefined,
  timestamp: new Date().toISOString(),
};

fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  .then(async (r) => {
    console.log('changeType:', changeType);
    console.log('Status:', r.status, await r.text());
    if (!r.ok) process.exit(1);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
