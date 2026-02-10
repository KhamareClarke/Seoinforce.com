'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCurrentUserClient } from '@/lib/auth/client';
import AuditDashboard from '@/app/audit/dashboard/page';
import { slugify } from '@/lib/slug';
import { Loader2 } from 'lucide-react';

export default function AgencyNamedAuditDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const agencySlug = params?.agencySlug as string | undefined;
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    (async () => {
      const user = await getCurrentUserClient();
      if (!user) {
        router.replace('/sign-in');
        return;
      }
      const me = await fetch('/api/auth/me', { credentials: 'include' });
      if (!me.ok) {
        router.replace('/sign-in');
        return;
      }
      const d = await me.json();
      const u = d.user;
      const expectedSlug = u?.account_type === 'brand' && u?.brand_name
        ? slugify(u.brand_name)
        : u?.agency_brand_name
          ? slugify(u.agency_brand_name)
          : null;
      if (expectedSlug && agencySlug === expectedSlug) {
        setAllowed(true);
      } else if (u?.account_type === 'brand' && u?.brand_name) {
        router.replace(`/audit/${slugify(u.brand_name)}/dashboard`);
        return;
      } else if (u?.agency_brand_name) {
        router.replace(`/audit/${slugify(u.agency_brand_name)}/dashboard`);
        return;
      } else {
        router.replace('/audit/dashboard');
        return;
      }
      setReady(true);
    })();
  }, [router, agencySlug]);

  if (!ready || !allowed) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  return <AuditDashboard />;
}
