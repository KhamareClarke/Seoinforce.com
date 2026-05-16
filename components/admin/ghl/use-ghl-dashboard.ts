'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export type GhlDashboard = Awaited<
  ReturnType<typeof import('@/lib/ghl/admin-dashboard').fetchGhlAdminDashboard>
>;

export function useGhlDashboard(days = 30) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [data, setData] = useState<GhlDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await fetch('/api/auth/me', { credentials: 'include' });
      if (!me.ok) {
        router.push('/admin/login');
        return;
      }
      const u = await me.json();
      if (!u.is_admin) {
        router.push('/admin');
        return;
      }
      const res = await fetch(`/api/admin/ghl/dashboard?days=${days}`, {
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load dashboard');
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [days, router]);

  const runSync = useCallback(async (pendingOnly = true) => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/admin/ghl/sync', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingOnly, limit: 50 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Sync failed');
      setSyncMessage(`Synced ${json.synced}, failed ${json.failed} (${json.processed} processed)`);
      await load();
    } catch (e) {
      setSyncMessage(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  return { loading, syncing, data, error, syncMessage, load, runSync };
}

export function fmtTime(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB');
}

export function pct(part: number, total: number) {
  if (total <= 0) return '0%';
  return `${Math.round((part / total) * 1000) / 10}%`;
}
