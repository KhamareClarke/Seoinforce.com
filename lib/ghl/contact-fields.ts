import type { GhlContactInput } from './contacts';

export type UserGhlSyncRow = {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  plan_type: string | null;
  ghl_contact_id: string | null;
  audit_count: number | null;
  sms_notification_scope: string | null;
  account_type: string | null;
  brand_name: string | null;
  is_admin: boolean | null;
  last_active_at: string | null;
};

function envFieldId(key: string): string | null {
  const v = process.env[key]?.trim();
  return v || null;
}

/** Optional GHL custom field IDs — set in .env after creating fields in GHL. */
export function buildGhlContactCustomFields(u: UserGhlSyncRow): GhlContactInput['customFields'] {
  const fields: NonNullable<GhlContactInput['customFields']> = [];

  const lastActiveId = envFieldId('GHL_CUSTOM_FIELD_LAST_ACTIVE_ID');
  if (lastActiveId && u.last_active_at) {
    fields.push({ id: lastActiveId, value: u.last_active_at });
  }

  const planId = envFieldId('GHL_CUSTOM_FIELD_PLAN_TYPE_ID');
  if (planId) fields.push({ id: planId, value: u.plan_type || 'free' });

  const auditsId = envFieldId('GHL_CUSTOM_FIELD_AUDIT_COUNT_ID');
  if (auditsId) fields.push({ id: auditsId, value: String(u.audit_count ?? 0) });

  const roleId = envFieldId('GHL_CUSTOM_FIELD_USER_ROLE_ID');
  if (roleId) {
    const role = u.is_admin ? 'admin' : u.account_type || 'user';
    fields.push({ id: roleId, value: role });
  }

  const companyId = envFieldId('GHL_CUSTOM_FIELD_COMPANY_ID');
  if (companyId) {
    const company =
      u.account_type === 'brand' && u.brand_name ? u.brand_name : u.company_name || '';
    if (company) fields.push({ id: companyId, value: company });
  }

  return fields.length ? fields : undefined;
}

export function splitFullName(fullName: string | null | undefined): {
  firstName?: string;
  lastName?: string;
} {
  if (!fullName?.trim()) return {};
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}
