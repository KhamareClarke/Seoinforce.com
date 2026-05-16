import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/require-admin';
import { fetchGhlAdminDashboard } from '@/lib/ghl/admin-dashboard';

export const dynamic = 'force-dynamic';

/** Legacy SMS metrics; prefer GET /api/admin/ghl/dashboard */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const days = Math.min(Number(new URL(request.url).searchParams.get('days') || 30), 90);
  const d = await fetchGhlAdminDashboard(days);
  return NextResponse.json({
    days: d.days,
    total: d.sms.total,
    sent: d.sms.sent,
    failed: d.sms.failed,
    skipped: d.sms.skipped,
    delivered: d.sms.delivered,
    deliveryRate: d.sms.deliveryRate,
    byEvent: d.sms.byEvent,
    byDay: d.sms.byDay,
    recent: d.sms.recent,
  });
}
