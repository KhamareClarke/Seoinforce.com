'use client';

import type { TechnicalDeepResult } from '@/lib/seo/technical-deep';

export function TechnicalDeepPanel({ deep }: { deep?: TechnicalDeepResult | null }) {
  if (!deep) return null;

  return (
    <div className="mt-4 rounded-xl border border-yellow-400/20 bg-black/40 p-4">
      <h4 className="text-sm font-semibold text-yellow-400 mb-3">Deep technical SEO</h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-[#C0C0C0] mb-4">
        <div>
          <span className="text-zinc-500 block">Redirects</span>
          {deep.redirectChainLength}
        </div>
        <div>
          <span className="text-zinc-500 block">Mixed content</span>
          {deep.mixedContentCount}
        </div>
        <div>
          <span className="text-zinc-500 block">Internal paths</span>
          {deep.uniqueInternalPaths}
        </div>
        <div>
          <span className="text-zinc-500 block">Est. crawlable</span>
          ~{deep.estimatedCrawlablePages}
        </div>
      </div>
      <ul className="space-y-2">
        {deep.checks.map((c) => (
          <li
            key={c.id}
            className={`text-xs flex gap-2 ${c.pass ? 'text-green-400/90' : 'text-amber-400/90'}`}
          >
            <span>{c.pass ? '✓' : '○'}</span>
            <span>
              {c.label}: {c.detail}
              {c.fix && <span className="block text-zinc-500 mt-0.5">{c.fix}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
