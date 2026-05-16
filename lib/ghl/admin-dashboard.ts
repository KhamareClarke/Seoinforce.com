import { createSupabaseServerClient } from '@/lib/supabase/client';
import { getGhlClientConfig, isGhlConfigured, makeGhlRequest } from './client';

function maskKey(key: string): string {
  if (key.length <= 12) return '***';
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}

const WORKFLOW_URL_KEYS = {
  audit_completed: 'GHL_WEBHOOK_AUDIT_COMPLETED_URL',
  signup: 'GHL_WEBHOOK_SIGNUP_URL',
  rank_drop: 'GHL_WEBHOOK_RANK_DROP_URL',
  rank_gain: 'GHL_WEBHOOK_RANK_GAIN_URL',
  subscription_upgraded: 'GHL_WEBHOOK_SUBSCRIPTION_UPGRADED_URL',
  subscription_downgraded: 'GHL_WEBHOOK_SUBSCRIPTION_DOWNGRADED_URL',
  subscription_renewed: 'GHL_WEBHOOK_SUBSCRIPTION_RENEWED_URL',
  competitor_movement: 'GHL_WEBHOOK_COMPETITOR_URL',
} as const;

const EMAIL_WORKFLOW_EVENTS = new Set([
  'audit_completed',
  'signup',
  'rank_change',
  'subscription_updated',
  'competitor_movement',
]);

