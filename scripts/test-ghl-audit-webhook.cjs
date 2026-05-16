/**
 * Test GHL Workflow 1 — audit completed
 * Usage: node scripts/test-ghl-audit-webhook.cjs [email]
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

const url = process.env.GHL_WEBHOOK_AUDIT_COMPLETED_URL?.trim();
if (!url) {
  console.error('Set GHL_WEBHOOK_AUDIT_COMPLETED_URL in .env.local');
  process.exit(1);
}

const email = process.argv[2] || process.env.EMAIL_USER || 'test@example.com';

const body = {
  event: 'audit_completed',
  source: 'seoinforce',
  userId: 'test-audit',
  email,
  fullName: 'Test User',
  planType: 'free',
  domain: 'example.com',
  auditId: 'test-audit-id',
  overallScore: 62,
  issuesTotal: 24,
  issuesCriticalOrHigh: 12,
  criticalIssues: 12,
  isFreemium: true,
  triggerUpgradeOffer: true,
  lastAuditDate: new Date().toISOString().slice(0, 10),
  dashboardUrl: 'https://seoinforce.com/audit/dashboard',
  auditUrl: 'https://seoinforce.com/audit/dashboard',
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
    console.log('Check GHL workflow: Audit Completed + Execution Logs');
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
