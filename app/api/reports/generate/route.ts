import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { getCurrentUser } from '@/lib/auth';
import { PDFReportGenerator } from '@/lib/reports/pdf-generator';
import { randomUUID } from 'crypto';
import { sendReportDownloadedEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

    const { auditId, whiteLabel } = await request.json();

    if (!auditId) {
      return NextResponse.json({ error: 'Audit ID is required' }, { status: 400 });
    }

    // Get audit data
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .select(`
        *,
        projects!inner(user_id, domain),
        audit_issues(*)
      `)
      .eq('id', auditId)
      .single();

    if (auditError || !audit || audit.projects.user_id !== user.id) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    if (audit.status !== 'completed') {
      return NextResponse.json({ error: 'Audit not completed' }, { status: 400 });
    }

    // Prepare report data - map audit_issues to the expected format
    let issues: any[] = [];
    if (audit.audit_issues && Array.isArray(audit.audit_issues)) {
      issues = audit.audit_issues.map((issue: any) => ({
        type: issue.issue_type || issue.type || 'general',
        severity: issue.severity || 'info',
        title: issue.title || 'Untitled Issue',
        description: issue.description || '',
        fix_suggestion: issue.fix_suggestion || '',
      }));
    } else if (audit.raw_data?.issues && Array.isArray(audit.raw_data.issues)) {
      // Fallback to raw_data issues if audit_issues is not available
      issues = audit.raw_data.issues.map((issue: any) => ({
        type: issue.type || issue.issue_type || 'general',
        severity: issue.severity || 'info',
        title: issue.title || 'Untitled Issue',
        description: issue.description || '',
        fix_suggestion: issue.fix_suggestion || '',
      }));
    }

    const reportData = {
      domain: audit.domain,
      overall_score: audit.overall_score || 0,
      technical_score: audit.technical_score || 0,
      onpage_score: audit.onpage_score || 0,
      content_score: audit.content_score || 0,
      technical: audit.raw_data?.technical || {},
      onpage: audit.raw_data?.onpage || {},
      content: audit.raw_data?.content || {},
      issues: issues,
      whiteLabel: whiteLabel || undefined,
    };

    // Generate PDF
    const generator = new PDFReportGenerator();
    const pdfBuffer = await generator.generateReport(reportData);

    // Create share token
    const shareToken = randomUUID();

    // Save report record
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        audit_id: auditId,
        project_id: audit.project_id,
        share_token: shareToken,
        white_label_branding: whiteLabel || null,
      })
      .select()
      .single();

    if (reportError) {
      console.error('Report save error:', reportError);
    }

    // Send report download email
    try {
      await sendReportDownloadedEmail(
        user.email || '',
        user.full_name || user.email?.split('@')[0] || 'User',
        audit.domain
      );
    } catch (emailError) {
      console.error('Error sending report download email:', emailError);
      // Don't fail the request if email fails
    }

    // In production, upload PDF to storage (Supabase Storage, S3, etc.)
    // For now, return the PDF directly
    // Convert Buffer to Uint8Array for NextResponse compatibility
    const pdfArray = new Uint8Array(pdfBuffer);
    
    return new NextResponse(pdfArray, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="seo-audit-${audit.domain}-${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate report' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareToken = searchParams.get('token');

    if (!shareToken) {
      return NextResponse.json({ error: 'Share token is required' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    // Get report by share token (public access)
    const { data: report, error } = await supabase
      .from('reports')
      .select(`
        *,
        audits(*,
          projects(domain)
        )
      `)
      .eq('share_token', shareToken)
      .single();

    if (error || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Generate PDF on-the-fly
    const reportData = {
      domain: report.audits.projects.domain,
      overall_score: report.audits.overall_score || 0,
      technical_score: report.audits.technical_score || 0,
      onpage_score: report.audits.onpage_score || 0,
      content_score: report.audits.content_score || 0,
      technical: report.audits.raw_data?.technical || {},
      onpage: report.audits.raw_data?.onpage || {},
      content: report.audits.raw_data?.content || {},
      issues: [],
      whiteLabel: report.white_label_branding || undefined,
    };

    const generator = new PDFReportGenerator();
    const pdfBuffer = await generator.generateReport(reportData);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="seo-audit-${reportData.domain}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Get report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
