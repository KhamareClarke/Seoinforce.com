import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { getCurrentUser, User } from '@/lib/auth';
import { SEOAuditEngine } from '@/lib/seo/audit-engine';
import { BacklinkChecker } from '@/lib/seo/backlink-checker';
import { LocalSEOChecker } from '@/lib/seo/local-seo';
import { logError } from '@/lib/utils/error-logger';
import { sendAuditCompletedEmail, sendAuditExpiredEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  let user: User | null = null;
  try {
    user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

    const { domain, projectId } = await request.json();

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    // Check user's profile and ban status, create if doesn't exist
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('api_credits, plan_type, is_banned')
      .eq('id', user.id)
      .single();

    // Get user's audit count and account type
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('audit_count, account_type, brand_name')
      .eq('id', user.id)
      .single();

    let auditCount = userData?.audit_count || 0;
    const accountType = userData?.account_type || 'personal';
    const brandName = userData?.brand_name || null;
    
    // If audit_count column doesn't exist, default to 0
    if (userError && userError.message?.includes('column') && userError.message?.includes('does not exist')) {
      console.warn('audit_count column missing - defaulting to 0. Please run migration.');
      auditCount = 0;
    }

    // If profile query failed or profile doesn't exist, try to create it
    if (profileError || !profile) {
      console.log('Profile query result:', { profile, profileError });
      
      // Try to create the profile
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.full_name || user.email?.split('@')[0] || 'User',
          plan_type: 'free',
          api_credits: 100,
        })
        .select('api_credits, plan_type, is_banned')
        .single();

      if (createError) {
        console.error('Error creating profile:', createError);
        // If it's a duplicate key error, the profile exists but we couldn't read it
        // Use default values and continue
        if (createError.code === '23505' || createError.message?.includes('duplicate') || createError.message?.includes('unique')) {
          console.log('Profile exists but could not be read, using default values');
          profile = {
            api_credits: 100,
            plan_type: 'free',
            is_banned: false,
          };
        } else {
          return NextResponse.json(
            { error: `Failed to access profile: ${createError.message || 'Please try again.'}` },
            { status: 500 }
          );
        }
      } else if (newProfile) {
        profile = newProfile;
      } else {
        // If we can't create or read, use defaults
        console.log('Using default profile values');
        profile = {
          api_credits: 100,
          plan_type: 'free',
          is_banned: false,
        };
      }
    }

    if (profile.is_banned) {
      return NextResponse.json(
        { error: 'Your account has been banned. Please contact support.' },
        { status: 403 }
      );
    }

    // For free plan: Allow 2 free audits, then require payment
    // For brand accounts on free plan: Allow 2 free audits, then require brand plan
    // IMPORTANT: Check BEFORE incrementing to prevent race conditions
    const isBrandAccount = accountType === 'brand';
    const isFreePlan = profile.plan_type === 'free';
    
    if (isFreePlan && auditCount >= 2) {
      // Send audit expiration email
      try {
        await sendAuditExpiredEmail(
          user.email || '',
          user.full_name || user.email?.split('@')[0] || 'User'
        );
      } catch (emailError) {
        console.error('Error sending audit expiration email:', emailError);
        // Don't fail the request if email fails
      }

      const errorMessage = isBrandAccount
        ? 'You have reached your free audit limit. Please upgrade to the Brand plan to continue.'
        : 'You have reached your free audit limit. Please upgrade to continue.';

      return NextResponse.json(
        { 
          error: errorMessage,
          requiresPayment: true,
          requiresBrandPlan: isBrandAccount,
          auditCount: auditCount
        },
        { status: 403 }
      );
    }

    // Increment audit count BEFORE running audit to prevent race conditions
    // This ensures that if multiple requests come in, only the allowed number will pass
    if (isFreePlan) {
      // First, ensure the audit_count column exists by trying to add it if needed
      // Then increment the count
      const { error: incrementError } = await supabase
        .from('users')
        .update({ audit_count: auditCount + 1 })
        .eq('id', user.id);
      
      if (incrementError) {
        console.error('Error incrementing audit count:', incrementError);
        // If column doesn't exist, this is a database schema issue
        if (incrementError.message?.includes('column') && incrementError.message?.includes('does not exist')) {
          // Column doesn't exist - return a helpful error message
          return NextResponse.json(
            { 
              error: 'Database configuration error: audit_count column is missing. Please run the migration in Supabase SQL Editor: ALTER TABLE public.users ADD COLUMN IF NOT EXISTS audit_count INTEGER DEFAULT 0;',
              requiresMigration: true
            },
            { status: 500 }
          );
        } else {
          return NextResponse.json(
            { error: 'Failed to update audit count. Please try again.' },
            { status: 500 }
          );
        }
      }
      
      // Successfully incremented, update the local variable for later use
      auditCount = auditCount + 1;
    }

    // For paid plans (including brand plan): Check API credits
    if (profile.plan_type !== 'free' && profile.api_credits < 1) {
      // Send audit expiration email
      try {
        await sendAuditExpiredEmail(
          user.email || '',
          user.full_name || user.email?.split('@')[0] || 'User'
        );
      } catch (emailError) {
        console.error('Error sending audit expiration email:', emailError);
        // Don't fail the request if email fails
      }

      return NextResponse.json(
        { error: 'Insufficient API credits. Please upgrade your plan.' },
        { status: 403 }
      );
    }

    // Create audit record
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .insert({
        project_id: projectId || null,
        domain,
        status: 'processing',
      })
      .select()
      .single();

    if (auditError) {
      return NextResponse.json({ error: 'Failed to create audit' }, { status: 500 });
    }

    // Run audit in background (for production, use a queue system)
    const auditEngine = new SEOAuditEngine(domain);
    
    try {
      const result = await auditEngine.runAudit();
      
      // Get PageSpeed Insights data if available
      // Try to get it, but don't block the audit if it's slow
      let psiData = null;
      try {
        // Try with a 30 second timeout - Google API can be slow
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
          console.log('PageSpeed Insights: Successfully fetched and included in result', psiData);
        }
      } catch (psiError) {
        console.warn('PageSpeed Insights timed out or failed (non-critical):', psiError);
        // Continue without PageSpeed data - don't fail the audit
        // We'll fetch it in the background and update later
      }
      
      // Also try to fetch in background with longer timeout for future updates
      // Only if initial fetch didn't succeed
      if (!psiData && projectId && audit?.id) {
        console.log(`Starting background PageSpeed fetch for audit ${audit.id}`);
        // Fetch in background with 60 second timeout and update database when done
        (async () => {
          try {
            // Create a new instance to avoid conflicts
            const bgAuditEngine = new SEOAuditEngine(domain);
            const backgroundPsiData = await Promise.race([
              bgAuditEngine.getPageSpeedInsights(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('PageSpeed Insights timeout')), 60000)
              )
            ]) as any;
            
            if (backgroundPsiData) {
              console.log('Background PageSpeed fetch succeeded:', backgroundPsiData);
              
              // Get current raw_data
              const { data: currentAudit, error: fetchError } = await supabase
                .from('audits')
                .select('raw_data')
                .eq('id', audit.id)
                .single();
              
              if (fetchError) {
                console.error('Error fetching current audit for update:', fetchError);
                return;
              }
              
              const updatedRawData = currentAudit?.raw_data || result;
              updatedRawData.technical = {
                ...updatedRawData.technical,
                lcp: backgroundPsiData.lcp,
                fcp: backgroundPsiData.fcp,
                tti: backgroundPsiData.tti,
              };
              
              // Update audit with PageSpeed data
              const { error: updateError } = await supabase
                .from('audits')
                .update({ raw_data: updatedRawData })
                .eq('id', audit.id);
              
              if (updateError) {
                console.error('Error updating audit with PageSpeed data:', updateError);
              } else {
                console.log('Successfully updated audit raw_data with PageSpeed metrics');
              }
              
              // Also save to vitals_history
              if (backgroundPsiData.lcp || backgroundPsiData.fcp || backgroundPsiData.tti) {
                const { error: vitalsError } = await supabase
                  .from('vitals_history')
                  .upsert({
                    audit_id: audit.id,
                    lcp: backgroundPsiData.lcp,
                    fcp: backgroundPsiData.fcp,
                    tti: backgroundPsiData.tti,
                    cls: backgroundPsiData.cls,
                    date: new Date().toISOString().split('T')[0],
                  }, { onConflict: 'audit_id,date' });
                
                if (vitalsError) {
                  console.error('Error saving vitals history:', vitalsError);
                } else {
                  console.log('Successfully saved vitals history');
                }
              }
              
              console.log('PageSpeed Insights: Background fetch completed and saved to database');
            }
          } catch (bgError) {
            console.warn('PageSpeed Insights: Background fetch failed', bgError);
          }
        })();
      }

      // Get backlinks (non-blocking, don't fail audit if this fails)
      let backlinkData = null;
      try {
        const backlinkChecker = new BacklinkChecker();
        backlinkData = await backlinkChecker.getBacklinks(domain);
        
        // Only save backlinks if we got actual data (not zeros from fallback)
        if (backlinkData && (backlinkData.total_count > 0 || backlinkData.domain_count > 0)) {
          console.log(`Backlinks found: ${backlinkData.total_count} total, ${backlinkData.domain_count} domains`);
          
          // Save backlinks to database if project exists
          if (projectId) {
            const { data: existingBacklink } = await supabase
              .from('backlinks')
              .select('id')
              .eq('project_id', projectId)
              .single();
            
            if (existingBacklink) {
              await supabase
                .from('backlinks')
                .update({
                  total_count: backlinkData.total_count,
                  domain_count: backlinkData.domain_count,
                  anchor_text: backlinkData.anchor_text,
                  last_checked: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existingBacklink.id);
            } else {
              await supabase
                .from('backlinks')
                .insert({
                  project_id: projectId,
                  total_count: backlinkData.total_count,
                  domain_count: backlinkData.domain_count,
                  anchor_text: backlinkData.anchor_text,
                  last_checked: new Date().toISOString(),
                });
            }
            console.log('Backlinks saved to database');
          }
        } else {
          console.log('No backlink data found (domain not in OpenLinkProfiler database or scraping failed)');
          // Don't save zeros - this means no data was found
        }
      } catch (error) {
        console.warn('Backlink check failed (non-critical):', error);
      }

      // Get local SEO data (non-blocking, don't fail audit if this fails)
      let localSEOData = null;
      try {
        const localSEOChecker = new LocalSEOChecker();
        localSEOData = await localSEOChecker.checkLocalSEO(domain);
        
        // Save local SEO to database if project exists
        if (projectId) {
          const { data: existingLocalSEO } = await supabase
            .from('local_seo')
            .select('id')
            .eq('project_id', projectId)
            .single();
          
          if (existingLocalSEO) {
            await supabase
              .from('local_seo')
              .update({
                business_name: localSEOData.business_name,
                address: localSEOData.address,
                phone: localSEOData.phone,
                gmb_present: localSEOData.gmb_present,
                gmb_url: localSEOData.gmb_url,
                review_count: localSEOData.review_count,
                average_rating: localSEOData.average_rating,
                nap_consistency_score: localSEOData.nap_consistency_score,
                local_rank: localSEOData.local_rank,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingLocalSEO.id);
          } else {
            await supabase
              .from('local_seo')
              .insert({
                project_id: projectId,
                business_name: localSEOData.business_name,
                address: localSEOData.address,
                phone: localSEOData.phone,
                gmb_present: localSEOData.gmb_present,
                gmb_url: localSEOData.gmb_url,
                review_count: localSEOData.review_count,
                average_rating: localSEOData.average_rating,
                nap_consistency_score: localSEOData.nap_consistency_score,
                local_rank: localSEOData.local_rank,
              });
          }
        }
      } catch (error) {
        console.warn('Local SEO check failed (non-critical):', error);
      }

      // Add backlinks and local SEO to result
      if (backlinkData) {
        result.backlinks = backlinkData;
      }
      if (localSEOData) {
        result.local_seo = localSEOData;
      }

      // Update audit with results
      await supabase
        .from('audits')
        .update({
          overall_score: result.overall_score,
          technical_score: result.technical_score,
          onpage_score: result.onpage_score,
          content_score: result.content_score,
          raw_data: result,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', audit.id);

      // Send audit completion email
      try {
        await sendAuditCompletedEmail(
          user.email || '',
          user.full_name || user.email?.split('@')[0] || 'User',
          domain,
          result.overall_score || 0
        );
      } catch (emailError) {
        console.error('Error sending audit completion email:', emailError);
        // Don't fail the request if email fails
      }

      // Save issues
      if (result.issues && result.issues.length > 0) {
        console.log(`Saving ${result.issues.length} issues to database for audit ${audit.id}`);
        const { data: insertedIssues, error: issuesError } = await supabase
          .from('audit_issues')
          .insert(
            result.issues.map(issue => ({
              audit_id: audit.id,
              issue_type: issue.type,
              severity: issue.severity,
              title: issue.title,
              description: issue.description,
              fix_suggestion: issue.fix_suggestion,
              page_url: issue.page_url || null,
            }))
          )
          .select();
        
        if (issuesError) {
          console.error('Error saving issues to database:', issuesError);
          // Don't fail the audit, but log the error
        } else {
          console.log(`Successfully saved ${insertedIssues?.length || 0} issues`);
        }
      } else {
        console.log('No issues to save for audit', audit.id);
      }

      // Audit count already incremented for free plans before audit started
      // Only increment for paid plans here (though they use API credits, not audit_count)
      // Update API credits only for paid plans (free plan uses audit_count limit)
      if (profile.plan_type !== 'free') {
        await supabase
          .from('profiles')
          .update({ api_credits: profile.api_credits - 1 })
          .eq('id', user.id);
      }

      // Log API usage (non-blocking - don't fail audit if logging fails)
      try {
        // Verify user exists in users table before logging
        const { data: userCheck } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();

        if (userCheck) {
          await supabase
            .from('api_usage')
            .insert({
              user_id: user.id,
              api_type: 'audit',
              endpoint: '/api/audit',
              credits_used: 1,
            });
        } else {
          console.warn(`User ${user.id} not found in users table, skipping API usage log`);
        }
      } catch (usageError) {
        console.error('Failed to log API usage (non-blocking):', usageError);
        // Don't fail the audit if API usage logging fails
      }

      return NextResponse.json({
        audit_id: audit.id,
        result,
      });
    } catch (error) {
      // Update audit status to failed
      await supabase
        .from('audits')
        .update({
          status: 'failed',
        })
        .eq('id', audit.id);

      // Log error
      await logError({
        errorType: 'audit_execution_error',
        errorMessage: error instanceof Error ? error.message : 'Audit execution failed',
        errorStack: error instanceof Error ? error.stack : undefined,
        endpoint: '/api/audit',
        requestData: { domain, projectId },
        severity: 'error',
        userId: user.id,
      });

      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Audit failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Audit API error:', error);
    
    // Log error
    if (user) {
      await logError({
        errorType: 'audit_api_error',
        errorMessage: error instanceof Error ? error.message : 'Internal server error',
        errorStack: error instanceof Error ? error.stack : undefined,
        endpoint: '/api/audit',
        severity: 'critical',
        userId: user.id,
      });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

    const { searchParams } = new URL(request.url);
    const auditId = searchParams.get('id');
    const projectId = searchParams.get('project_id');

    if (auditId) {
      const { data: audit, error } = await supabase
        .from('audits')
        .select(`
          *,
          projects!inner(user_id),
          audit_issues(*)
        `)
        .eq('id', auditId)
        .single();

      if (error || audit.projects.user_id !== user.id) {
        return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
      }

      return NextResponse.json({ audit });
    }

    if (projectId) {
      const { data: audits, error } = await supabase
        .from('audits')
        .select(`
          *,
          projects!inner(user_id),
          audit_issues(*)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch audits' }, { status: 500 });
      }

      return NextResponse.json({ audits });
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  } catch (error) {
    console.error('Get audit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
