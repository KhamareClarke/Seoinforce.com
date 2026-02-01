import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { SEOAuditEngine } from '@/lib/seo/audit-engine';

// Guest audit endpoint - no authentication required
export async function POST(request: NextRequest) {
  try {
    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    // Normalize domain
    const normalizedDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

    // Run audit without saving to database (guest mode)
    const auditEngine = new SEOAuditEngine(normalizedDomain);
    
    try {
      const result = await auditEngine.runAudit();
      
      console.log('Guest audit result:', {
        overall_score: result.overall_score,
        technical_score: result.technical_score,
        onpage_score: result.onpage_score,
        content_score: result.content_score,
      });
      
      // Get PageSpeed Insights data if available (with timeout)
      let psiData = null;
      try {
        psiData = await Promise.race([
          auditEngine.getPageSpeedInsights(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('PageSpeed Insights timeout')), 30000)
          )
        ]) as any;
        
        if (psiData) {
          result.technical.lcp = psiData.lcp;
          result.technical.fcp = psiData.fcp;
          result.technical.tti = psiData.tti;
        }
      } catch (psiError) {
        console.warn('PageSpeed Insights timed out or failed (non-critical):', psiError);
      }

      // Scores are already calculated in the result from runAudit()
      // Use the scores directly from the result object
      const overallScore = result.overall_score ?? 0;
      const technicalScore = result.technical_score ?? 0;
      const onpageScore = result.onpage_score ?? 0;
      const contentScore = result.content_score ?? 0;

      // Validate that we have a valid result
      if (overallScore === 0 && technicalScore === 0 && onpageScore === 0 && contentScore === 0) {
        console.warn('All scores are 0 - audit may have failed or website has critical issues');
      }

      // Return result without saving to database
      return NextResponse.json({
        success: true,
        domain: normalizedDomain,
        overall_score: overallScore,
        technical_score: technicalScore,
        onpage_score: onpageScore,
        content_score: contentScore,
        result: result,
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
