/**
 * Trigger Go High Level **workflows** from the app (Inbound Webhook / Custom Webhook actions).
 *
 * - **A/B email tests** (50/50 subjects, CTAs, send times): configure in **GHL** (Campaigns / Automation
 *   split tests + winner selection). This module only delivers **events + data** so workflows can branch.
 * - Use one URL per workflow (recommended) or a single URL and branch on `event` in GHL.
 */

import { logGhlWorkflowEmit } from './admin-logs';

export type GhlWorkflowEventName =
  | 'audit_completed'
  | 'signup'
  | 'rank_change'
  | 'subscription_updated'
  | 'competitor_movement';

const EVENT_URL_ENV: Record<GhlWorkflowEventName, string> = {
  audit_completed: 'GHL_WEBHOOK_AUDIT_COMPLETED_URL',
  signup: 'GHL_WEBHOOK_SIGNUP_URL',
  rank_change: 'GHL_WEBHOOK_RANK_CHANGE_URL',
  subscription_updated: 'GHL_WEBHOOK_SUBSCRIPTION_URL',
  competitor_movement: 'GHL_WEBHOOK_COMPETITOR_URL',
};

function workflowUrlFor(event: GhlWorkflowEventName): string | null {
  const key = EVENT_URL_ENV[event];
  const specific = (process.env[key] ?? '').trim();
  if (specific) return specific;
  const fallback = (process.env.GHL_WORKFLOW_WEBHOOK_URL ?? '').trim();
  return fallback || null;
}

export async function postGhlWorkflowPayload(
  url: string,
  body: Record<string, unknown>,
  meta?: { workflowKey?: string }
): Promise<boolean> {
  const secret = (process.env.GHL_WORKFLOW_WEBHOOK_SECRET ?? '').trim();
  const eventType = String(body.event ?? 'unknown');
  const userId = typeof body.userId === 'string' ? body.userId : undefined;
  const email = typeof body.email === 'string' ? body.email : undefined;

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (secret) headers['x-seoinforce-workflow-secret'] = secret;
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const text = await res.text().catch(() => '');
    if (!res.ok) {
      console.warn('GHL workflow webhook non-OK:', res.status, text);
      void logGhlWorkflowEmit({
        eventType,
        workflowKey: meta?.workflowKey,
        userId,
        email,
        success: false,
        httpStatus: res.status,
        error: text || `HTTP ${res.status}`,
        payload: body,
      });
      return false;
    }
    void logGhlWorkflowEmit({
      eventType,
      workflowKey: meta?.workflowKey,
      userId,
      email,
      success: true,
      httpStatus: res.status,
      payload: body,
    });
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn('GHL workflow webhook error:', e);
    void logGhlWorkflowEmit({
      eventType,
      workflowKey: meta?.workflowKey,
      userId,
      email,
      success: false,
      error: msg,
      payload: body,
    });
    return false;
  }
}

export async function triggerGhlWorkflow(
  event: GhlWorkflowEventName,
  payload: Record<string, unknown>
): Promise<boolean> {
  const url = workflowUrlFor(event);
  if (!url) return false;
  return postGhlWorkflowPayload(url, {
    event,
    source: 'seoinforce',
    ...payload,
    timestamp: new Date().toISOString(),
  });
}

/** Task 1.3 Workflow 1 — audit completed (SMS/email/tags/timeline in GHL). */
export function emitAuditCompletedWorkflow(payload: {
  userId: string;
  email: string;
  fullName?: string | null;
  planType: string;
  domain: string;
  auditId: string;
  overallScore: number;
  issuesTotal: number;
  issuesCriticalOrHigh: number;
  dashboardUrl: string;
  ghlContactId?: string | null;
}): void {
  const plan = (payload.planType || 'free').toLowerCase();
  const isFreemium = plan === 'free' || plan === 'freemium';
  const criticalIssues = payload.issuesCriticalOrHigh;
  const triggerUpgradeOffer = isFreemium && criticalIssues > 10;

  void triggerGhlWorkflow('audit_completed', {
    ...(payload as unknown as Record<string, unknown>),
    criticalIssues,
    isFreemium,
    triggerUpgradeOffer,
    lastAuditDate: new Date().toISOString().slice(0, 10),
    auditUrl: payload.dashboardUrl,
  });
}

/** Task 1.3 Workflow 3 — new signup (welcome sequence, tags, segments in GHL). */
export function emitSignupWorkflow(payload: {
  userId: string;
  email: string;
  fullName?: string | null;
  accountType?: string | null;
  brandName?: string | null;
  planType: string;
  signupAt: string;
  appBaseUrl: string;
  firstAuditUrl: string;
  verifyEmailUrl?: string;
  ghlContactId?: string | null;
}): void {
  const plan = (payload.planType || 'free').toLowerCase();
  const isFreemium = plan === 'free' || plan === 'freemium';
  const signupDate = payload.signupAt.slice(0, 10);

  void triggerGhlWorkflow('signup', {
    ...(payload as unknown as Record<string, unknown>),
    event: 'signup',
    leadStatus: 'lead',
    isFreemium,
    isPaid: !isFreemium,
    signupDate,
    signupDateTag: `signup_date_${signupDate}`,
    dashboardUrl: payload.firstAuditUrl,
    link: payload.firstAuditUrl,
    companyName: payload.brandName || undefined,
  });
}

