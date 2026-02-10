import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    let agency_brand_name: string | null = null;
    if (user.agency_id) {
      const supabase = createSupabaseServerClient();
      const { data: agency } = await supabase
        .from('users')
        .select('brand_name')
        .eq('id', user.agency_id)
        .single();
      agency_brand_name = agency?.brand_name ?? null;
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        email_verified: user.email_verified,
        plan_type: user.plan_type,
        is_admin: user.is_admin,
        account_type: user.account_type || 'personal',
        agency_id: user.agency_id ?? null,
        brand_name: user.brand_name ?? null,
        agency_brand_name: agency_brand_name,
      },
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
