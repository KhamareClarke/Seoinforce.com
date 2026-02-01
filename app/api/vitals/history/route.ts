import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { auditId, lcp, fcp, tti } = await request.json();

    if (!auditId) {
      return NextResponse.json({ error: 'Audit ID is required' }, { status: 400 });
    }

    // Get audit to verify ownership
    const { data: audit } = await supabase
      .from('audits')
      .select(`
        id,
        projects!inner(user_id)
      `)
      .eq('id', auditId)
      .single();

    if (!audit || audit.projects.user_id !== user.id) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    // Save vitals history
    const { data: vitals, error } = await supabase
      .from('vitals_history')
      .insert({
        audit_id: auditId,
        lcp: lcp || null,
        fcp: fcp || null,
        tti: tti || null,
        date: new Date().toISOString().split('T')[0], // Today's date
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving vitals:', error);
      return NextResponse.json({ error: 'Failed to save vitals' }, { status: 500 });
    }

    return NextResponse.json({ vitals });
  } catch (error) {
    console.error('Vitals history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const auditId = searchParams.get('audit_id');
    const projectId = searchParams.get('project_id');
    const months = parseInt(searchParams.get('months') || '6');

    if (!auditId && !projectId) {
      return NextResponse.json({ error: 'Audit ID or Project ID required' }, { status: 400 });
    }

    let query = supabase
      .from('vitals_history')
      .select(`
        *,
        audits!inner(
          id,
          projects!inner(user_id)
        )
      `)
      .order('date', { ascending: false })
      .limit(months);

    if (auditId) {
      query = query.eq('audit_id', auditId);
    } else if (projectId) {
      query = query.eq('audits.project_id', projectId);
    }

    const { data: history, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch vitals history' }, { status: 500 });
    }

    // Filter by user ownership
    const userHistory = history?.filter((h: any) => h.audits?.projects?.user_id === user.id) || [];

    return NextResponse.json({ history: userHistory });
  } catch (error) {
    console.error('Get vitals history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