export type RankDirection = 'up' | 'down';

const RANK_DIRECTION_URL_ENV: Record<RankDirection, string> = {
  down: 'GHL_WEBHOOK_RANK_DROP_URL',
  up: 'GHL_WEBHOOK_RANK_GAIN_URL',
};

export function rankWorkflowUrlFor(direction: RankDirection): string | null {
  const specific = (process.env[RANK_DIRECTION_URL_ENV[direction]] ?? '').trim();
  if (specific) return specific;
  return workflowUrlFor('rank_change');
}

/** Task 1.3 Workflow 2 — rank moved ≥5 positions; use separate GHL workflows per direction if no Split. */
export function emitRankChangeWorkflow(payload: {
  userId: string;
  email?: string | null;
  direction: RankDirection;
  domain: string;
  keyword: string;
  previousPosition?: number | null;
  newPosition: number;
  deltaPositions?: number;
  dashboardUrl?: string;
}): void {
  const url = rankWorkflowUrlFor(payload.direction);
  if (!url) return;
  const delta = payload.deltaPositions ?? 0;
  void postGhlWorkflowPayload(url, {
    event: 'rank_change',
    source: 'seoinforce',
    ...(payload as unknown as Record<string, unknown>),
    positionsMoved: delta,
    lastRankChangeDate: new Date().toISOString().slice(0, 10),
    timestamp: new Date().toISOString(),
  });
}

export type SubscriptionChangeType = 'upgraded' | 'downgraded' | 'renewed' | 'canceled';

/** Per-type URLs when GHL Split has no conditional mode — one simple workflow per changeType. */
const SUBSCRIPTION_CHANGE_URL_ENV: Record<SubscriptionChangeType, string> = {
  upgraded: 'GHL_WEBHOOK_SUBSCRIPTION_UPGRADED_URL',
  downgraded: 'GHL_WEBHOOK_SUBSCRIPTION_DOWNGRADED_URL',
  renewed: 'GHL_WEBHOOK_SUBSCRIPTION_RENEWED_URL',
  canceled: 'GHL_WEBHOOK_SUBSCRIPTION_CANCELED_URL',
};

export function subscriptionWorkflowUrlFor(changeType: SubscriptionChangeType): string | null {
  const specific = (process.env[SUBSCRIPTION_CHANGE_URL_ENV[changeType]] ?? '').trim();
  if (specific) return specific;
  if (changeType === 'canceled') {
    const down = (process.env.GHL_WEBHOOK_SUBSCRIPTION_DOWNGRADED_URL ?? '').trim();
    if (down) return down;
  }
  return workflowUrlFor('subscription_updated');
}

/** Workflow 4 — subscription upgraded / downgraded / renewed (actions in GHL). */
export function emitSubscriptionUpdatedWorkflow(payload: {
  userId: string;
  email: string;
  fullName?: string | null;
  changeType: SubscriptionChangeType;
  previousPlan: string;
  newPlan: string;
  features?: string;
  nextBillingDate?: string;
  dashboardUrl: string;
  ghlContactId?: string | null;
}): void {
  const url = subscriptionWorkflowUrlFor(payload.changeType);
  if (!url) return;
  const today = new Date().toISOString().slice(0, 10);
  const plan = (payload.newPlan || 'free').toLowerCase();
  void postGhlWorkflowPayload(url, {
    event: 'subscription_updated',
    source: 'seoinforce',
    ...(payload as unknown as Record<string, unknown>),
    link: payload.dashboardUrl,
    planTag: `plan_${plan}`,
    subscriptionStatus:
      payload.changeType === 'downgraded' || payload.changeType === 'canceled'
        ? 'churned'
        : 'active',
    upgradeDate: payload.changeType === 'upgraded' ? today : undefined,
    churnDate:
      payload.changeType === 'downgraded' || payload.changeType === 'canceled' ? today : undefined,
    renewalDate: payload.changeType === 'renewed' ? today : undefined,
    timestamp: new Date().toISOString(),
  });
}

/** Workflow 5 — competitor movement on a tracked keyword. */
export function emitCompetitorMovementWorkflow(payload: {
  userId: string;
  email?: string | null;
  domain: string;
  keyword: string;
  competitorDomain?: string;
  positionsMoved: number;
  newPosition?: number;
  critical: boolean;
  dashboardUrl: string;
}): void {
  void triggerGhlWorkflow('competitor_movement', {
    ...(payload as unknown as Record<string, unknown>),
    link: payload.dashboardUrl,
    lastCompetitorAlert: new Date().toISOString().slice(0, 10),
  });
}
