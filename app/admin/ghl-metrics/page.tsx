'use client';

import Link from 'next/link';
import { ArrowLeft, RefreshCw, Mail, MessageSquare, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/admin/ghl/stat-card';
import { useGhlDashboard, fmtTime, pct } from '@/components/admin/ghl/use-ghl-dashboard';

const EVENT_LABELS: Record<string, string> = {
  audit_completion: 'Audit complete',
  rank_drop: 'Rank drop',
  rank_gain: 'Rank gain',
  competitor_alert: 'Competitor alert',
  subscription_renewal: 'Subscription renewal',
  subscription_upgraded: 'Subscription upgraded',
  subscription_downgraded: 'Subscription downgraded',
  report_ready: 'Report ready',
  signup_welcome: 'Signup welcome',
};

export default function AdminGhlMetricsPage() {
  const { loading, data, error, load } = useGhlDashboard(30);
  const sms = data?.sms;
  const email = data?.email;
  const wf = data?.workflows;

  const smsDays = Object.entries(sms?.byDay ?? {}).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/admin/integrations/ghl"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-[#FFD700] mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          GHL integration
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">GHL metrics</h1>
            <p className="text-sm text-zinc-400 mt-1">SMS, email workflows, and execution logs</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="border-zinc-700"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        {data && (
          <div className="space-y-6">
            {/* Section 3: SMS */}
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#FFD700]" />
                SMS metrics (last {data.days} days)
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <StatCard label="Total logged" value={sms?.total ?? 0} />
                <StatCard label="Sent" value={sms?.sent ?? 0} accent />
                <StatCard
                  label="Delivered"
                  value={sms?.delivered ?? 0}
                  sub={`${sms?.deliveryRate ?? 0}% of sent`}
                />
                <StatCard
                  label="Failed / skipped"
                  value={`${sms?.failed ?? 0} / ${sms?.skipped ?? 0}`}
                />
              </div>
              <div className="grid sm:grid-cols-3 gap-3 text-sm mb-4">
                <p className="text-zinc-400">
                  Bounce / undelivered: <span className="text-white">{sms?.bounced ?? 0}</span>{' '}
                  ({sms?.bounceRate ?? 0}% of sent)
                </p>
                <p className="text-zinc-400">
                  SMS opt-outs (users): <span className="text-white">{sms?.optOutCount ?? 0}</span>
                </p>
                <p className="text-zinc-400">
                  Last SMS: <span className="text-white">{fmtTime(sms?.lastSmsAt)}</span>
                </p>
              </div>

              <h3 className="text-sm font-medium text-zinc-300 mb-2">By type</h3>
              <ul className="text-sm space-y-1 mb-6">
                {Object.entries(sms?.byEvent ?? {})
                  .sort((a, b) => b[1] - a[1])
                  .map(([k, v]) => (
                    <li key={k} className="flex justify-between">
                      <span className="text-zinc-400">{EVENT_LABELS[k] ?? k}</span>
                      <span>
                        {v} ({pct(v, sms?.total ?? 0)})
                      </span>
                    </li>
                  ))}
              </ul>

              <h3 className="text-sm font-medium text-zinc-300 mb-2">Volume by day</h3>
              <div className="flex items-end gap-1 h-24 mb-6">
                {smsDays.slice(-14).map(([day, counts]) => {
                  const h = Math.min(100, (counts.sent + counts.failed) * 8);
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1" title={day}>
                      <div
                        className="w-full bg-[#FFD700]/80 rounded-t min-h-[4px]"
                        style={{ height: `${Math.max(h, 4)}%` }}
                      />
                      <span className="text-[9px] text-zinc-600 rotate-0">{day.slice(5)}</span>
                    </div>
                  );
                })}
                {smsDays.length === 0 && (
                  <p className="text-zinc-500 text-sm">No SMS data in range.</p>
                )}
              </div>

              <h3 className="text-sm font-medium text-zinc-300 mb-2">Recent SMS</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-zinc-500 text-left border-b border-zinc-800">
                      <th className="py-2 pr-3">Time</th>
                      <th className="py-2 pr-3">User</th>
                      <th className="py-2 pr-3">Event</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2">Delivery</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(sms?.recent ?? []).map((r, i) => (
                      <tr key={i} className="border-b border-zinc-800/50">
                        <td className="py-2 pr-3 text-zinc-400">{fmtTime(r.at)}</td>
                        <td className="py-2 pr-3 text-xs">{r.email || '—'}</td>
                        <td className="py-2 pr-3">{EVENT_LABELS[r.event] ?? r.event}</td>
                        <td className="py-2 pr-3">{r.status}</td>
                        <td className="py-2">{r.delivery || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 4: Email (workflow proxy) */}
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-[#FFD700]" />
                Email metrics (via GHL workflows)
              </h2>
              <p className="text-sm text-zinc-400 mb-4">{email?.note}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                <StatCard label="Workflow triggers" value={email?.workflowTriggersTotal ?? 0} />
                <StatCard
                  label="Succeeded"
                  value={email?.workflowTriggersSucceeded ?? 0}
                  accent
                />
                <StatCard
                  label="Failed"
                  value={
                    (email?.workflowTriggersTotal ?? 0) - (email?.workflowTriggersSucceeded ?? 0)
                  }
                />
              </div>
              <p className="text-xs text-zinc-500 mb-3">
                Open rate, click rate, and unsubscribes: use GHL → Reporting → Email campaigns for
                each workflow.
              </p>
              <ul className="text-sm space-y-1">
                {Object.entries(email?.byEvent ?? {}).map(([k, v]) => (
                  <li key={k} className="flex justify-between">
                    <span className="text-zinc-400">{k}</span>
                    <span>{v} triggers</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Section 5: Workflow logs */}
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-[#FFD700]" />
                Workflow execution log
              </h2>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <StatCard label="Total (30d)" value={wf?.total ?? 0} />
                <StatCard label="Succeeded" value={wf?.succeeded ?? 0} accent />
                <StatCard label="Failed" value={wf?.failed ?? 0} />
              </div>
              <ul className="space-y-3 text-sm">
                {(wf?.recent ?? []).map((r) => (
                  <li
                    key={r.id}
                    className={`border rounded-lg p-3 ${
                      r.success ? 'border-emerald-900/50 bg-emerald-950/20' : 'border-red-900/50 bg-red-950/20'
                    }`}
                  >
                    <div className="flex justify-between gap-2 text-xs text-zinc-500 mb-1">
                      <span>{fmtTime(r.at)}</span>
                      <span className={r.success ? 'text-emerald-400' : 'text-red-400'}>
                        {r.success ? 'OK' : 'FAILED'}
                      </span>
                    </div>
                    <p className="font-medium text-zinc-200">
                      {r.event}
                      {r.changeType ? ` · ${r.changeType}` : ''}
                      {r.direction ? ` · ${r.direction}` : ''}
                    </p>
                    <p className="text-zinc-400 text-xs mt-1">{r.email || 'no email in payload'}</p>
                    {r.error && <p className="text-red-300/90 text-xs mt-1">{r.error}</p>}
                    <p className="text-zinc-600 text-[10px] mt-1">
                      GHL actions (SMS, email, tags) run inside your published workflow — check GHL
                      Execution Logs for step detail.
                    </p>
                  </li>
                ))}
                {(wf?.recent?.length ?? 0) === 0 && (
                  <li className="text-zinc-500">No workflow webhook logs yet.</li>
                )}
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
