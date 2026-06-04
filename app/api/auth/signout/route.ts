import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie, getCurrentUser } from '@/lib/auth';
import { emitEmpireActivity } from '@/lib/empire-activity';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request).catch(() => null);
    if (user) {
      void emitEmpireActivity({
        event_type: 'logout',
        user_email: user.email,
        user_id: user.id,
        user_name: user.full_name || undefined,
        request,
      });
    }
    const response = NextResponse.json({ success: true, message: 'Signed out successfully' });
    clearAuthCookie(response, request);
    return response;
  } catch (error) {
    console.error('Signout error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
