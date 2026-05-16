'use client';

import type { CompetitorAnalysisResult } from '@/lib/seo/competitor-analysis';

export function CompetitorIntelligenceSummary({
  analysis,
}: {
  analysis: CompetitorAnalysisResult;
}) {
  const topOpp = analysis.keywordOverlap.opportunities.slice(0, 3);
  const ranks = analysis.rankComparisons.filter((r) => r.leader === 'competitor').slice(0, 3);

  return (
    <div className="mt-3 pt-3 border-t border-yellow-400/10 space-y-2 text-xs">
      <p className="text-yellow-400/90 font-medium">Intelligence</p>
      {topOpp.length > 0 && (
        <p className="text-[#C0C0C0]">
          <span className="text-zinc-500">Keyword gaps: </span>
          {topOpp.map((o) => o.keyword).join(', ')}
        </p>
      )}
      {ranks.length > 0 && (
        <p className="text-[#C0C0C0]">
          <span className="text-zinc-500">They beat you on: </span>
          {ranks
            .map((r) => `"${r.keyword}" (#${r.competitorRank} vs #${r.yourRank ?? '—'})`)
            .join('; ')}
        </p>
      )}
      <p className="text-[#C0C0C0]">
        <span className="text-zinc-500">Backlinks: </span>
        you {analysis.backlinkGaps.yourTotal} · them {analysis.backlinkGaps.competitorTotal}
      </p>
      {analysis.serpFeatures.samples[0] && (
        <p className="text-[#C0C0C0]">
          <span className="text-zinc-500">SERP: </span>
          {analysis.serpFeatures.summary}
        </p>
      )}
    </div>
  );
}
