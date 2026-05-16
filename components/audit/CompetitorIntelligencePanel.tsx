'use client';

import type { CompetitorAnalysisResult } from '@/lib/seo/competitor-analysis';
import { CompetitorIntelligenceSummary } from './CompetitorIntelligenceSummary';

export function CompetitorIntelligencePanel({
  analysis,
  competitorDomain,
}: {
  analysis: CompetitorAnalysisResult;
  competitorDomain?: string;
}) {
  const opp = analysis.keywordOverlap.opportunities.slice(0, 8);
  const shared = analysis.keywordOverlap.shared.slice(0, 5);
  const targets = analysis.backlinkGaps.recommendedTargets.slice(0, 6);

  return (
    <div className="mt-4 space-y-4 rounded-xl border border-yellow-400/20 bg-black/40 p-4">
      <h4 className="text-sm font-semibold text-yellow-400">
        Full intelligence {competitorDomain ? `· ${competitorDomain}` : ''}
      </h4>
      <CompetitorIntelligenceSummary analysis={analysis} />

      <section>
        <p className="text-xs font-medium text-zinc-400 mb-2">Keyword gaps</p>
        {opp.length === 0 ? (
          <p className="text-xs text-[#C0C0C0]">No gap keywords identified yet.</p>
        ) : (
          <ul className="space-y-1 text-xs text-[#C0C0C0]">
            {opp.map((o) => (
              <li key={o.keyword} className="flex justify-between gap-2">
                <span className="text-yellow-400/90">{o.keyword}</span>
                <span>score {o.opportunityScore} · you #{o.yourRank ?? '—'} · them #{o.competitorRank ?? '—'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <p className="text-xs font-medium text-zinc-400 mb-2">Rank comparison</p>
        <ul className="space-y-1 text-xs text-[#C0C0C0] max-h-32 overflow-y-auto">
          {analysis.rankComparisons.slice(0, 10).map((r) => (
            <li key={r.keyword}>
              {r.keyword}: you #{r.yourRank ?? '—'} vs #{r.competitorRank ?? '—'}{' '}
              {r.leader === 'you' ? '✓ leading' : r.leader === 'competitor' ? '↓ behind' : ''}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <p className="text-xs font-medium text-zinc-400 mb-2">SERP features</p>
        <p className="text-xs text-[#C0C0C0]">{analysis.serpFeatures.summary}</p>
        {analysis.serpFeatures.samples.slice(0, 3).map((s) => (
          <p key={s.keyword} className="text-xs text-zinc-500 mt-1">
            {s.keyword}: snippet {s.hasFeaturedSnippet ? 'yes' : 'no'} · PAA {s.hasPeopleAlsoAsk ? 'yes' : 'no'}
          </p>
        ))}
      </section>

      <section>
        <p className="text-xs font-medium text-zinc-400 mb-2">Backlink & outreach targets</p>
        <p className="text-xs text-[#C0C0C0] mb-1">{analysis.backlinkGaps.note}</p>
        <ul className="space-y-1 text-xs text-[#C0C0C0]">
          {targets.map((t) => (
            <li key={t.domain}>
              <span className="text-yellow-400/80">{t.domain}</span> — {t.reason}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <p className="text-xs font-medium text-zinc-400 mb-2">Content strategy</p>
        {analysis.contentStrategy.topics.length > 0 && (
          <p className="text-xs text-[#C0C0C0]">
            Topics: {analysis.contentStrategy.topics.slice(0, 5).join(', ')}
          </p>
        )}
        {analysis.contentStrategy.contentGaps.length > 0 && (
          <p className="text-xs text-[#C0C0C0] mt-1">
            Gaps: {analysis.contentStrategy.contentGaps.slice(0, 4).join('; ')}
          </p>
        )}
        {shared.length > 0 && (
          <p className="text-xs text-zinc-500 mt-1">
            Shared keywords: {shared.map((s) => s.keyword).join(', ')}
          </p>
        )}
      </section>
    </div>
  );
}
