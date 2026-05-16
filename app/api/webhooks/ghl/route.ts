import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { syncUserToGhlById } from '@/lib/ghl/sync-user';

export const dynamic = 'force-dynamic';

const OPT_OUT_KEYWORDS = new Set(['stop', 'unsubscribe', 'cancel', 'optout', 'opt-out', 'quit', 'end']);

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function pickMessageId(obj: unknown): string | null {
  if (!obj || typeof obj !== 'object') return null;
  const o = obj as Record<string, unknown>;
  const candidates = [
    o.messageId,
    o.message_id,
    o.emailMessageId,
    o.id,
    o.ghlMessageId,
    (o.data as Record<string, unknown>)?.messageId,
    (o.payload as Record<string, unknown>)?.messageId,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) return c;
  }
  return null;
}

function pickDeliveryStatus(obj: unknown): string | null {
  if (!obj || typeof obj !== 'object') return null;
  const o = obj as Record<string, unknown>;
  const candidates = [
    o.status,
    o.deliveryStatus,
    o.event,
    (o.data as Record<string, unknown>)?.status,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) return c;
  }
  return null;
}

/**
 * GHL / LeadConnector webhooks — point your workflow or message-status webhook here.
 * If GHL_WEBHOOK_SECRET is set, send header: x-ghl-webhook-secret: <same value>
 */
export async function POST(request: NextRequest) {
  const secret = (process.env.GHL_WEBHOOK_SECRET ?? '').trim();
  if (secret) {
    const hdr = request.headers.get('x-ghl-webhook-secret')?.trim() ?? '';
    if (!timingSafeEqual(hdr, secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const optOutHandled = await handleSmsOptOutWebhook(body);
  if (optOutHandled) {
    return NextResponse.json({ ok: true, action: 'sms_opt_out' });
  }

  const messageId = pickMessageId(body);
  const deliveryStatus = pickDeliveryStatus(body) ?? 'update';

  if (!messageId) {
    console.log('GHL webhook: no messageId in payload', JSON.stringify(body).slice(0, 500));
    return NextResponse.json({ ok: true, note: 'no messageId — logged only' });
  }

  const supabase = createSupabaseServerClient();
  const { data: rows, error: selErr } = await supabase
    .from('ghl_sms_logs')
    .select('id')
    .eq('ghl_message_id', messageId)
    .limit(1);

  if (selErr) {
    console.warn('GHL webhook select', selErr);
    return NextResponse.json({ error: selErr.message }, { status: 500 });
  }

  if (!rows?.length) {
    console.log('GHL webhook: no sms log for messageId', messageId);
    return NextResponse.json({ ok: true, note: 'no matching sms log' });
  }

  const { error: upErr } = await supabase
    .from('ghl_sms_logs')
    .update({
      delivery_status: deliveryStatus,
      raw_webhook: body as Record<string, unknown>,
    })
    .eq('ghl_message_id', messageId);

  if (upErr) {
    console.warn('GHL webhook update', upErr);
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, messageId, delivery_status: deliveryStatus });
}

function pickContactId(obj: unknown): string | null {
  if (!obj || typeof obj !== 'object') return null;
  const o = obj as Record<string, unknown>;
  const candidates = [
    o.contactId,
    o.contact_id,
    (o.contact as Record<string, unknown>)?.id,
    (o.data as Record<string, unknown>)?.contactId,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) return c;
  }
  return null;
}

function pickInboundBody(obj: unknown): string | null {
  if (!obj || typeof obj !== 'object') return null;
  const o = obj as Record<string, unknown>;
  const candidates = [o.body, o.message, o.text, (o.data as Record<string, unknown>)?.body];
  for (const c of candidates) {
    if (typeof c === 'string') return c;
  }
  return null;
}

/** GHL inbound SMS STOP / unsubscribe → opt user out in DB + tags (Step 5). */
async function handleSmsOptOutWebhook(body: unknown): Promise<boolean> {
  if (!body || typeof body !== 'object') return false;
  const o = body as Record<string, unknown>;
  const event = String(o.event || o.type || o.webhookType || '').toLowerCase();
  const inbound = pickInboundBody(body)?.trim().toLowerCase() ?? '';
  const isOptOutEvent =
    event.includes('unsubscribe') ||
    event.includes('opt') ||
    event.includes('dnd') ||
    o.optOut === true ||
    o.unsubscribed === true;

  const keywordOptOut =
    inbound.length > 0 && OPT_OUT_KEYWORDS.has(inbound.replace(/[^a-z-]/g, ''));

  if (!isOptOutEvent && !keywordOptOut) return false;

  const contactId = pickContactId(body);
  if (!contactId) return false;

  const supabase = createSupabaseServerClient();
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .eq('ghl_contact_id', contactId)
    .limit(1);

  const userId = users?.[0]?.id;
  if (!userId) return false;

  const now = new Date().toISOString();
  await supabase
    .from('users')
    .update({
      sms_notification_scope: 'none',
      sms_opt_out_at: now,
      updated_at: now,
    })
    .eq('id', userId);

  void syncUserToGhlById(userId);
  return true;
}
