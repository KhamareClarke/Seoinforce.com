import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { getCurrentUser } from '@/lib/auth';
import { logError } from '@/lib/utils/error-logger';

// POST - Create a test error log (for testing purposes)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.is_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Create a test error log
    await logError({
      errorType: 'test_error',
      errorMessage: 'This is a test error log created from the admin panel',
      errorStack: 'Test stack trace\n  at test function\n  at admin panel',
      endpoint: '/api/admin/test-error-log',
      requestData: { test: true },
      severity: 'info',
      userId: user.id,
    });

    return NextResponse.json({ success: true, message: 'Test error log created' });
  } catch (error: any) {
    console.error('Test error log API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
