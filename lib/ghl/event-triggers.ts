import { createSupabaseServerClient } from '@/lib/supabase/client';
import { sendSmsForUserEvent } from './sms';
import type { GhlSmsTemplateVars } from './sms';
import { emitRankChangeWorkflow, emitCompetitorMovementWorkflow } from './workflow-triggers';
import { getSiteUrl } from '@/lib/site-url';

async function userEmailForWorkflow(userId: string): Promise<string | undefined> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from('users').select('email').eq('id', userId).maybeSingle();
  return data?.email?.trim() || undefined;
}

function emitRankChangeForUser(
  userId: string,
  direction: 'up' | 'down',
  payload: Omit<Parameters<typeof emitRankChangeWorkflow>[0], 'userId' | 'direction' | 'email'>
) {
  void (async () => {
    const email = await userEmailForWorkflow(userId);
    emitRankChangeWorkflow({
      userId,
      email,
      direction,
      ...payload,
    });
  })();
}

/** Call from rank-tracking jobs when you detect a SERP change. */
export function notifyRankDrop(
  userId: string,
  vars: Pick<GhlSmsTemplateVars, 'domain' | 'keyword' | 'link'> & { positions: number; previousPosition?: number | null; newPosition?: number }
) {
  emitRankChangeForUser(userId, 'down', {
    domain: vars.domain ?? '',
    keyword: vars.keyword ?? '',
    previousPosition: vars.previousPosition ?? null,
    newPosition: vars.newPosition ?? 100,
    deltaPositions: typeof vars.positions === 'number' ? vars.positions : Number(vars.positions),
    dashboardUrl: vars.link ?? `${getSiteUrl()}/audit/dashboard`,
  });
  return sendSmsForUserEvent({
    userId,
    event: 'rank_drop',
    vars: {
      ...vars,
      positions: vars.positions,
      newPosition: vars.newPosition ?? '—',
    },
  });
}

/** Call from rank-tracking jobs when position improves. */
export function notifyRankGain(
  userId: string,
  vars: Pick<GhlSmsTemplateVars, 'domain' | 'keyword'> & { positions: number; previousPosition?: number | null; newPosition?: number }
) {
  emitRankChangeForUser(userId, 'up', {
    domain: vars.domain ?? '',
    keyword: vars.keyword ?? '',
    previousPosition: vars.previousPosition ?? null,
    newPosition: vars.newPosition ?? 1,
    deltaPositions: typeof vars.positions === 'number' ? vars.positions : Number(vars.positions),
    dashboardUrl: `${getSiteUrl()}/audit/dashboard`,
  });
  return sendSmsForUserEvent({
    userId,
    event: 'rank_gain',
    vars: {
      ...vars,
      positions: vars.positions,
      newPosition: vars.newPosition ?? '—',
    },
  });
}
/** Call when a competitor gains ≥ threshold positions on a tracked keyword. */
export function notifyCompetitorAlert(
  userId: string,
  vars: Pick<GhlSmsTemplateVars, 'keyword' | 'link' | 'domain'> & {
    positionsMoved?: number;
    competitorDomain?: string;
    newPosition?: number;
    criticalThreshold?: number;
  }
) {
  const moved = vars.positionsMoved ?? 1;
  const threshold = vars.criticalThreshold ?? 10;
  const critical = moved >= threshold;

  void (async () => {
    const email = await userEmailForWorkflow(userId);
    emitCompetitorMovementWorkflow({
      userId,
      email,
      domain: vars.domain ?? '',
    keyword: vars.keyword ?? '',
    competitorDomain: vars.competitorDomain,
    positionsMoved: moved,
    newPosition: vars.newPosition,
    critical,
    dashboardUrl: vars.link ?? `${getSiteUrl()}/audit/dashboard`,
    });
  })();

  if (!critical) {
    return { ok: false, skipped: 'below critical threshold' } as const;
  }

  return sendSmsForUserEvent({
    userId,
    event: 'competitor_alert',
    vars,
  });
}
