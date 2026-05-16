import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { normalizePhoneE164 } from '@/lib/ghl/sms';
import { syncUserToGhlById } from '@/lib/ghl/sync-user';
import { touchUserLastActive } from '@/lib/user-activity';

export const dynamic = 'force-dynamic';

const SCOPES = ['none', 'critical', 'all'] as const;
type SmsScope = (typeof SCOPES)[number];

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createSupabaseServerClient();
  const { data: u, error } = await supabase
    .from('users')
    .select('phone, sms_notification_scope, sms_opt_in_at, sms_opt_out_at')
    .eq('id', user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    phone: u?.phone ?? '',
    sms_notification_scope: (u?.sms_notification_scope as SmsScope) || 'none',
    sms_opt_in_at: u?.sms_opt_in_at,
    sms_opt_out_at: u?.sms_opt_out_at,
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const rawPhone = typeof body.phone === 'string' ? body.phone : undefined;
  const scopeRaw = body.sms_notification_scope;

  let sms_notification_scope: SmsScope | undefined;
  if (scopeRaw !== undefined) {
    if (!SCOPES.includes(scopeRaw)) {
      return NextResponse.json(
        { error: 'sms_notification_scope must be one of: none, critical, all' },
        { status: 400 }
      );
    }
    sms_notification_scope = scopeRaw;
  }

  let phone: string | null | undefined;
  if (rawPhone !== undefined) {
    const normalized = rawPhone.trim() === '' ? null : normalizePhoneE164(rawPhone);
    if (rawPhone.trim() !== '' && !normalized) {
      return NextResponse.json(
        { error: 'Phone must be in international format (e.g. +447911123456)' },
        { status: 400 }
      );
    }
    phone = normalized;
  }

  const supabase = createSupabaseServerClient();
  const now = new Date().toISOString();

  const patch: Record<string, unknown> = { updated_at: now };
  if (phone !== undefined) patch.phone = phone;
  if (sms_notification_scope !== undefined) {
    patch.sms_notification_scope = sms_notification_scope;
    if (sms_notification_scope === 'none') {
      patch.sms_opt_out_at = now;
    } else {
      patch.sms_opt_in_at = now;
      patch.sms_opt_out_at = null;
    }
  }

  const { error } = await supabase.from('users').update(patch).eq('id', user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  void touchUserLastActive(user.id).then(() => syncUserToGhlById(user.id));

  return NextResponse.json({ success: true, ...patch });
}
