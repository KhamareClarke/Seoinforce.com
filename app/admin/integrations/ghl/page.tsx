'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Users,
  AlertTriangle,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/admin/ghl/stat-card';
import { useGhlDashboard, fmtTime, pct } from '@/components/admin/ghl/use-ghl-dashboard';

export default function AdminGhlIntegrationPage() {
  const { loading, syncing, data, error, syncMessage, load, runSync } = useGhlDashboard(30);

  const c = data?.connection;
  const contacts = data?.contacts;
  const api = data?.apiUsage;
  const errors = data?.errors;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-[#FFD700] mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Admin
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Go High Level</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Connection, contact sync, API usage, and errors (Task 1.4)
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/ghl-metrics">
              <Button variant="outline" className="border-zinc-700">
                SMS &amp; workflow metrics
                <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            </Link>
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
        </div>

        {error && <p className="text-red-400 mb-4">{error}</p>}
        {syncMessage && <p className="text-emerald-400/90 text-sm mb-4">{syncMessage}</p>}

        {data && (
          <div className="space-y-6">
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                {c?.connected ? (
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-amber-400" />
                )}
                GHL account status
              </h2>
              <dl className="grid sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-zinc-500">Status</dt>
                  <dd className="font-medium">
                    {c?.connected
                      ? 'Connected'
                      : c?.configured
                        ? 'Configured — API error'
                        : 'Not configured'}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Account / location</dt>
                  <dd>{c?.locationName || c?.locationId || '—'}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">API key</dt>
                  <dd className="font-mono text-xs">{c?.apiKeyMasked || '—'}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Last SMS activity</dt>
                  <dd>{fmtTime(data.sms.lastSmsAt)}</dd>
                </div>
              </dl>
              {c?.connectionError && (
                <p className="mt-3 text-xs text-amber-300/90">{c.connectionError}</p>
              )}
              <p className="text-xs text-zinc-500 mt-4">
                Update <code className="text-zinc-300">GHL_API_KEY</code> and{' '}
                <code className="text-zinc-300">GHL_LOCATION_ID</code> to re-authenticate.
              </p>
              <h3 className="text-sm font-medium mt-5 mb-2 text-zinc-300">Workflow webhooks</h3>
              <ul className="grid sm:grid-cols-2 gap-1 text-xs">
                {Object.entries(c?.workflowWebhooksConfigured ?? {}).map(([key, ok]) => (
                  <li key={key} className="flex justify-between gap-2 pr-4">
                    <span className="text-zinc-500">{key}</span>
                    <span className={ok ? 'text-emerald-400' : 'text-zinc-600'}>
                      {ok ? 'Set' : 'Missing'}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#FFD700]" />
                  Contact sync status
                </h2>
                <Button
                  type="button"
                  size="sm"
                  className="bg-[#FFD700] text-black hover:bg-[#e6c200]"
                  disabled={syncing || !c?.configured}
                  onClick={() => void runSync(true)}
                >
                  {syncing ? 'Syncing…' : 'Sync pending contacts (50)'}
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <StatCard label="SEOinforce users" value={contacts?.totalUsers ?? 0} />
                <StatCard
                  label="Synced to GHL"
                  value={contacts?.synced ?? 0}
                  sub={`${contacts?.syncPercent ?? 0}%`}
                  accent
                />
                <StatCard label="Pending sync" value={contacts?.pending ?? 0} />
                <StatCard label="Failed (7d)" value={contacts?.failedSyncs7d ?? 0} />
              </div>
              <p className="text-sm text-zinc-400">
                Last sync: {fmtTime(contacts?.lastSyncAt)}
                {contacts?.lastSyncStatus ? ` (${contacts.lastSyncStatus})` : ''}
              </p>
              {(contacts?.pendingUsers?.length ?? 0) > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-zinc-500 border-b border-zinc-800">
                        <th className="text-left py-2">Email</th>
                        <th className="text-left py-2">Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts!.pendingUsers.map((u) => (
                        <tr key={u.id} className="border-b border-zinc-800/40">
                          <td className="py-2">{u.email}</td>
                          <td className="py-2 text-zinc-400">{u.fullName || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#FFD700]" />
                GHL API usage ({data.days}d)
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <StatCard label="Total API calls" value={api?.totalCalls ?? 0} accent />
                <StatCard label="Avg / day" value={api?.callsPerDay ?? 0} />
                <StatCard label="Rate limits (429)" value={api?.rateLimitErrors ?? 0} />
                <StatCard
                  label="Quota used"
                  value={`${api?.quotaUsedPercent ?? 0}%`}
                  sub={`of ${api?.quotaMonthly?.toLocaleString()}/mo`}
                />
              </div>
              <ul className="text-sm space-y-1">
                {Object.entries(api?.byOperation ?? {})
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 8)
                  .map(([op, n]) => (
                    <li key={op} className="flex justify-between">
                      <span className="text-zinc-400">{op}</span>
                      <span>
                        {n} ({pct(n, api?.totalCalls ?? 0)})
                      </span>
                    </li>
                  ))}
              </ul>
            </section>

            <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                Integration errors
              </h2>
              <ul className="space-y-3 text-sm">
                {(errors?.items ?? []).slice(0, 10).map((e) => (
                  <li key={e.id} className="border border-zinc-800 rounded-lg p-3 bg-zinc-950/50">
                    <div className="flex justify-between gap-2 text-xs text-zinc-500 mb-1">
                      <span className="uppercase">{e.category}</span>
                      <span>{fmtTime(e.at)}</span>
                    </div>
                    <p className="text-zinc-200">{e.message}</p>
                    {e.email && <p className="text-zinc-500 text-xs mt-1">{e.email}</p>}
                  </li>
                ))}
                {(errors?.items?.length ?? 0) === 0 && (
                  <li className="text-emerald-400/90">No recent errors.</li>
                )}
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

