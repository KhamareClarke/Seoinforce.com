'use client';

import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import type { ContentChecklistResult } from '@/lib/seo/content-checklist';

function StatusIcon({ status }: { status: 'completed' | 'needs_work' | 'not_done' }) {
  if (status === 'completed') return <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />;
  if (status === 'needs_work') return <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />;
  return <XCircle className="h-4 w-4 text-red-400 shrink-0" />;
}

function ItemList({
  title,
  items,
  tone,
}: {
  title: string;
  items: ContentChecklistResult['completed'];
  tone: 'emerald' | 'amber' | 'red';
}) {
  if (items.length === 0) return null;
  const border =
    tone === 'emerald'
      ? 'border-emerald-900/40'
      : tone === 'amber'
        ? 'border-amber-900/40'
        : 'border-red-900/40';

  return (
    <div className={`rounded-xl border ${border} bg-black/40 p-4`}>
      <h4 className="text-sm font-semibold text-[#FFD700] mb-3">{title}</h4>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex gap-2 text-sm">
            <StatusIcon status={item.status} />
            <div>
              <span className="text-zinc-200">{item.label}</span>
              {item.detail && (
                <span className="text-zinc-500"> — {item.detail}</span>
              )}
              {item.action && item.status !== 'completed' && (
                <p className="text-amber-300/90 text-xs mt-0.5">{item.action}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ContentOptimizationChecklist({
  checklist,
  url,
  targetKeyword,
}: {
  checklist: ContentChecklistResult;
  url?: string;
  targetKeyword?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-[#FFD700]">Content Optimization Checklist</h3>
          {url && (
            <p className="text-xs text-zinc-500 mt-1 truncate max-w-md">{url}</p>
          )}
          {targetKeyword && (
            <p className="text-xs text-zinc-400">Keyword: {targetKeyword}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-yellow-400">
            {checklist.score}/{checklist.maxScore}
          </div>
          <div className="text-xs text-zinc-500">Checklist score</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        <ItemList title="Completed" items={checklist.completed} tone="emerald" />
        <ItemList title="Needs work" items={checklist.needsWork} tone="amber" />
        <ItemList title="Not done" items={checklist.notDone} tone="red" />
      </div>

      <div className="rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-4 text-sm">
        <span className="text-[#FFD700] font-medium">Priority: </span>
        <span className="text-zinc-300">{checklist.priority}</span>
      </div>
    </div>
  );
}
