import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/require-admin';
import { fetchGhlAdminDashboard } from '@/lib/ghl/admin-dashboard';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const days = Math.min(Number(new URL(request.url).searchParams.get('days') || 30), 90);
  try {
    const data = await fetchGhlAdminDashboard(days);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Dashboard load failed' },
      { status: 500 }
    );
  }
}
