'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp } from 'lucide-react';
import type { AdvancedRankReport } from '@/lib/seo/rank-advanced';

export function RankAdvancedPanel({ projectId }: { projectId: string | null }) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AdvancedRankReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/rankings/advanced?project_id=${projectId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setReport(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  if (!projectId) return null;

  return (
    <div className="mt-6 rounded-xl border border-yellow-400/20 bg-black/40 p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-yellow-400" />
          <h4 className="text-sm font-semibold text-yellow-400">Advanced rank tracking</h4>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={load}
          disabled={loading}
          className="bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Refresh SERP & volatility'}
        </Button>
      </div>
      {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
      {report && (
        <div className="space-y-3 text-xs text-[#C0C0C0]">
          <p>
            {report.summary.keywordsTracked} keywords · avg volatility {report.summary.avgVolatility} ·{' '}
            {report.summary.serpFeatureHits} with SERP features
          </p>
          <div>
            <p className="text-zinc-500 mb-1">Volatility</p>
            {report.volatility.slice(0, 6).map((v) => (
              <p key={v.keywordId}>
                {v.keyword}: {v.label} ({v.volatilityScore}) · {v.changeCount30d} changes
              </p>
            ))}
          </div>
          <div>
            <p className="text-zinc-500 mb-1">SERP & device</p>
            {report.serp.slice(0, 6).map((s) => (
              <p key={s.keywordId}>
                {s.keyword}: desktop #{s.desktopPosition ?? '—'} · mobile #{s.mobilePosition ?? '—'}
                {s.features.featuredSnippet ? ' · snippet' : ''}
                {s.features.peopleAlsoAsk ? ' · PAA' : ''}
              </p>
            ))}
          </div>
        </div>
      )}
      {!report && !loading && (
        <p className="text-xs text-zinc-500">Uses SERPAPI_KEY when set. Tracks volatility from rank history.</p>
      )}
    </div>
  );
}
