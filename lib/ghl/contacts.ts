import { makeGhlRequest } from './client';
import type { GhlClientConfig } from './client';
import { getGhlClientConfig } from './client';

export type GhlContactInput = {
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phone?: string | null;
  companyName?: string | null;
  tags?: string[];
  source?: string;
  /** GHL location custom field definitions (id from GHL builder) */
  customFields?: Array<{ id: string; value: string | number | boolean }>;
};

function splitName(fullName?: string | null): { firstName?: string; lastName?: string } {
  if (!fullName?.trim()) return {};
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/** GET /contacts/search/duplicate */
export async function findDuplicateContactByEmail(
  email: string,
  cfg?: GhlClientConfig
): Promise<string | null> {
  const c = cfg ?? getGhlClientConfig();
  if (!c) return null;
  const params = new URLSearchParams({
    locationId: c.locationId,
    email: email.toLowerCase(),
  });
  const data = await makeGhlRequest<Record<string, unknown>>(
    `/contacts/search/duplicate?${params.toString()}`,
    { method: 'GET' }
  );
  const contact = data.contact as Record<string, unknown> | undefined;
  const id =
    (contact?.id as string | undefined) ||
    (data.id as string | undefined) ||
    (data.contactId as string | undefined);
  return id ?? null;
}

/** POST /contacts/ */
export async function createGhlContact(
  input: GhlContactInput,
  cfg?: GhlClientConfig
): Promise<string> {
  const c = cfg ?? getGhlClientConfig();
  if (!c) throw new Error('GHL not configured');
  const { firstName, lastName } = splitName(input.name);
  const body: Record<string, unknown> = {
    locationId: c.locationId,
    firstName: input.firstName ?? firstName,
    lastName: input.lastName ?? lastName,
    email: input.email.toLowerCase(),
    source: input.source ?? 'SEOInForce',
  };
  if (input.phone) body.phone = input.phone;
  if (input.companyName) body.companyName = input.companyName;
  if (input.tags?.length) body.tags = input.tags;
  if (input.customFields?.length) body.customFields = input.customFields;

  const data = await makeGhlRequest<Record<string, unknown>>('/contacts/', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const contact = data.contact as Record<string, unknown> | undefined;
  const id = (contact?.id as string) || (data.id as string) || (data.contactId as string);
  if (!id) throw new Error('GHL create contact: missing id in response');
  return id;
}

/** PUT /contacts/:id */
export async function updateGhlContact(
  contactId: string,
  patch: Partial<GhlContactInput>,
  cfg?: GhlClientConfig
): Promise<void> {
  const c = cfg ?? getGhlClientConfig();
  if (!c) throw new Error('GHL not configured');
  const body: Record<string, unknown> = { locationId: c.locationId };
  if (patch.email) body.email = patch.email.toLowerCase();
  if (patch.phone !== undefined) body.phone = patch.phone || undefined;
  if (patch.companyName !== undefined) body.companyName = patch.companyName || undefined;
  if (patch.tags?.length) body.tags = patch.tags;
  if (patch.name) {
    const s = splitName(patch.name);
    body.firstName = patch.firstName ?? s.firstName;
    body.lastName = patch.lastName ?? s.lastName;
  } else {
    if (patch.firstName) body.firstName = patch.firstName;
    if (patch.lastName) body.lastName = patch.lastName;
  }
  if (patch.customFields?.length) body.customFields = patch.customFields;
  await makeGhlRequest(`/contacts/${contactId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/** GET /contacts/:id */
export async function getGhlContact(
  contactId: string,
  cfg?: GhlClientConfig
): Promise<Record<string, unknown> | null> {
  const c = cfg ?? getGhlClientConfig();
  if (!c) return null;
  try {
    const params = new URLSearchParams({ locationId: c.locationId });
    const data = await makeGhlRequest<Record<string, unknown>>(
      `/contacts/${contactId}?${params.toString()}`,
      { method: 'GET' }
    );
    const contact = data.contact as Record<string, unknown> | undefined;
    if (contact) return contact;
    if (typeof data.id === 'string') return data;
    return null;
  } catch {
    return null;
  }
}

/**
 * POST /contacts/upsert — same pattern as myapproved.com & alkhemmy.com (recommended for SMS).
 */
export async function upsertGhlContactApi(
  input: GhlContactInput & { phone?: string | null },
  cfg?: GhlClientConfig
): Promise<string> {
  const c = cfg ?? getGhlClientConfig();
  if (!c) throw new Error('GHL not configured');
  const { firstName, lastName } = splitName(input.name);
  const body: Record<string, unknown> = {
    locationId: c.locationId,
    email: input.email.toLowerCase(),
    firstName: input.firstName ?? firstName,
    lastName: input.lastName ?? lastName,
    source: input.source ?? 'SEOInForce',
  };
  if (input.phone) body.phone = input.phone;
  if (input.companyName) body.companyName = input.companyName;
  if (input.tags?.length) body.tags = input.tags;
  if (input.customFields?.length) body.customFields = input.customFields;

  const data = await makeGhlRequest<Record<string, unknown>>('/contacts/upsert', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const contact = data.contact as Record<string, unknown> | undefined;
  const id = (contact?.id as string) || (data.id as string) || (data.contactId as string);
  if (!id) throw new Error('GHL upsert contact: missing id in response');
  return id;
}

/** Phone-only upsert (myapproved SMS flow). */
export async function upsertGhlContactByPhone(
  phone: string,
  opts?: { name?: string; email?: string },
  cfg?: GhlClientConfig
): Promise<string> {
  const c = cfg ?? getGhlClientConfig();
  if (!c) throw new Error('GHL not configured');
  const body: Record<string, unknown> = {
    locationId: c.locationId,
    phone,
    source: 'SEOInForce',
  };
  if (opts?.name) {
    const { firstName, lastName } = splitName(opts.name);
    body.firstName = firstName;
    body.lastName = lastName;
  }
  if (opts?.email) body.email = opts.email.toLowerCase();

  const data = await makeGhlRequest<Record<string, unknown>>('/contacts/upsert', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const contact = data.contact as Record<string, unknown> | undefined;
  const id = (contact?.id as string) || (data.id as string);
  if (!id) throw new Error('GHL upsert by phone: missing id');
  return id;
}

/**
 * Create or update contact in GHL; returns contact id.
 * Prefers /contacts/upsert when email is present (myapproved pattern).
 */
export async function upsertGhlContact(input: GhlContactInput): Promise<string> {
  try {
    return await upsertGhlContactApi(input);
  } catch {
    const existing = await findDuplicateContactByEmail(input.email);
    if (existing) {
      await updateGhlContact(existing, input);
      return existing;
    }
    return createGhlContact(input);
  }
}
