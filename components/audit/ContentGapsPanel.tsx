'use client';

import type { ContentOptimizeResult } from '@/lib/seo/content-optimizer';

export function ContentGapsPanel({ result }: { result: ContentOptimizeResult }) {
  const gaps = result.contentGaps;
  const cluster = result.topicCluster;

  return (
    <div className="mt-4 rounded-xl border border-yellow-400/20 bg-black/40 p-4 space-y-3">
      <h4 className="text-sm font-semibold text-yellow-400">Content gaps & topic cluster</h4>
      {gaps.topRecommendation && (
        <p className="text-xs text-[#C0C0C0]">
          <span className="text-zinc-500">Top tip: </span>
          {gaps.topRecommendation}
        </p>
      )}
      {gaps.yourMissingTopics.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-1">Topics to add</p>
          <ul className="text-xs text-[#C0C0C0] list-disc pl-4">
            {gaps.yourMissingTopics.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      )}
      {gaps.topicsCompetitorsCover.length > 0 && (
        <p className="text-xs text-[#C0C0C0]">
          <span className="text-zinc-500">Competitors cover: </span>
          {gaps.topicsCompetitorsCover.join(', ')}
        </p>
      )}
      <div className="pt-2 border-t border-yellow-400/10">
        <p className="text-xs text-yellow-400/90">Pillar: {cluster.pillarTopic}</p>
        {cluster.suggestedClusters.length > 0 && (
          <p className="text-xs text-[#C0C0C0] mt-1">
            Cluster pages: {cluster.suggestedClusters.join(' · ')}
          </p>
        )}
        <p className="text-xs text-zinc-500 mt-1">{cluster.internalLinkingNote}</p>
      </div>
    </div>
  );
}
