import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.full_name || user.email.split('@')[0]);
      return NextResponse.json({ success: true });
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
  } catch (error) {
    console.error('Welcome email API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
