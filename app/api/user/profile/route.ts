import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { normalizePhoneE164 } from '@/lib/ghl/sms';
import { syncUserToGhlById } from '@/lib/ghl/sync-user';

export const dynamic = 'force-dynamic';

/** Update profile fields and sync contact to GHL (Step 4). */
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.full_name === 'string') {
    patch.full_name = body.full_name.trim() || null;
  }
  if (typeof body.company_name === 'string') {
    patch.company_name = body.company_name.trim() || null;
  }
  if (body.phone !== undefined) {
    const raw = typeof body.phone === 'string' ? body.phone : '';
    const normalized = raw.trim() === '' ? null : normalizePhoneE164(raw);
    if (raw.trim() !== '' && !normalized) {
      return NextResponse.json(
        { error: 'Phone must be in international format (e.g. +447911123456)' },
        { status: 400 }
      );
    }
    patch.phone = normalized;
  }

  if (Object.keys(patch).length === 1) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from('users').update(patch).eq('id', user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const contactId = await syncUserToGhlById(user.id);

  return NextResponse.json({ success: true, ghl_contact_id: contactId });
}
