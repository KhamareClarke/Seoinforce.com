/**
 * Test GHL Workflow 2 — rank change (drop or gain)
 * Usage: node scripts/test-ghl-rank-webhook.cjs [down|up] [email]
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

const direction = (process.argv[2] || 'down').toLowerCase() === 'up' ? 'up' : 'down';
const email = process.argv[3] || process.env.EMAIL_USER || 'test@example.com';

const url =
  (direction === 'up'
    ? process.env.GHL_WEBHOOK_RANK_GAIN_URL
    : process.env.GHL_WEBHOOK_RANK_DROP_URL)?.trim() ||
  process.env.GHL_WEBHOOK_RANK_CHANGE_URL?.trim();

if (!url) {
  console.error('Set GHL_WEBHOOK_RANK_DROP_URL / GHL_WEBHOOK_RANK_GAIN_URL (or RANK_CHANGE_URL)');
  process.exit(1);
}

const body = {
  event: 'rank_change',
  source: 'seoinforce',
  userId: 'test-rank',
  email,
  direction,
  domain: 'example.com',
  keyword: 'seo audit tool',
  previousPosition: direction === 'down' ? 5 : 18,
  newPosition: direction === 'down' ? 12 : 8,
  deltaPositions: 7,
  positionsMoved: 7,
  lastRankChangeDate: new Date().toISOString().slice(0, 10),
  dashboardUrl: 'https://seoinforce.com/audit/dashboard',
  timestamp: new Date().toISOString(),
};

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})
  .then(async (r) => {
    console.log('Direction:', direction);
    console.log('Status:', r.status, await r.text());
    if (!r.ok) process.exit(1);
    console.log('Check GHL rank workflow Execution Logs');
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
