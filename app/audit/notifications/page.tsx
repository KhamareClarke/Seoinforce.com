'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Scope = 'none' | 'critical' | 'all';

export default function AuditNotificationsPage() {
  const [phone, setPhone] = useState('');
  const [scope, setScope] = useState<Scope>('none');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/user/notification-preferences', { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load');
        if (!cancelled) {
          setPhone(data.phone || '');
          setScope((data.sms_notification_scope as Scope) || 'none');
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Load failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/user/notification-preferences', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          sms_notification_scope: scope,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setMessage('Preferences saved. Your Go High Level contact will sync shortly.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#FFD700]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-950 text-zinc-100 px-4 py-8 max-w-lg mx-auto">
      <Link
        href="/audit/dashboard"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-[#FFD700] mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <Bell className="h-8 w-8 text-[#FFD700]" />
        <h1 className="text-2xl font-bold text-white">SMS &amp; alerts</h1>
      </div>
      <p className="text-sm text-zinc-400 mb-6">
        SMS is delivered through Go High Level when configured. Choose what we may send. Setting notifications to{' '}
        <strong className="text-zinc-300">Off</strong> opts you out in our system and syncs an{' '}
        <code className="text-xs">sms-opt-out</code> tag in GHL. You can also reply <strong>STOP</strong> to any SMS
        (GHL standard unsubscribe).
      </p>

      <div className="space-y-5 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Mobile (E.164)</label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+447911123456"
            className="bg-zinc-950 border-zinc-700 text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2">SMS notifications</label>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as Scope)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
          >
            <option value="none">Off — unsubscribe from all SMS</option>
            <option value="critical">Critical only — audits complete, rank drops, billing, competitors</option>
            <option value="all">All alerts — including rank gains &amp; weekly report ready</option>
          </select>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {message && <p className="text-sm text-emerald-400">{message}</p>}

        <Button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="w-full bg-[#FFD700] text-black hover:bg-[#e6c200]"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving…
            </>
          ) : (
            'Save preferences'
          )}
        </Button>
      </div>
    </div>
  );
}
