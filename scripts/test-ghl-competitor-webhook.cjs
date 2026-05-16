/**
 * Test GHL Workflow 5 — competitor movement (critical)
 * Usage: node scripts/test-ghl-competitor-webhook.cjs [email]
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

const url = process.env.GHL_WEBHOOK_COMPETITOR_URL?.trim();
if (!url) {
  console.error('Set GHL_WEBHOOK_COMPETITOR_URL in .env.local');
  process.exit(1);
}

const email = process.argv[2] || process.env.EMAIL_USER || 'test@example.com';

const body = {
  event: 'competitor_movement',
  source: 'seoinforce',
  userId: 'test-comp',
  email,
  domain: 'example.com',
  keyword: 'seo audit tool',
  competitorDomain: 'rival.com',
  positionsMoved: 12,
  newPosition: 3,
  critical: true,
  dashboardUrl: 'https://seoinforce.com/audit/dashboard',
  link: 'https://seoinforce.com/audit/dashboard',
  lastCompetitorAlert: new Date().toISOString().slice(0, 10),
  timestamp: new Date().toISOString(),
};

fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  .then(async (r) => {
    console.log('Status:', r.status, await r.text());
    if (!r.ok) process.exit(1);
    console.log('Check GHL: Competitor Alert workflow + Execution Logs');
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
