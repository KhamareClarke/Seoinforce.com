import { NextRequest, NextResponse } from 'next/server';
import { PDFReportGenerator } from '@/lib/reports/pdf-generator';

// Guest PDF generation - no authentication required
export async function POST(request: NextRequest) {
  try {
    const { auditData } = await request.json();

    if (!auditData) {
      return NextResponse.json({ error: 'Audit data is required' }, { status: 400 });
    }

    // Prepare report data
    const reportData = {
      domain: auditData.domain,
      overall_score: auditData.overall_score || 0,
      technical_score: auditData.technical_score || 0,
      onpage_score: auditData.onpage_score || 0,
      content_score: auditData.content_score || 0,
      technical: auditData.result?.technical || {},
      onpage: auditData.result?.onpage || {},
      content: auditData.result?.content || {},
      issues: auditData.result?.issues || [],
      whiteLabel: undefined,
    };

    // Generate PDF
    const generator = new PDFReportGenerator();
    const pdfBuffer = await generator.generateReport(reportData);

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const pdfArray = new Uint8Array(pdfBuffer);

    return new NextResponse(pdfArray, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="seo-audit-${auditData.domain}-${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Guest report generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate report' },
      { status: 500 }
    );
  }
}
