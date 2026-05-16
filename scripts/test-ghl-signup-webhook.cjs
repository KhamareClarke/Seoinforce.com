/**
 * Test GHL Workflow 3 — new signup
 * Usage: node scripts/test-ghl-signup-webhook.cjs [email]
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

const url = process.env.GHL_WEBHOOK_SIGNUP_URL?.trim();
if (!url) {
  console.error('Set GHL_WEBHOOK_SIGNUP_URL in .env.local');
  process.exit(1);
}

const email = process.argv[2] || process.env.EMAIL_USER || 'test@example.com';
const signupDate = new Date().toISOString().slice(0, 10);

const body = {
  event: 'signup',
  source: 'seoinforce',
  userId: 'test-signup-1',
  email,
  fullName: 'Test User',
  accountType: 'personal',
  planType: 'free',
  signupAt: new Date().toISOString(),
  signupDate,
  signupDateTag: `signup_date_${signupDate}`,
  leadStatus: 'lead',
  isFreemium: true,
  isPaid: false,
  appBaseUrl: 'https://seoinforce.com',
  firstAuditUrl: 'https://seoinforce.com/audit/dashboard',
  dashboardUrl: 'https://seoinforce.com/audit/dashboard',
  link: 'https://seoinforce.com/audit/dashboard',
  verifyEmailUrl: 'https://seoinforce.com/verify-email?token=test',
  timestamp: new Date().toISOString(),
};

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})
  .then(async (r) => {
    console.log('Status:', r.status, await r.text());
    if (!r.ok) process.exit(1);
    console.log('Check GHL: Seoinforce - New Signup + Execution Logs');
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
