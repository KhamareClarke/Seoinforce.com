/**
 * Optional Go High Level (LeadConnector) inbound webhook — same idea as other stacks:
 * In GHL, create an "Inbound Webhook" workflow trigger and paste the URL into .env
 */

export type GhlLeadSource = 'audit_request' | 'consultation_booking';

export type GhlLeadPayload = {
  source: GhlLeadSource;
  name: string;
  email: string;
  phone: string;
  domain?: string;
  timestamp: string;
};

export async function forwardLeadToGhl(data: GhlLeadPayload): Promise<boolean> {
  const url = (process.env.GHL_INBOUND_WEBHOOK_URL ?? '').trim();
  if (!url) return false;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        firstName: data.name.split(/\s+/)[0] ?? data.name,
        lastName: data.name.split(/\s+/).slice(1).join(' ') || undefined,
        companyName: data.domain,
      }),
    });
    if (!res.ok) {
      console.warn('GHL webhook non-OK:', res.status, await res.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (e) {
    console.warn('GHL webhook error:', e);
    return false;
  }
}
