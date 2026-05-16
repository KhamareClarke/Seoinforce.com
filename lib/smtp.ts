import nodemailer from 'nodemailer';

/**
 * SMTP helpers — same env pattern as FlipRepublic:
 * SMTP_USER / SMTP_PASS (preferred) or EMAIL_USER / EMAIL_PASS
 */
export function getSmtpCredentials(): { user: string; pass: string } {
  const user = (process.env.SMTP_USER ?? process.env.EMAIL_USER ?? '').trim();
  const pass = (process.env.SMTP_PASS ?? process.env.EMAIL_PASS ?? '')
    .trim()
    .replace(/^"|"$/g, '');
  return { user, pass };
}

export function getMailFrom(): string {
  const from = (process.env.SMTP_FROM ?? process.env.EMAIL_FROM ?? '').trim();
  const { user } = getSmtpCredentials();
  if (from) return from;
  if (user) return `"SEOInForce" <${user}>`;
  return '';
}

export function createSmtpTransporter(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST ?? 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT ?? '465');
  const { user, pass } = getSmtpCredentials();
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export function getAuditInboxEmail(): string {
  return (
    process.env.AUDIT_EMAIL ??
    process.env.ADMIN_EMAIL ??
    getSmtpCredentials().user
  ).trim();
}

export function getBookingInboxEmail(): string {
  return (
    process.env.BOOKING_EMAIL ??
    process.env.ADMIN_EMAIL ??
    getSmtpCredentials().user
  ).trim();
}

export function requireAuditInbox(): string {
  const s = getAuditInboxEmail();
  if (!s) {
    throw new Error('Configure AUDIT_EMAIL, ADMIN_EMAIL, or SMTP_USER for audit notifications.');
  }
  return s;
}

export function requireBookingInbox(): string {
  const s = getBookingInboxEmail();
  if (!s) {
    throw new Error('Configure BOOKING_EMAIL, ADMIN_EMAIL, or SMTP_USER for booking notifications.');
  }
  return s;
}
