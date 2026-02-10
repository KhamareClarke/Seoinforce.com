'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUserClient } from '@/lib/auth/client';
import { slugify } from '@/lib/slug';
import { Loader2 } from 'lucide-react';

// Clients redirect to /audit/[agency-name]/dashboard so URL shows agency name.
export default function ClientDashboardPage() {
  const router = useRouter();

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
      if (!d.user?.agency_id) {
        router.replace('/audit/dashboard');
        return;
      }
      if (d.user?.agency_brand_name) {
        router.replace(`/audit/${slugify(d.user.agency_brand_name)}/dashboard`);
      } else {
        router.replace('/audit/dashboard');
      }
    })();
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
    </div>
  );
}
