import { NextRequest, NextResponse } from 'next/server';
import { SEOAuditEngine } from '@/lib/seo/audit-engine';
import { LocalSEOChecker } from '@/lib/seo/local-seo';
import { BacklinkChecker } from '@/lib/seo/backlink-checker';

// Guest audit endpoint — no authentication required
export async function POST(request: NextRequest) {
  try {
    const { domain, include_backlinks, include_local_seo } = await request.json();

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    const normalizedDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

    const auditEngine = new SEOAuditEngine(normalizedDomain);

    try {
      const result = await auditEngine.runAudit();

      // PageSpeed Insights (non-critical, has timeout)
      try {
        const psiData = await Promise.race([
          auditEngine.getPageSpeedInsights(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('PageSpeed Insights timeout')), 30000)
          ),
        ]) as any;

        if (psiData) {
          result.technical.lcp = psiData.lcp;
          result.technical.fcp = psiData.fcp;
          result.technical.tti = psiData.tti;
        }
      } catch {
        // Non-critical
      }

      // Backlinks (opt-in, non-blocking)
      if (include_backlinks) {
        try {
          const checker = new BacklinkChecker();
          result.backlinks = await Promise.race([
            checker.getBacklinks(normalizedDomain),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 20000)),
          ]);
        } catch {
          // Non-critical — backlinks stay undefined
        }
      }

      // Local SEO (opt-in, non-blocking)
      if (include_local_seo) {
        try {
          const localChecker = new LocalSEOChecker();
          result.local_seo = await Promise.race([
            localChecker.checkLocalSEO(normalizedDomain),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000)),
          ]);
        } catch {
          // Non-critical
        }
      }

      const overallScore = result.overall_score ?? 0;
      const technicalScore = result.technical_score ?? 0;
      const onpageScore = result.onpage_score ?? 0;
      const contentScore = result.content_score ?? 0;

      return NextResponse.json({
        success: true,
        domain: normalizedDomain,
        overall_score: overallScore,
        technical_score: technicalScore,
        onpage_score: onpageScore,
        content_score: contentScore,
        result,
      });
    } catch (auditError) {
      console.error('Guest audit error:', auditError);
      return NextResponse.json(
        { error: 'Failed to run audit. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Guest audit API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
