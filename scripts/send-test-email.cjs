/**
 * One-off SMTP test — loads D:\projects\Seoinforce.com\.env.local (sibling of scripts/).
 * Usage from project root: node scripts/send-test-email.cjs [to@email.com]
 */
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

function loadEnvLocal() {
  const p = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(p)) {
    console.error('Missing .env.local at', p);
    process.exit(1);
  }
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

loadEnvLocal();

const to = process.argv[2] || 'fizasaif0233@gmail.com';
const user = process.env.SMTP_USER || process.env.EMAIL_USER;
const passRaw = process.env.SMTP_PASS || process.env.EMAIL_PASS || '';
const pass = passRaw.replace(/^"|"$/g, '').replace(/\s+/g, '');

if (!user || !pass) {
  console.error('Need SMTP_USER/EMAIL_USER and SMTP_PASS/EMAIL_PASS in .env.local');
  process.exit(1);
}

const host = process.env.SMTP_HOST || 'smtp.gmail.com';
const port = Number(process.env.SMTP_PORT || '465');

async function main() {
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || user,
    to,
    subject: 'SEOInForce — email test',
    text: 'If you receive this, SMTP from .env.local is working.',
    html: '<p>If you receive this, SMTP from <code>.env.local</code> is working.</p>',
  });
  console.log('Sent OK. messageId:', info.messageId, 'to:', to);
}

main().catch((e) => {
  console.error('Send failed:', e.message || e);
  process.exit(1);
});
