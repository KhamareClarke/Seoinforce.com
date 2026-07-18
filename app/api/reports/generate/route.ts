import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { getCurrentUser } from '@/lib/auth';
import { PDFReportGenerator } from '@/lib/reports/pdf-generator';
import { randomUUID } from 'crypto';
import { sendReportDownloadedEmail, sendReportViaEmail } from '@/lib/email';
import { getSiteUrl } from '@/lib/site-url';
import { sendSmsForUserEvent } from '@/lib/ghl/sms';
import { syncUserToGhlById } from '@/lib/ghl/sync-user';
import { touchUserLastActive } from '@/lib/user-activity';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

    const { auditId, whiteLabel, leadEmail, leadName } = await request.json();
    const sendViaEmail = !!leadEmail;

    if (!auditId) {
      return NextResponse.json({ error: 'Audit ID is required' }, { status: 400 });
    }

    // Get user's brand information and agency (if client)
    const { data: userData } = await supabase
      .from('users')
      .select('account_type, brand_name, agency_id, full_name')
      .eq('id', user.id)
      .single();

    let clientName: string | null = null;
    let agencyNameForPdf: string | null = null;
    if (user.agency_id || userData?.agency_id) {
      const agencyId = user.agency_id || userData?.agency_id;
      clientName = user.full_name || userData?.full_name || user.email || 'Client';
      const { data: agencyUser } = await supabase
        .from('users')
        .select('brand_name, full_name')
        .eq('id', agencyId)
        .single();
      agencyNameForPdf = agencyUser?.brand_name || agencyUser?.full_name || 'Agency';
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

    // Brand: whiteLabel with companyName. Client: add clientName + agencyName for PDF header.
    const brandName = userData?.account_type === 'brand' && userData?.brand_name ? userData.brand_name : null;
    let whiteLabelData: { companyName?: string; clientName?: string; agencyName?: string } | undefined = whiteLabel || (brandName ? { companyName: brandName } : undefined);
    if (clientName && agencyNameForPdf) {
      whiteLabelData = { ...whiteLabelData, clientName, agencyName: agencyNameForPdf, companyName: whiteLabelData?.companyName ?? agencyNameForPdf };
    }

    const reportData = {
      domain: audit.domain,
      overall_score: audit.overall_score || 0,
      technical_score: audit.technical_score || 0,
      onpage_score: audit.onpage_score || 0,
      content_score: audit.content_score || 0,
      categories: audit.raw_data?.categories,
      technical: audit.raw_data?.technical || {},
      onpage: audit.raw_data?.onpage || {},
      content: audit.raw_data?.content || {},
      issues: issues,
      whiteLabel: whiteLabelData,
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

    if (sendViaEmail) {
      // Send PDF to the lead's email with attachment and download link
      try {
        await sendReportViaEmail(
          leadEmail,
          leadName || leadEmail?.split('@')[0] || 'there',
          audit.domain,
          shareToken,
          pdfBuffer
        );
        try {
          await touchUserLastActive(user.id);
          void syncUserToGhlById(user.id);
          await sendSmsForUserEvent({
            userId: user.id,
            event: 'report_ready',
            vars: {
              domain: audit.domain,
              link: `${getSiteUrl()}/audit/dashboard`,
            },
          });
        } catch (smsErr) {
          console.warn('GHL SMS report_ready (lead path):', smsErr);
        }
        return NextResponse.json({
          success: true,
          message: 'Report sent to your email. Check your inbox and use the download link in the email.',
        });
      } catch (emailError) {
        console.error('Error sending report via email:', emailError);
        return NextResponse.json(
          { error: 'Failed to send report to your email. Please try again.' },
          { status: 500 }
        );
      }
    }

    // No lead email: send notification to logged-in user and return PDF for direct download
    try {
      await sendReportDownloadedEmail(
        user.email || '',
        user.full_name || user.email?.split('@')[0] || 'User',
        audit.domain
      );
      try {
        await touchUserLastActive(user.id);
        void syncUserToGhlById(user.id);
        await sendSmsForUserEvent({
          userId: user.id,
          event: 'report_ready',
          vars: {
            domain: audit.domain,
            link: `${getSiteUrl()}/audit/dashboard`,
          },
        });
      } catch (smsErr) {
        console.warn('GHL SMS report_ready:', smsErr);
      }
    } catch (emailError) {
      console.error('Error sending report download email:', emailError);
      // Don't fail the request if email fails
    }

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
      categories: report.audits.raw_data?.categories,
      technical: report.audits.raw_data?.technical || {},
      onpage: report.audits.raw_data?.onpage || {},
      content: report.audits.raw_data?.content || {},
      issues: report.audits.raw_data?.issues || [],
      whiteLabel: report.white_label_branding || undefined,
    };

    const generator = new PDFReportGenerator();
    const pdfBuffer = await generator.generateReport(reportData);

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const pdfArray = new Uint8Array(pdfBuffer);

    return new NextResponse(pdfArray, {
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
