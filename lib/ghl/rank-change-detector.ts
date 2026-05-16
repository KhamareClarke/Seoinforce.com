import { getSiteUrl } from '@/lib/site-url';
import { notifyRankDrop, notifyRankGain } from './event-triggers';

/** Material SERP move (Task 1.3 Workflow 2). */
export const RANK_CHANGE_THRESHOLD = 5;

/**
 * Compare previous vs new Google rank (lower number = better).
 * Fires GHL webhooks + SMS when change ≥ threshold.
 */
export function handleKeywordRankChange(args: {
  userId: string;
  domain: string;
  keyword: string;
  previousRank: number | null | undefined;
  newRank: number | null | undefined;
}): void {
  const prev = args.previousRank;
  const next = args.newRank;
  if (prev == null || next == null || prev === next) return;

  const delta = Math.abs(next - prev);
  if (delta < RANK_CHANGE_THRESHOLD) return;

  const link = `${getSiteUrl()}/audit/dashboard`;
  const base = {
    domain: args.domain,
    keyword: args.keyword,
    positions: delta,
    previousPosition: prev,
    newPosition: next,
    link,
  };

  // Higher rank number = worse position = drop
  if (next > prev) {
    void notifyRankDrop(args.userId, base);
  } else {
    void notifyRankGain(args.userId, base);
  }
}
