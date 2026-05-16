import { makeGhlRequest, getGhlClientConfig } from './client';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { isGhlConfigured } from './client';
import { syncUserToGhlById } from './sync-user';
import { upsertGhlContactByPhone } from './contacts';

export type GhlSmsEventType =
  | 'audit_completion'
  | 'rank_drop'
  | 'rank_gain'
  | 'competitor_alert'
  | 'subscription_renewal'
  | 'subscription_upgraded'
  | 'subscription_downgraded'
  | 'report_ready'
  | 'signup_welcome';

export type GhlSmsTemplateVars = {
  domain?: string;
  link?: string;
  keyword?: string;
  positions?: string | number;
  newPosition?: string | number;
  nextBillingDate?: string;
  score?: string | number;
  features?: string;
  planName?: string;
};

const CRITICAL_EVENTS = new Set<GhlSmsEventType>([
  'audit_completion',
  'rank_drop',
  'competitor_alert',
  'subscription_renewal',
  'subscription_upgraded',
  'subscription_downgraded',
]);

export function isCriticalSmsEvent(event: GhlSmsEventType): boolean {
  return CRITICAL_EVENTS.has(event);
}

/** E.164-style check (lenient): optional +, then digits, 10–15 digits total */
export function isLikelyE164(phone: string): boolean {
  const t = phone.replace(/[\s-]/g, '');
  if (!t) return false;
  const d = t.startsWith('+') ? t.slice(1) : t;
  return /^\d{10,15}$/.test(d);
}

export function normalizePhoneE164(phone: string): string | null {
  const t = phone.trim();
  if (!t) return null;
  if (t.startsWith('+')) {
    return isLikelyE164(t) ? t : null;
  }
  const digits = t.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length >= 10 && digits.length <= 15) return `+${digits}`;
  return null;
}

/** Store in logs — avoid full phone in DB where possible (column nullable until migration). */
export function maskPhoneForLog(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const t = phone.replace(/[\s-]/g, '');
  if (t.length <= 4) return '****';
  const head = t.startsWith('+') ? t.slice(0, 3) : t.slice(0, 2);
  return `${head}****${t.slice(-4)}`;
}

function interpolate(template: string, vars: Record<string, string | number | undefined>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ''));
}

const SMS_TEMPLATES: Record<GhlSmsEventType, string> = {
  audit_completion:
    'Your SEO audit for {domain} is complete. Score: {score}/100. View results: {link}',
  rank_drop:
    '⚠️ "{keyword}" dropped to position {newPosition}. Details: {link}',
  rank_gain: '🎉 "{keyword}" improved to position {newPosition}! {link}',
  competitor_alert: 'Competitor moved up for "{keyword}". See analysis: {link}',
  subscription_renewal:
    'Your SEOInForce subscription renewed. Next billing date: {nextBillingDate}',
  subscription_upgraded:
    'Welcome to {planName}! Your plan includes: {features}. Start here: {link}',
  subscription_downgraded:
    'We noticed you downgraded. How can we help? {link}',
  report_ready: 'Your weekly report is ready. Download: {link}',
  signup_welcome:
    'Welcome to SEOInForce! Run your first free audit: {link}',
};

export function renderSmsMessage(
  event: GhlSmsEventType,
  vars: GhlSmsTemplateVars
): string {
  const flat: Record<string, string | number | undefined> = { ...vars };
  return interpolate(SMS_TEMPLATES[event], flat).replace(/\s+/g, ' ').trim();
}

export type SendGhlSmsResult = {
  ok: boolean;
  skipped?: string;
  ghlMessageId?: string;
  conversationId?: string;
  raw?: unknown;
  error?: string;
};

/**
 * POST /conversations/messages — send SMS via GHL (myapproved.com pattern: locationId + poll status).
 */
