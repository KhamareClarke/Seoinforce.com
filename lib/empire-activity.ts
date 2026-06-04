/**
 * Send end-user activity events to the Empire hub (khamareclarke.com).
 * No-op when EMPIRE_HUB_URL or EMPIRE_INGEST_SECRET is missing, so this is
 * safe to call from every auth/api route without breaking local dev.
 *
 * Hub endpoint: POST {EMPIRE_HUB_URL}/api/empire/activity/ingest
 *   Authorization: Bearer {EMPIRE_INGEST_SECRET}
 *
 * Always call as `void emitEmpireActivity(...)` to avoid blocking the request.
 */
import type { NextRequest } from 'next/server';

export type EmpireEventType =
  | 'signin'
  | 'signin_failed'
  | 'signup'
  | 'signup_failed'
  | 'verify_email'
  | 'password_reset_request'
  | 'password_reset_complete'
  | 'project_created'
  | 'audit_started'
  | 'audit_completed'
  | 'audit_failed'
  | 'payment_succeeded'
  | 'payment_failed'
  | 'subscription_created'
  | 'subscription_cancelled'
  | 'lead_created'
  | 'logout'
  | 'custom';

export interface EmpireActivityInput {
  event_type: EmpireEventType;
  status?: 'ok' | 'failed' | 'pending';
  user_email?: string | null;
  user_id?: string | null;
  user_name?: string | null;
  source?: string;
  message?: string;
  metadata?: Record<string, unknown>;
  /** Optional request to derive IP + user-agent automatically. */
  request?: NextRequest;
}

const PROJECT_ID = process.env.EMPIRE_PROJECT_ID || 'seoinforce';

function clientIp(request?: NextRequest): string | null {
  if (!request) return null;
  const xf = request.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0]?.trim() || null;
  return request.headers.get('x-real-ip') || null;
}

function hubUrl(): string | null {
  const raw = (process.env.EMPIRE_HUB_URL || '').trim();
  if (!raw) return null;
  return raw.replace(/\/$/, '');
}

export async function emitEmpireActivity(input: EmpireActivityInput): Promise<void> {
  try {
    const url = hubUrl();
    const secret = process.env.EMPIRE_INGEST_SECRET;
    if (!url || !secret) return;

    const body = {
      project_id: PROJECT_ID,
      event_type: input.event_type,
      status: input.status || (input.event_type.endsWith('_failed') ? 'failed' : 'ok'),
      user_email: input.user_email ?? null,
      user_id: input.user_id ?? null,
      user_name: input.user_name ?? null,
      source: input.source || 'web',
      message: input.message,
      metadata: input.metadata || {},
      ip: clientIp(input.request),
      user_agent: input.request?.headers.get('user-agent') || null,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    await fetch(`${url}/api/empire/activity/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    }).catch(() => undefined);

    clearTimeout(timeout);
  } catch {
    // Swallow errors — Empire activity is best-effort telemetry, not critical.
  }
}
