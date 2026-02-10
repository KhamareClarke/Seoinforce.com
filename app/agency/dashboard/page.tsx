'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { slugify } from '@/lib/slug';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCurrentUserClient, signOutClient } from '@/lib/auth/client';
import {
  Palette,
  Image as ImageIcon,
  Users,
  Package,
  LogOut,
  Loader2,
  Plus,
  Mail,
  Lock,
  User,
  Check,
} from 'lucide-react';

type AgencySettings = {
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  package_tier: string;
  audits_used_this_period: number;
  audits_limit: number;
  clients_limit: number;
};

type PackageInfo = {
  tier: string;
  name: string;
  auditsLimit: number;
  auditsUsed: number;
  clientsLimit: number;
  clientsCount: number;
  price: number;
};

const PACKAGES = [
  { id: 'starter', name: 'Starter', audits: 10, clients: 3, price: 49 },
  { id: 'growth', name: 'Growth', audits: 50, clients: 10, price: 149 },
  { id: 'empire', name: 'Empire', audits: 200, clients: 50, price: 399 },
];

export default function AgencyDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<{ id: string; email: string; full_name?: string } | null>(null);
  const [settings, setSettings] = useState<AgencySettings | null>(null);
  const [packageInfo, setPackageInfo] = useState<PackageInfo | null>(null);
  const [clients, setClients] = useState<{ id: string; email: string; full_name?: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#facc15');
  const [secondaryColor, setSecondaryColor] = useState('#eab308');

  const [clientEmail, setClientEmail] = useState('');
  const [clientPassword, setClientPassword] = useState('');
  const [clientName, setClientName] = useState('');
  const [addingClient, setAddingClient] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [auditDashboardPath, setAuditDashboardPath] = useState<string>('/audit/dashboard');
  const [subscribed, setSubscribed] = useState<boolean>(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await getCurrentUserClient();
      if (!u) {
        router.push('/sign-in');
        return;
      }
      const me = await fetch('/api/auth/me', { credentials: 'include' });
      if (!me.ok) {
        router.push('/sign-in');
        return;
      }
      const d = await me.json();
      if (d.user?.account_type !== 'brand') {
        router.push('/audit/dashboard');
        return;
      }
      setUser(u);
      if (d.user?.brand_name) {
        setAuditDashboardPath(`/audit/${slugify(d.user.brand_name)}/dashboard`);
      }
    })();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [setRes, pkgRes, clientsRes] = await Promise.all([
          fetch('/api/agency/settings', { credentials: 'include' }),
          fetch('/api/agency/package', { credentials: 'include' }),
          fetch('/api/agency/clients', { credentials: 'include' }),
        ]);
        if (setRes.ok) {
          const data = await setRes.json();
          const s = data.settings;
          if (s) {
            setSettings(s);
            setLogoUrl(s.logo_url || '');
            setPrimaryColor(s.primary_color || '#facc15');
            setSecondaryColor(s.secondary_color || '#eab308');
          }
        }
        if (pkgRes.ok) {
          const data = await pkgRes.json();
          setPackageInfo(data.package);
          setSubscribed(!!data.subscribed);
          setSubscriptionStatus(data.subscriptionStatus ?? null);
        }
        if (searchParams.get('billing') === 'success') {
          router.replace('/agency/dashboard', { scroll: false });
        }
        if (clientsRes.ok) {
          const data = await clientsRes.json();
          setClients(data.clients || []);
        }
      } catch (e) {
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const saveTheme = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/agency/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          logo_url: logoUrl || null,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save theme');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, GIF, WebP or SVG).');
      return;
    }
    setUploadingLogo(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await fetch('/api/agency/upload-logo', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }
      if (data.url) {
        setLogoUrl(data.url);
        const patchRes = await fetch('/api/agency/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ logo_url: data.url }),
        });
        if (patchRes.ok) {
          const patchData = await patchRes.json();
          if (patchData.settings) setSettings(patchData.settings);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const startCheckout = async (plan: string) => {
    setCheckoutLoading(plan);
    setError(null);
    try {
      const res = await fetch('/api/agency/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout');
      if (data.url) window.location.href = data.url;
      else throw new Error('No checkout URL returned');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start checkout');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const openBillingPortal = async () => {
    setPortalLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/agency/billing/portal', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to open billing');
      if (data.url) window.location.href = data.url;
      else throw new Error('No portal URL returned');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to open billing');
    } finally {
      setPortalLoading(false);
    }
  };

  const addClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);
    setAddingClient(true);
    try {
      const res = await fetch('/api/agency/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: clientEmail,
          password: clientPassword,
          fullName: clientName || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setClientError(data.error || 'Failed to add client');
        return;
      }
      setClients(prev => [data.client, ...prev]);
      setClientEmail('');
      setClientPassword('');
      setClientName('');
    } catch (e) {
      setClientError('Failed to add client');
    } finally {
      setAddingClient(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  const accent = primaryColor || '#facc15';

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black text-white">
      <header className="border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt="Logo" className="h-9 w-9 rounded object-contain" />
          ) : (
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600" />
          )}
          <span className="font-semibold">Agency Dashboard</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{user.email}</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            onClick={() => signOutClient()}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
            {error}
          </div>
        )}

        <Tabs defaultValue="theme" className="space-y-4">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="theme" className="data-[state=active]:bg-white/10">Theme & Logo</TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-white/10">Team / Clients</TabsTrigger>
            <TabsTrigger value="package" className="data-[state=active]:bg-white/10">Package</TabsTrigger>
          </TabsList>

          <TabsContent value="theme" className="space-y-4">
            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#FFD700]">
                  <Palette className="h-5 w-5" /> Customize theme
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Logo and colors will appear on your clients&apos; dashboards.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Logo</label>
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <div className="flex items-center gap-3">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Agency logo" className="h-16 w-16 rounded-lg object-contain border border-white/20 bg-white/5" />
                      ) : (
                        <div className="h-16 w-16 rounded-lg border border-dashed border-white/30 bg-white/5 flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-gray-500" />
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                          className="hidden"
                          onChange={handleLogoUpload}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploadingLogo}
                          onClick={() => fileInputRef.current?.click()}
                          className="border-white/30 text-white hover:bg-white/10"
                        >
                          {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                          {uploadingLogo ? ' Uploading...' : ' Upload image'}
                        </Button>
                        {logoUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-red-400 text-xs"
                            onClick={async () => {
                              setLogoUrl('');
                              try {
                                const res = await fetch('/api/agency/settings', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  credentials: 'include',
                                  body: JSON.stringify({ logo_url: null }),
                                });
                                if (res.ok) {
                                  const data = await res.json();
                                  if (data.settings) setSettings(data.settings);
                                }
                              } catch (_) {}
                            }}
                          >
                            Remove logo
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 sm:mt-0 mt-1">PNG, JPG, GIF, WebP or SVG. Max 2MB.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Primary color</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={e => setPrimaryColor(e.target.value)}
                        className="w-10 h-10 rounded border border-white/20 cursor-pointer"
                      />
                      <Input
                        value={primaryColor}
                        onChange={e => setPrimaryColor(e.target.value)}
                        className="bg-black/50 border-white/20 text-white font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Secondary color</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={e => setSecondaryColor(e.target.value)}
                        className="w-10 h-10 rounded border border-white/20 cursor-pointer"
                      />
                      <Input
                        value={secondaryColor}
                        onChange={e => setSecondaryColor(e.target.value)}
                        className="bg-black/50 border-white/20 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
                <Button
                  onClick={saveTheme}
                  disabled={saving}
                  style={{ backgroundColor: accent }}
                  className="text-black hover:opacity-90"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {saving ? ' Saving...' : ' Save theme'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#FFD700]">
                  <Users className="h-5 w-5" /> Team / Clients
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Add clients with email and password. They sign in to their own dashboard with your branding.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={addClient} className="flex flex-wrap gap-3 items-end p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-xs text-gray-400 mb-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        type="email"
                        value={clientEmail}
                        onChange={e => setClientEmail(e.target.value)}
                        placeholder="client@example.com"
                        required
                        className="pl-8 bg-black/50 border-white/20"
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-xs text-gray-400 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        type="password"
                        value={clientPassword}
                        onChange={e => setClientPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="pl-8 bg-black/50 border-white/20"
                      />
                    </div>
                  </div>
                  <div className="w-32 min-w-[120px]">
                    <label className="block text-xs text-gray-400 mb-1">Name (optional)</label>
                    <Input
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      placeholder="Client name"
                      className="bg-black/50 border-white/20"
                    />
                  </div>
                  <Button type="submit" disabled={addingClient} style={{ backgroundColor: accent }} className="text-black">
                    {addingClient ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {addingClient ? ' Adding...' : ' Add client'}
                  </Button>
                </form>
                {clientError && (
                  <p className="text-sm text-red-400">{clientError}</p>
                )}
                <p className="text-sm text-gray-400">
                  {packageInfo ? `${clients.length} / ${packageInfo.clientsLimit} clients` : 'Loading...'}
                </p>
                <ul className="space-y-2">
                  {clients.map(c => (
                    <li key={c.id} className="flex items-center justify-between py-2 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span>{c.email}</span>
                        {c.full_name && <span className="text-gray-400">({c.full_name})</span>}
                      </div>
                      <span className="text-xs text-gray-500">
                        Added {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                  {clients.length === 0 && !loading && (
                    <li className="text-gray-500 py-4">No clients yet. Add one above.</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="package" className="space-y-4">
            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#FFD700]">
                  <Package className="h-5 w-5" /> Plan & Billing
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {subscribed
                    ? 'Your subscription is active. Add clients and run audits within your limits.'
                    : 'Subscribe to a plan to add clients and run audits for your agency.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {packageInfo && (
                  <p className="text-sm text-gray-300">
                    Current: <strong>{packageInfo.name}</strong> — {packageInfo.auditsUsed} / {packageInfo.auditsLimit} audits this period, {packageInfo.clientsCount} / {packageInfo.clientsLimit} clients.
                    {subscribed && (
                      <span className="ml-2 text-green-400">
                        {subscriptionStatus === 'active' || subscriptionStatus === 'trialing' ? '• Active' : '• Free (admin)'}
                      </span>
                    )}
                  </p>
                )}
                {subscribed && (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10"
                    disabled={portalLoading}
                    onClick={openBillingPortal}
                  >
                    {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Manage subscription
                  </Button>
                )}
                {!subscribed && (
                  <p className="text-amber-400/90 text-sm">Subscribe to unlock clients and audits.</p>
                )}
                <div className="grid gap-3 sm:grid-cols-3">
                  {PACKAGES.map(p => (
                    <div
                      key={p.id}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        packageInfo?.tier === p.id && subscribed
                          ? 'border-[#facc15] bg-yellow-400/10'
                          : 'border-white/20 bg-white/5'
                      }`}
                    >
                      <div className="font-semibold text-white">{p.name}</div>
                      <div className="text-sm text-gray-400 mt-1">{p.audits} audits / month</div>
                      <div className="text-sm text-gray-400">{p.clients} clients max</div>
                      <div className="mt-2 text-[#FFD700] font-medium">£{p.price}/mo</div>
                      {!subscribed && (
                        <Button
                          type="button"
                          size="sm"
                          className="mt-2 w-full"
                          style={{ backgroundColor: accent }}
                          disabled={!!checkoutLoading}
                          onClick={() => startCheckout(p.id)}
                        >
                          {checkoutLoading === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Subscribe'}
                        </Button>
                      )}
                      {subscribed && packageInfo?.tier === p.id && (
                        <span className="mt-2 inline-block text-sm text-green-400">Current plan</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center">
          <Link href={auditDashboardPath} className="text-sm text-gray-400 hover:text-[#FFD700]">
            Open SEO audit dashboard →
          </Link>
        </div>
      </main>
    </div>
  );
}