export async function sendGhlSmsMessage(params: {
  contactId: string;
  body: string;
  fromNumber?: string;
}): Promise<SendGhlSmsResult> {
  if (!isGhlConfigured()) {
    return { ok: false, error: 'GHL not configured' };
  }

  const cfg = getGhlClientConfig()!;

  try {
    const payload: Record<string, unknown> = {
      type: 'SMS',
      locationId: cfg.locationId,
      contactId: params.contactId,
      message: params.body,
    };
    if (params.fromNumber) payload.fromNumber = params.fromNumber;

    const data = await makeGhlRequest<Record<string, unknown>>('/conversations/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const messageId =
      (data.messageId as string) ||
      (data.id as string) ||
      (typeof data.msg === 'string' ? data.msg : undefined);
    const conversationId = data.conversationId as string | undefined;

    if (messageId && typeof messageId === 'string') {
      const delivery = await pollGhlSmsDeliveryStatus(messageId);
      if (delivery.failed) {
        return {
          ok: false,
          ghlMessageId: messageId,
          conversationId,
          raw: data,
          error: delivery.error,
        };
      }
    }

    return {
      ok: true,
      ghlMessageId: typeof messageId === 'string' ? messageId : undefined,
      conversationId,
      raw: data,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Brief poll after send (matches myapproved.com readGhlOutboundSmsStatus). */
async function pollGhlSmsDeliveryStatus(
  messageId: string
): Promise<{ failed: boolean; error?: string; status?: string }> {
  const debug = process.env.GHL_DEBUG_SMS === '1' || process.env.GHL_DEBUG_SMS === 'true';
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 1500));
    try {
      const data = await makeGhlRequest<Record<string, unknown>>(
        `/conversations/messages/${messageId}`,
        { method: 'GET' }
      );
      const inner =
        data.message && typeof data.message === 'object'
          ? (data.message as Record<string, unknown>)
          : data;
      const status = typeof inner.status === 'string' ? inner.status.toLowerCase() : '';
      if (debug) console.warn('[ghl-sms] poll', messageId, status);
      if (status === 'failed' || status === 'undelivered') {
        const err =
          typeof inner.error === 'string'
            ? inner.error
            : `GHL SMS status: ${status || 'failed'}`;
        return { failed: true, error: err, status };
      }
      if (status === 'delivered' || status === 'sent' || status === 'read') {
        return { failed: false, status };
      }
    } catch {
      break;
    }
  }
  return { failed: false };
}

type SmsScope = 'none' | 'critical' | 'all';

function canSendForScope(scope: SmsScope, event: GhlSmsEventType): boolean {
  if (scope === 'none') return false;
  if (scope === 'all') return true;
  return isCriticalSmsEvent(event);
}

async function logSmsAttempt(args: {
  userId: string | null;
  event: GhlSmsEventType;
  contactId: string | null;
  phone: string | null;
  status: 'sent' | 'failed' | 'skipped';
  message?: string;
  ghlMessageId?: string;
  error?: string;
}) {
  try {
    const supabase = createSupabaseServerClient();
    await supabase.from('ghl_sms_logs').insert({
      user_id: args.userId,
      event_type: args.event,
      contact_id: args.contactId,
      phone: args.phone,
      phone_masked: maskPhoneForLog(args.phone),
      status: args.status,
      message: args.message,
      ghl_message_id: args.ghlMessageId,
      error: args.error,
      delivery_status: args.status === 'sent' ? 'queued' : null,
      retry_attempts: 0,
    });
  } catch (e) {
    console.warn('ghl_sms_logs insert failed', e);
  }
}

/**
 * Loads user prefs, syncs contact if needed, sends SMS when allowed.
 */
export async function sendSmsForUserEvent(args: {
  userId: string;
  event: GhlSmsEventType;
  vars: GhlSmsTemplateVars;
}): Promise<SendGhlSmsResult & { userId: string; event: GhlSmsEventType }> {
  const { userId, event, vars } = args;
  if (!isGhlConfigured()) {
    await logSmsAttempt({
      userId,
      event,
      contactId: null,
      phone: null,
      status: 'skipped',
      error: 'GHL not configured',
    });
    return { ok: false, userId, event, skipped: 'GHL not configured', error: 'GHL not configured' };
  }

  const supabase = createSupabaseServerClient();
  const { data: u, error } = await supabase
    .from('users')
    .select('phone, ghl_contact_id, sms_notification_scope, email, full_name')
    .eq('id', userId)
    .single();

  if (error || !u) {
    await logSmsAttempt({
      userId,
      event,
      contactId: null,
      phone: null,
      status: 'skipped',
      error: 'User not found',
    });
    return { ok: false, userId, event, skipped: 'User not found' };
  }

  const scope = (u.sms_notification_scope || 'none') as SmsScope;
  if (!canSendForScope(scope, event)) {
    await logSmsAttempt({
      userId,
      event,
      contactId: u.ghl_contact_id,
      phone: u.phone,
      status: 'skipped',
      error: `Scope ${scope} does not allow ${event}`,
    });
    return {
      ok: false,
      userId,
      event,
      skipped: `notification scope: ${scope}`,
    };
  }

  const phone = u.phone as string | null;
  const normalizedPhone = phone ? normalizePhoneE164(phone) : null;
  if (!normalizedPhone || !isLikelyE164(normalizedPhone)) {
    await logSmsAttempt({
      userId,
      event,
      contactId: u.ghl_contact_id,
      phone,
      status: 'skipped',
      error: 'No valid phone on file',
    });
    return { ok: false, userId, event, skipped: 'No valid phone' };
  }

  let contactId = u.ghl_contact_id as string | null;
  if (!contactId) {
    try {
      contactId = await upsertGhlContactByPhone(normalizedPhone, {
        email: u.email as string,
        name: (u.full_name as string) || undefined,
      });
      await supabase.from('users').update({ ghl_contact_id: contactId }).eq('id', userId);
    } catch (e) {
      console.warn('GHL upsert by phone failed, falling back to full sync:', e);
      contactId = await syncUserToGhlById(userId);
    }
  }
  if (!contactId) {
    await logSmsAttempt({
      userId,
      event,
      contactId: null,
      phone,
      status: 'skipped',
      error: 'Could not resolve GHL contact',
    });
    return { ok: false, userId, event, skipped: 'No GHL contact' };
  }

  const message = renderSmsMessage(event, vars);
  const result = await sendGhlSmsMessage({ contactId, body: message });

  let logMessage = message;
  if (result.ok && result.raw && typeof result.raw === 'object' && 'msg' in result.raw) {
    logMessage = `${message} — GHL: ${String((result.raw as Record<string, unknown>).msg)}`;
  }

  await logSmsAttempt({
    userId,
    event,
    contactId,
    phone,
    status: result.ok ? 'sent' : 'failed',
    message: logMessage,
    ghlMessageId: result.ghlMessageId,
    error: result.error,
  });

  if (result.ok && result.ghlMessageId) {
    const delivery = await pollGhlSmsDeliveryStatus(result.ghlMessageId);
    if (delivery.status) {
      await updateSmsLogDelivery(result.ghlMessageId, delivery.status);
    }
  }

  return { ...result, userId, event };
}

async function updateSmsLogDelivery(ghlMessageId: string, deliveryStatus: string): Promise<void> {
  try {
    const supabase = createSupabaseServerClient();
    await supabase
      .from('ghl_sms_logs')
      .update({ delivery_status: deliveryStatus })
      .eq('ghl_message_id', ghlMessageId);
  } catch (e) {
    console.warn('updateSmsLogDelivery failed', e);
  }
}
