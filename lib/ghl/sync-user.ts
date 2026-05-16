import { createSupabaseServerClient } from '@/lib/supabase/client';
import { upsertGhlContact, updateGhlContact } from './contacts';
import { isGhlConfigured } from './client';
import type { GhlContactInput } from './contacts';
import {
  buildGhlContactCustomFields,
  splitFullName,
  type UserGhlSyncRow,
} from './contact-fields';
import { logGhlSync } from './admin-logs';

export type { UserGhlSyncRow };

function buildTags(u: UserGhlSyncRow): string[] {
  const scope = u.sms_notification_scope || 'none';
  const tags = [
    'seoinforce',
    `plan-${u.plan_type || 'free'}`,
    `seo-audits-${u.audit_count ?? 0}`,
    scope === 'none' ? 'sms-opt-out' : 'sms-opt-in',
    scope === 'critical' ? 'sms-critical-only' : scope === 'all' ? 'sms-all' : 'sms-none',
    u.is_admin ? 'role-admin' : 'role-user',
  ];
  if (u.account_type) tags.push(`account-${u.account_type}`);
  if (u.last_active_at) {
    const d = new Date(u.last_active_at);
    if (!Number.isNaN(d.getTime())) tags.push(`last-active-${d.toISOString().slice(0, 10)}`);
  }
  return tags;
}

/**
 * Upserts the user into GHL and persists ghl_contact_id on public.users.
 */
export async function syncUserToGhlById(
  userId: string,
  options?: { trigger?: 'auto' | 'manual' | 'admin' }
): Promise<string | null> {
  const trigger = options?.trigger ?? 'auto';
  if (!isGhlConfigured()) return null;

  const supabase = createSupabaseServerClient();
  const { data: u, error } = await supabase
    .from('users')
    .select(
      'id,email,full_name,company_name,phone,plan_type,ghl_contact_id,audit_count,sms_notification_scope,account_type,brand_name,is_admin,last_active_at'
    )
    .eq('id', userId)
    .single();

  if (error || !u) {
    console.warn('syncUserToGhlById: user not found', error?.message);
    void logGhlSync({
      userId,
      status: 'skipped',
      error: error?.message ?? 'User not found',
      trigger,
    });
    return null;
  }

  const row = u as UserGhlSyncRow;
  const companyName =
    row.account_type === 'brand' && row.brand_name ? row.brand_name : row.company_name;

  const { firstName, lastName } = splitFullName(row.full_name);
  const customFields = buildGhlContactCustomFields(row);

  const payload: GhlContactInput = {
    firstName,
    lastName,
    name: row.full_name || row.email.split('@')[0],
    email: row.email,
    phone: row.phone || undefined,
    companyName: companyName || undefined,
    tags: buildTags(row),
    source: 'SEOInForce',
    ...(customFields?.length ? { customFields } : {}),
  };

  try {
    let contactId = row.ghl_contact_id;
    if (contactId) {
      try {
        await updateGhlContact(contactId, payload);
      } catch (e) {
        console.warn('syncUserToGhlById: update failed, re-upserting by email', e);
        contactId = null;
      }
    }
    if (!contactId) {
      contactId = await upsertGhlContact(payload);
    }

    await supabase
      .from('users')
      .update({ ghl_contact_id: contactId, updated_at: new Date().toISOString() })
      .eq('id', userId);

    void logGhlSync({
      userId,
      email: row.email,
      status: 'success',
      contactId,
      trigger,
    });
    return contactId;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('syncUserToGhlById failed', e);
    void logGhlSync({
      userId,
      email: row.email,
      status: 'failed',
      error: msg,
      trigger,
    });
    return null;
  }
}
