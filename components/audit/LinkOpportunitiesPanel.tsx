'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Link2 } from 'lucide-react';
import type { LinkOpportunityReport } from '@/lib/seo/link-opportunities';

export function LinkOpportunitiesPanel({
  projectId,
  competitorDomain,
}: {
  projectId: string | null;
  competitorDomain?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<LinkOpportunityReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/links/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, competitorDomain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setReport(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  if (!projectId) return null;

  return (
    <div className="mt-6 rounded-xl border border-yellow-400/20 bg-black/40 p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-yellow-400" />
          <h4 className="text-sm font-semibold text-yellow-400">Link building opportunities</h4>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={load}
          disabled={loading}
          className="bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Find opportunities'}
        </Button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {report && (
        <div className="space-y-2 text-xs text-[#C0C0C0]">
          <p>
            {report.summary.total} targets · {report.summary.highPriority} high priority · you{' '}
            {report.summary.yourBacklinks} vs competitor {report.summary.competitorBacklinks} backlinks
          </p>
          {report.opportunities.slice(0, 8).map((o) => (
            <div key={`${o.type}-${o.domain}`} className="border border-yellow-400/10 rounded p-2">
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setExpanded(expanded === o.domain ? null : o.domain)}
              >
                <span className="text-yellow-400/90">{o.domain}</span> · score {o.score} · {o.type}
                <p className="text-zinc-500 mt-0.5">{o.reason}</p>
              </button>
              {expanded === o.domain && (
                <div className="mt-2 pt-2 border-t border-yellow-400/10">
                  <p className="text-zinc-400">Subject: {o.emailSubject}</p>
                  <pre className="mt-1 whitespace-pre-wrap text-[10px] text-zinc-500">{o.emailBody}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
