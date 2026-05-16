import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/require-admin';
import { fetchGhlAdminDashboard } from '@/lib/ghl/admin-dashboard';

export const dynamic = 'force-dynamic';

/** Legacy shape for older clients; prefer GET /api/admin/ghl/dashboard */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const d = await fetchGhlAdminDashboard(30);
  return NextResponse.json({
    configured: d.connection.configured,
    connected: d.connection.connected,
    connectionError: d.connection.connectionError,
    locationId: d.connection.locationId,
    locationName: d.connection.locationName,
    apiKeyMasked: d.connection.apiKeyMasked,
    syncedContactCount: d.contacts.synced,
    lastSmsAt: d.sms.lastSmsAt,
    lastContactSyncAt: d.contacts.lastSyncAt,
    workflowWebhooksConfigured: d.connection.workflowWebhooksConfigured,
  });
}
