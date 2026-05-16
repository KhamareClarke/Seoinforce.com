import { createSupabaseServerClient } from '@/lib/supabase/client';

export function inferGhlApiOperation(method: string, path: string): string {
  const p = path.replace(/\?.*$/, '');
  const m = method.toUpperCase();
  if (p.includes('/contacts/search')) return 'search_contact';
  if (p.includes('/contacts/') && m === 'POST' && !p.match(/\/contacts\/[^/]+$/)) return 'create_contact';
  if (p.match(/\/contacts\/[^/]+$/) && m === 'PUT') return 'update_contact';
  if (p.match(/\/contacts\/[^/]+$/) && m === 'GET') return 'get_contact';
  if (p.includes('/conversations/messages')) return 'send_message';
  if (p.includes('/locations/')) return 'get_location';
  if (p.includes('/contacts/')) return 'contact_api';
  return 'other';
}

export async function logGhlApiCall(args: {
  method: string;
  path: string;
  statusCode?: number;
  durationMs?: number;
  error?: string;
}): Promise<void> {
  try {
    const supabase = createSupabaseServerClient();
    await supabase.from('ghl_api_logs').insert({
      operation: inferGhlApiOperation(args.method, args.path),
      method: args.method.toUpperCase(),
      path: args.path.slice(0, 500),
      status_code: args.statusCode ?? null,
      duration_ms: args.durationMs ?? null,
      error: args.error?.slice(0, 2000) ?? null,
    });
  } catch (e) {
    console.warn('ghl_api_logs insert failed', e);
  }
}

export async function logGhlWorkflowEmit(args: {
  eventType: string;
  workflowKey?: string;
  userId?: string | null;
  email?: string | null;
  success: boolean;
  httpStatus?: number;
  error?: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = createSupabaseServerClient();
    await supabase.from('ghl_workflow_logs').insert({
      event_type: args.eventType,
      workflow_key: args.workflowKey ?? null,
      user_id: args.userId ?? null,
      email: args.email?.toLowerCase() ?? null,
      http_status: args.httpStatus ?? null,
      success: args.success,
      error: args.error?.slice(0, 2000) ?? null,
      payload: args.payload ? (args.payload as object) : null,
    });
  } catch (e) {
    console.warn('ghl_workflow_logs insert failed', e);
  }
}

export async function logGhlSync(args: {
  userId: string;
  email?: string | null;
  status: 'success' | 'failed' | 'skipped';
  contactId?: string | null;
  error?: string;
  trigger?: 'auto' | 'manual' | 'admin';
}): Promise<void> {
  try {
    const supabase = createSupabaseServerClient();
    await supabase.from('ghl_sync_logs').insert({
      user_id: args.userId,
      email: args.email?.toLowerCase() ?? null,
      status: args.status,
      contact_id: args.contactId ?? null,
      error: args.error?.slice(0, 2000) ?? null,
      trigger: args.trigger ?? 'auto',
    });
  } catch (e) {
    console.warn('ghl_sync_logs insert failed', e);
  }
}
