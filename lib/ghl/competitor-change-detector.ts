import { getSiteUrl } from '@/lib/site-url';
import { notifyCompetitorAlert } from './event-triggers';

/** Task 1.3 Workflow 5 — critical competitor gain (positions improved). */
export const COMPETITOR_CRITICAL_THRESHOLD = 10;

/**
 * Competitor "moved up" = better rank (lower number). `positionsMoved` = oldRank - newRank.
 */
export function handleCompetitorRankImprovement(args: {
  userId: string;
  userDomain: string;
  competitorDomain: string;
  keyword: string;
  previousRank: number | null | undefined;
  newRank: number | null | undefined;
}): void {
  const prev = args.previousRank;
  const next = args.newRank;
  if (prev == null || next == null || next >= prev) return;

  const positionsMoved = prev - next;
  if (positionsMoved < COMPETITOR_CRITICAL_THRESHOLD) return;

  void notifyCompetitorAlert(args.userId, {
    domain: args.userDomain,
    keyword: args.keyword,
    competitorDomain: args.competitorDomain,
    positionsMoved,
    newPosition: next,
    link: `${getSiteUrl()}/audit/dashboard`,
    criticalThreshold: COMPETITOR_CRITICAL_THRESHOLD,
  });
}
