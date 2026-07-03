'use client';

import { useState } from 'react';
import type { AIVisibilityResult } from '@/lib/seo/ai-visibility';

const LEVEL_COLORS: Record<string, string> = {
  dominant: '#22c55e',
  high: '#84cc16',
  moderate: '#eab308',
  low: '#f97316',
  not_visible: '#ef4444',
};

const LEVEL_LABELS: Record<string, string> = {
  dominant: 'Dominant',
  high: 'High',
  moderate: 'Moderate',
  low: 'Low',
  not_visible: 'Not Visible',
};

const PLATFORM_ICONS: Record<string, string> = {
  chatgpt: 'C',
  gemini: 'G',
  perplexity: 'P',
};

const VISIBILITY_COLORS: Record<string, string> = {
  high: '#22c55e',
  moderate: '#eab308',
  low: '#f97316',
  not_visible: '#ef4444',
};

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;

  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#1e1e22" strokeWidth="10" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`}
        strokeDashoffset={circ / 4}
        style={{ filter: `drop-shadow(0 0 8px ${color}88)` }}
      />
      <text x="50" y="55" textAnchor="middle" fill={color} fontSize="20" fontWeight="bold">
        {score}
      </text>
    </svg>
  );
}

function Signal({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-black"
        style={{ background: active ? '#FFD70022' : '#ffffff08', border: `1px solid ${active ? '#FFD700' : '#ffffff14'}`, color: active ? '#FFD700' : '#ffffff28' }}
      >
        {active ? '✓' : '○'}
      </span>
      <span className="text-[12px]" style={{ color: active ? '#ffffff70' : '#ffffff28' }}>{label}</span>
    </div>
  );
}

export function AIVisibilityPanel({ domain }: { domain: string }) {
  const [result, setResult] = useState<AIVisibilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Check failed');
      setResult(data.result);
      setExpanded(true);
    } catch (e: any) {
      setError(e.message || 'Failed to check AI visibility');
    } finally {
      setLoading(false);
    }
  };

  const color = result ? LEVEL_COLORS[result.visibility_level] : '#FFD700';

  return (
    <div className="mt-4 rounded-xl border border-[#FFD700]/20 bg-black/40 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/25 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-[#FFD700]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-[#FFD700]">AI Visibility Score</h4>
            <p className="text-[11px] text-white/30">How often AI tools surface your brand</p>
          </div>
        </div>
        {!result && (
          <button
            onClick={run}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-[12px] font-bold uppercase tracking-wide bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/20 disabled:opacity-40 transition-all duration-150"
          >
            {loading ? 'Checking…' : 'Run Check'}
          </button>
        )}
        {result && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-[11px] text-white/30 hover:text-white/60 transition-colors"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="px-5 pb-5 flex items-center gap-3 text-[13px] text-white/40">
          <div className="w-4 h-4 border-2 border-[#FFD700]/40 border-t-[#FFD700] rounded-full animate-spin" />
          Analysing AI visibility signals…
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="px-5 pb-4 text-[12px] text-red-400/70">{error}</div>
      )}

      {/* Results */}
      {result && expanded && (
        <div className="px-5 pb-5 border-t border-white/[0.06] pt-4 space-y-5">

          {/* Score + platforms row */}
          <div className="flex flex-wrap gap-6 items-start">
            {/* Ring */}
            <div className="flex flex-col items-center gap-1">
              <ScoreRing score={result.score} color={color} />
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color }}>
                {LEVEL_LABELS[result.visibility_level]}
              </span>
              <span className="text-[10px] text-white/25">{result.mode === 'simulated' ? 'AI-simulated' : 'Signal-based'}</span>
            </div>

            {/* Platform estimates */}
            <div className="flex-1 min-w-[180px] space-y-2.5">
              <p className="text-[11px] text-white/35 font-semibold uppercase tracking-wider mb-3">Platform Estimates</p>
              {(['chatgpt', 'gemini', 'perplexity'] as const).map(platform => {
                const est = result.platform_estimates[platform];
                const estColor = VISIBILITY_COLORS[est.estimated_visibility];
                return (
                  <div key={platform} className="flex items-center gap-2.5">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-black flex-shrink-0"
                      style={{ background: '#ffffff08', border: '1px solid #ffffff14', color: '#ffffff50' }}
                    >
                      {PLATFORM_ICONS[platform]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[12px] font-semibold capitalize" style={{ color: estColor }}>
                          {est.estimated_visibility.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/28 leading-tight">{est.basis}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Signals grid */}
          <div>
            <p className="text-[11px] text-white/35 font-semibold uppercase tracking-wider mb-3">AIO Signals</p>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
              <Signal label="Organization schema" active={result.signals.has_organization_schema} />
              <Signal label="FAQ schema" active={result.signals.has_faq_schema} />
              <Signal label="Article / HowTo schema" active={result.signals.has_article_schema} />
              <Signal label="SameAs entity links" active={result.signals.has_same_as_links} />
              <Signal label="Consistent brand name" active={result.signals.has_consistent_brand} />
              <Signal label="Author / founder info" active={result.signals.has_author_info} />
              <Signal label="About page" active={result.signals.has_about_page} />
              <Signal label={`Content depth (${result.signals.content_depth_score}/100)`} active={result.signals.content_depth_score >= 50} />
            </div>
          </div>

          {/* Query results (simulated mode) */}
          {result.query_results && result.query_results.length > 0 && (
            <div>
              <p className="text-[11px] text-white/35 font-semibold uppercase tracking-wider mb-3">Simulated Queries</p>
              <div className="space-y-2">
                {result.query_results.map((q, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="mt-0.5 text-[11px] flex-shrink-0" style={{ color: q.mentioned ? '#22c55e' : '#ffffff25' }}>
                      {q.mentioned ? '✓' : '○'}
                    </span>
                    <div>
                      <p className="text-[12px] text-white/55">{q.query}</p>
                      {q.context && (
                        <p className="text-[11px] text-white/30 mt-0.5 italic">"{q.context}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div>
              <p className="text-[11px] text-white/35 font-semibold uppercase tracking-wider mb-3">Recommendations</p>
              <ul className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex gap-2 text-[12px] text-white/50 leading-[1.6]">
                    <span className="text-[#FFD700]/60 flex-shrink-0 mt-0.5">→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={run}
            disabled={loading}
            className="text-[11px] text-[#FFD700]/50 hover:text-[#FFD700]/80 transition-colors"
          >
            Re-run check
          </button>
        </div>
      )}
    </div>
  );
}
