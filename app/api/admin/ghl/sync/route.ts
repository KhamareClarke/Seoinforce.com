import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/require-admin';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { syncUserToGhlById } from '@/lib/ghl/sync-user';
import { isGhlConfigured } from '@/lib/ghl/client';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * POST /api/admin/ghl/sync
 * Body: { userId?: string, pendingOnly?: boolean, limit?: number }
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  if (!isGhlConfigured()) {
    return NextResponse.json({ error: 'GHL not configured' }, { status: 400 });
  }

  let body: { userId?: string; pendingOnly?: boolean; limit?: number } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const limit = Math.min(Math.max(body.limit ?? 50, 1), 200);
  const supabase = createSupabaseServerClient();

  if (body.userId) {
    const contactId = await syncUserToGhlById(body.userId, { trigger: 'admin' });
    if (!contactId) {
      return NextResponse.json({ ok: false, synced: 0, failed: 1 });
    }
    return NextResponse.json({ ok: true, synced: 1, failed: 0, contactId });
  }

  let q = supabase.from('users').select('id, email').order('created_at', { ascending: false }).limit(limit);
  if (body.pendingOnly !== false) {
    q = q.is('ghl_contact_id', null);
  }

  const { data: users, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let synced = 0;
  let failed = 0;

  for (const u of users ?? []) {
    const contactId = await syncUserToGhlById(u.id, { trigger: 'admin' });
    if (contactId) synced += 1;
    else failed += 1;
    await new Promise((r) => setTimeout(r, 150));
  }

  return NextResponse.json({
    ok: true,
    synced,
    failed,
    processed: (users ?? []).length,
  });
}