export async function fetchGhlAdminDashboard(days = 30) {
  const cfg = getGhlClientConfig();
  const configured = isGhlConfigured();

  let connectionOk = false;
  let connectionError: string | null = null;
  let locationName: string | null = null;

  if (cfg) {
    try {
      const data = await makeGhlRequest<Record<string, unknown>>(
        `/locations/${cfg.locationId}`,
        { method: 'GET' }
      );
      connectionOk = true;
      const loc = (data.location as Record<string, unknown>) ?? data;
      locationName =
        (typeof loc.name === 'string' ? loc.name : null) ||
        (typeof data.name === 'string' ? data.name : null);
    } catch (e) {
      connectionError = e instanceof Error ? e.message : String(e);
    }
  }

  const supabase = createSupabaseServerClient();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceIso = since.toISOString();
  const since7 = new Date();
  since7.setDate(since7.getDate() - 7);

  const workflowWebhooksConfigured = Object.fromEntries(
    Object.entries(WORKFLOW_URL_KEYS).map(([k, envKey]) => [
      k,
      Boolean(process.env[envKey]?.trim()),
    ])
  );

  const [
    { count: totalUsers },
    { count: syncedUsers },
    { data: pendingUsers },
    { data: lastSms },
    { data: lastSync },
    { data: smsLogs },
    { data: smsRecent },
    { data: workflowLogs },
    { data: apiLogs },
    { data: syncLogs },
    { count: smsOptOuts },
  ] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('id', { count: 'exact', head: true }).not('ghl_contact_id', 'is', null),
    supabase
      .from('users')
      .select('id, email, full_name, created_at')
      .is('ghl_contact_id', null)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('ghl_sms_logs')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('ghl_sync_logs')
      .select('created_at, status')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('ghl_sms_logs')
      .select('id, user_id, event_type, status, delivery_status, phone_masked, error, created_at')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(2000),
    supabase
      .from('ghl_sms_logs')
      .select('event_type, status, delivery_status, created_at, error, user_id')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('ghl_workflow_logs')
      .select('*')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('ghl_api_logs')
      .select('operation, method, status_code, duration_ms, error, created_at')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(2000),
    supabase
      .from('ghl_sync_logs')
      .select('*')
      .gte('created_at', since7.toISOString())
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('sms_notification_scope', 'none')
      .not('sms_opt_out_at', 'is', null),
  ]);

  const smsRows = smsLogs ?? [];
  const recentRows = smsRecent ?? [];
  const recentUserIds = [
    ...new Set(recentRows.map((r) => r.user_id).filter((id): id is string => Boolean(id))),
  ];
  let emailByUserId: Record<string, string> = {};
  if (recentUserIds.length > 0) {
    const { data: recentUsers } = await supabase
      .from('users')
      .select('id, email')
      .in('id', recentUserIds);
    emailByUserId = Object.fromEntries((recentUsers ?? []).map((u) => [u.id, u.email]));
  }
  const sent = smsRows.filter((r) => r.status === 'sent').length;
  const failed = smsRows.filter((r) => r.status === 'failed').length;
  const skipped = smsRows.filter((r) => r.status === 'skipped').length;
  const delivered = smsRows.filter((r) => r.delivery_status === 'delivered').length;
  const bounced = smsRows.filter(
    (r) => r.delivery_status === 'failed' || r.delivery_status === 'undelivered'
  ).length;

  const smsByEvent: Record<string, number> = {};
  const smsByDay: Record<string, { sent: number; failed: number; skipped: number }> = {};
  for (const r of smsRows) {
    const k = r.event_type || 'unknown';
    smsByEvent[k] = (smsByEvent[k] ?? 0) + 1;
    const day = (r.created_at as string).slice(0, 10);
    if (!smsByDay[day]) smsByDay[day] = { sent: 0, failed: 0, skipped: 0 };
    if (r.status === 'sent') smsByDay[day].sent += 1;
    else if (r.status === 'failed') smsByDay[day].failed += 1;
    else if (r.status === 'skipped') smsByDay[day].skipped += 1;
  }

  const wfRows = workflowLogs ?? [];
  const workflowsSucceeded = wfRows.filter((r) => r.success).length;
  const workflowsFailed = wfRows.filter((r) => !r.success).length;
  const emailTriggersByEvent: Record<string, number> = {};
  for (const r of wfRows) {
    if (!EMAIL_WORKFLOW_EVENTS.has(r.event_type)) continue;
    emailTriggersByEvent[r.event_type] = (emailTriggersByEvent[r.event_type] ?? 0) + 1;
  }

  const apiRows = apiLogs ?? [];
  const apiByOperation: Record<string, number> = {};
  for (const r of apiRows) {
    apiByOperation[r.operation] = (apiByOperation[r.operation] ?? 0) + 1;
  }
  const apiByDay: Record<string, number> = {};
  for (const r of apiRows) {
    const day = (r.created_at as string).slice(0, 10);
    apiByDay[day] = (apiByDay[day] ?? 0) + 1;
  }

  const syncFailed = (syncLogs ?? []).filter((r) => r.status === 'failed');
  const total = totalUsers ?? 0;
  const synced = syncedUsers ?? 0;
  const pending = Math.max(0, total - synced);

  type ErrorRow = {
    id: string;
    category: 'sms' | 'sync' | 'workflow' | 'api';
    at: string;
    email: string | null;
    message: string;
    status: string;
  };

  const errors: ErrorRow[] = [];

  for (const r of smsRows.filter((x) => x.status === 'failed').slice(0, 20)) {
    errors.push({
      id: `sms-${r.id}`,
      category: 'sms',
      at: r.created_at as string,
      email: (r.user_id && emailByUserId[r.user_id]) || null,
      message: (r.error as string) || 'SMS send failed',
      status: 'open',
    });
  }

  for (const r of syncFailed) {
    errors.push({
      id: `sync-${r.id}`,
      category: 'sync',
      at: r.created_at as string,
      email: (r.email as string) ?? null,
      message: (r.error as string) || 'Contact sync failed',
      status: 'open',
    });
  }

  for (const r of wfRows.filter((x) => !x.success).slice(0, 20)) {
    errors.push({
      id: `wf-${r.id}`,
      category: 'workflow',
      at: r.created_at as string,
      email: (r.email as string) ?? null,
      message: (r.error as string) || `Workflow webhook failed (${r.event_type})`,
      status: 'open',
    });
  }

  for (const r of apiRows.filter((x) => x.error).slice(0, 15)) {
    errors.push({
      id: `api-${r.created_at}-${r.operation}`,
      category: 'api',
      at: r.created_at as string,
      email: null,
      message: (r.error as string) || 'API error',
      status: r.status_code === 429 ? 'rate_limited' : 'open',
    });
  }

  errors.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const quotaMonthly = Number(process.env.GHL_API_MONTHLY_QUOTA || 50000);

  return {
    days,
    connection: {
      configured,
      connected: configured && connectionOk,
      connectionError,
      locationId: cfg?.locationId ?? null,
      locationName,
      apiKeyMasked: cfg ? maskKey(cfg.apiKey) : null,
      workflowWebhooksConfigured,
    },
    contacts: {
      totalUsers: total,
      synced,
      pending,
      syncPercent: total > 0 ? Math.round((synced / total) * 100) : 0,
      failedSyncs7d: syncFailed.length,
      lastSyncAt: lastSync?.created_at ?? null,
      lastSyncStatus: lastSync?.status ?? null,
      pendingUsers: (pendingUsers ?? []).map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.full_name,
      })),
    },
    sms: {
      total: smsRows.length,
      sent,
      failed,
      skipped,
      delivered,
      bounced,
      deliveryRate: sent > 0 ? Math.round((delivered / sent) * 1000) / 10 : 0,
      bounceRate: sent > 0 ? Math.round((bounced / sent) * 1000) / 10 : 0,
      optOutCount: smsOptOuts ?? 0,
      byEvent: smsByEvent,
      byDay: smsByDay,
      lastSmsAt: lastSms?.created_at ?? null,
      recent: recentRows.map((r) => ({
        at: r.created_at,
        event: r.event_type,
        status: r.status,
        delivery: r.delivery_status,
        email: (r.user_id && emailByUserId[r.user_id]) || null,
        error: r.error,
      })),
    },
    email: {
      note:
        'Marketing emails (audit, signup, rank, subscription, competitor) are sent inside GHL workflows. Open/click rates appear in GHL Reporting. Below: workflow webhook triggers from SEOinforce (proxy for email volume).',
      workflowTriggersTotal: wfRows.filter((r) => EMAIL_WORKFLOW_EVENTS.has(r.event_type)).length,
      workflowTriggersSucceeded: wfRows.filter(
        (r) => EMAIL_WORKFLOW_EVENTS.has(r.event_type) && r.success
      ).length,
      byEvent: emailTriggersByEvent,
    },
    workflows: {
      total: wfRows.length,
      succeeded: workflowsSucceeded,
      failed: workflowsFailed,
      recent: wfRows.slice(0, 40).map((r) => ({
        id: r.id,
        at: r.created_at,
        event: r.event_type,
        workflowKey: r.workflow_key,
        email: r.email,
        success: r.success,
        httpStatus: r.http_status,
        error: r.error,
        changeType:
          r.payload && typeof r.payload === 'object' && 'changeType' in (r.payload as object)
            ? String((r.payload as Record<string, unknown>).changeType)
            : null,
        direction:
          r.payload && typeof r.payload === 'object' && 'direction' in (r.payload as object)
            ? String((r.payload as Record<string, unknown>).direction)
            : null,
      })),
    },
    apiUsage: {
      totalCalls: apiRows.length,
      callsPerDay: days > 0 ? Math.round(apiRows.length / days) : 0,
      byOperation: apiByOperation,
      byDay: apiByDay,
      quotaMonthly,
      quotaUsedPercent:
        quotaMonthly > 0 ? Math.round((apiRows.length / quotaMonthly) * 1000) / 10 : 0,
      rateLimitErrors: apiRows.filter((r) => r.status_code === 429).length,
    },
    errors: {
      total7d: errors.length,
      items: errors.slice(0, 30),
    },
  };
}
