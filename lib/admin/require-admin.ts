import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export type AdminUser = { id: string; email: string; is_admin: boolean };

export async function requireAdmin(
  request: NextRequest
): Promise<{ user: AdminUser } | NextResponse> {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!user.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return { user: { id: user.id, email: user.email, is_admin: true } };
}
