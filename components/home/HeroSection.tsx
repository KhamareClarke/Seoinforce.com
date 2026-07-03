'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { X, AlertTriangle, XCircle, Info, CheckCircle } from 'lucide-react';

const LOGOS = [
  { src: '/client1-Photoroom.png', alt: 'Client' },
  { src: '/identi-logo.png', alt: 'Identi' },
  { src: '/myapproved-logo.png', alt: 'MyApproved' },
  { src: '/omni-logo.png', alt: 'Omni' },
  { src: '/6.svg', alt: 'Partner' },
];

type Issue = {
  type: string;
  severity: 'critical' | 'warning' | 'info' | 'good';
  title: string;
  description: string;
  fix_suggestion: string;
};

type AuditResult = {
  overall_score: number;
  technical_score: number;
  onpage_score: number;
  content_score: number;
  result: {
    issues: Issue[];
    technical: { https: boolean; mobile: boolean; robots?: boolean; sitemap?: boolean; ssl_grade?: string };
    onpage: {
      title: { length: number; optimal: boolean; keyword?: boolean };
      description: { missing: boolean; length: number };
      h1: number;
      structured_data: boolean;
      open_graph: boolean;
      canonical?: boolean;
      twitter_card?: boolean;
      lang?: boolean;
      has_privacy_policy?: boolean;
      has_cookie_consent?: boolean;
      cms_detected?: string;
      accessibility_score?: number;
      social_presence?: { facebook: boolean; instagram: boolean; linkedin: boolean; twitter: boolean; youtube: boolean };
      h1_text?: string;
      noindex?: boolean;
    };
    content: { word_count: number; readability: number };
    ppc_signals?: {
      google_ads: boolean; facebook_pixel: boolean; microsoft_ads: boolean;
      linkedin_ads: boolean; tiktok_pixel: boolean;
      total_platforms: number; spend_estimate: string;
      activity_level: 'none' | 'light' | 'active' | 'heavy';
      platforms_found: string[];
    };
    spell_check?: {
      error_count: number;
      errors: Array<{ word: string; suggestion: string; context: string }>;
      checked_words: number;
    };
    local_grid?: {
      center_rank: number | null;
      avg_rank: number | null;
      cells_ranking: number;
      coverage_score: number;
      location_hint: string | null;
      basis: 'gmb' | 'schema' | 'estimated';
      grid: Array<{ row: number; col: number; rank: number | null; is_center: boolean }>;
    };
    local_rank?: {
      position: number | null;
      in_local_pack: boolean;
      competitors: string[];
      search_query: string;
      location_detected: string | null;
      source: 'google' | 'estimated';
      pack_present: boolean;
    };
    security_headers?: {
      score: number;
      grade: 'A' | 'B' | 'C' | 'D' | 'F';
      missing: string[];
      present: string[];
      hsts: boolean;
      csp: boolean;
    };
  };
};

const SEVERITY_CONFIG = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', Icon: XCircle },
  warning: { color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)', Icon: AlertTriangle },
  info: { color: '#60a5fa', bg: 'rgba(96,165,250,0.06)', border: 'rgba(96,165,250,0.15)', Icon: Info },
  good: { color: '#22c55e', bg: 'rgba(34,197,94,0.06)', border: 'rgba(34,197,94,0.15)', Icon: CheckCircle },
};

function scoreLabel(s: number) {
  if (s >= 80) return { text: 'Strong', color: '#22c55e' };
  if (s >= 60) return { text: 'Good', color: '#84cc16' };
  if (s >= 40) return { text: 'Needs Work', color: '#FFD700' };
  if (s >= 20) return { text: 'Poor', color: '#f97316' };
  return { text: 'Critical', color: '#ef4444' };
}

export default function HeroSection() {
  const [showModal, setShowModal] = useState(false);
  const [url, setUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [auditError, setAuditError] = useState('');

  const STEPS = [
    'Crawling your site…',
    'Checking technical health…',
    'Analysing on-page signals…',
    'Auditing content quality…',
    'Generating your report…',
  ];

  const analyze = async () => {
    if (!url.trim()) return;
    setAnalyzing(true);
    setResult(null);
    setAuditError('');
    setAnalyzeStep(0);

    // Step ticker for UX
    const ticker = setInterval(() => {
      setAnalyzeStep(s => Math.min(s + 1, STEPS.length - 1));
    }, 5000);

    try {
      const res = await fetch('/api/audit/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: url }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Analysis failed');
      const data = await res.json();
      if (data.success && data.overall_score != null) setResult(data);
      else throw new Error('Unexpected response');
    } catch (e: unknown) {
      setAuditError(e instanceof Error ? e.message : 'Failed. Please try again.');
    } finally {
      clearInterval(ticker);
      setAnalyzing(false);
    }
  };

  const reset = () => { setShowModal(false); setUrl(''); setResult(null); setAuditError(''); };

  // Derive top issues for display
  const topIssues = result
    ? [...result.result.issues]
        .sort((a, b) => {
          const order = { critical: 0, warning: 1, info: 2, good: 3 };
          return order[a.severity] - order[b.severity];
        })
        .slice(0, 4)
    : [];

  const criticalCount = result?.result.issues.filter(i => i.severity === 'critical').length ?? 0;
  const warningCount = result?.result.issues.filter(i => i.severity === 'warning').length ?? 0;
  const label = result ? scoreLabel(result.overall_score) : null;

  return (
    <>
      <section className="relative min-h-[100svh] flex flex-col overflow-hidden bg-[#0a0a0c]">
        <div className="absolute inset-0 dot-grid opacity-[0.55] pointer-events-none" />
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[800px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top, rgba(255,215,0,0.1) 0%, transparent 58%)' }}
        />

        <div className="relative z-10 max-w-[1240px] mx-auto px-6 sm:px-10 pt-14 pb-20 w-full">
          <div className="max-w-[820px] mx-auto text-center">

            <div className="inline-flex items-center gap-2.5 mb-9 px-4 py-1.5 rounded-full border border-[#FFD700]/25 bg-[#FFD700]/[0.06]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] gold-pulse shrink-0" />
              <span className="font-sans text-[12px] font-semibold text-[#FFD700]/85 tracking-[0.06em]">
                UK's Leading SEO Platform · Trusted by 10,000+ Businesses
              </span>
            </div>

            <h1
              className="font-heading text-[58px] sm:text-[76px] md:text-[90px] lg:text-[104px] text-white leading-[0.88] tracking-[-0.035em] mb-7"
              style={{ textShadow: '0 0 48px rgba(255,215,0,0.12)' }}
            >
              Dominate Search.
              <br />
              <span className="text-[#FFD700]" style={{ textShadow: '0 0 32px rgba(255,215,0,0.5), 0 0 64px rgba(255,215,0,0.22)' }}>
                Command Authority.
              </span>
            </h1>

            <p className="font-sans text-[18px] sm:text-[19px] text-white/65 leading-[1.65] max-w-[520px] mx-auto mb-9">
              The UK's most powerful SEO platform, built for service businesses that compete to win and demand real, measurable results.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-5">
              <button
                onClick={() => setShowModal(true)}
                className="group flex items-center gap-3 justify-center w-full sm:w-auto px-9 py-[17px] bg-[#FFD700] text-[#0a0a0c] font-sans text-[15px] font-black uppercase tracking-wider rounded-2xl hover:bg-[#FFF44F] shadow-[0_6px_32px_rgba(255,215,0,0.42)] hover:shadow-[0_10px_48px_rgba(255,215,0,0.62)] hover:scale-[1.03] transition-all duration-200"
              >
                Analyse My Website
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <a
                href="https://calendly.com/khamareclarke/new-meeting"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full sm:w-auto px-9 py-[17px] border border-[#FFD700]/35 text-[#FFD700]/80 font-sans text-[15px] font-semibold rounded-2xl hover:border-[#FFD700]/70 hover:text-[#FFD700] hover:bg-[#FFD700]/[0.05] transition-all duration-200"
              >
                Book a Strategy Call
              </a>
            </div>

            <p className="font-sans text-[12px] text-white/30 mb-9">
              14-day free trial · No credit card required · Cancel anytime
            </p>

            <div>
              <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-white/22 font-semibold mb-5">Trusted by teams at</p>
              <div className="flex items-center justify-center gap-7 sm:gap-12 flex-wrap">
                {LOGOS.map((logo, i) => (
                  <img key={i} src={logo.src} alt={logo.alt} className="h-5 sm:h-[22px] w-auto opacity-22 hover:opacity-55 grayscale hover:grayscale-0 transition-all duration-300" />
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Audit modal */}
      {showModal && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-[500px] my-8 bg-[#141418] border border-[#FFD700]/20 rounded-2xl shadow-[0_48px_100px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,215,0,0.06)]">

            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-28 pointer-events-none rounded-t-2xl overflow-hidden" style={{ background: 'radial-gradient(ellipse at top, rgba(255,215,0,0.09), transparent 70%)' }} />

            <div className="relative p-7 sm:p-8">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="font-display font-bold text-[20px] text-white tracking-tight">Free SEO Audit</h3>
                  <p className="font-sans text-[13px] text-white/38 mt-0.5">Instant results · No account needed</p>
                </div>
                <button onClick={reset} className="w-7 h-7 flex items-center justify-center text-white/22 hover:text-white/65 transition-colors rounded-lg hover:bg-white/[0.06]">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Input state */}
              {!result && !analyzing && (
                <div className="space-y-3">
                  <Input
                    type="text"
                    placeholder="yourdomain.com"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && analyze()}
                    className="bg-[#0a0a0c] border-white/[0.1] text-white placeholder:text-white/18 focus:border-[#FFD700]/45 h-12 rounded-xl font-sans text-[14px]"
                  />
                  {auditError && (
                    <p className="font-sans text-[12px] text-red-400/80 bg-red-400/[0.06] border border-red-400/20 rounded-lg px-3 py-2">{auditError}</p>
                  )}
                  <div className="flex gap-2.5">
                    <button
                      onClick={analyze}
                      disabled={!url.trim()}
                      className="flex-1 h-12 bg-[#FFD700] text-[#0a0a0c] font-sans text-[14px] font-black uppercase tracking-wider rounded-xl hover:bg-[#FFF44F] disabled:opacity-35 transition-all shadow-[0_4px_20px_rgba(255,215,0,0.32)]"
                    >
                      Run Free Audit
                    </button>
                    <button onClick={reset} className="h-12 px-5 border border-white/[0.1] text-white/38 font-sans text-[14px] rounded-xl hover:border-white/[0.18] hover:text-white/65 transition-all">
                      Cancel
                    </button>
                  </div>
                  {/* What we check */}
                  <div className="pt-2 grid grid-cols-2 gap-1.5">
                    {['HTTPS & Security', 'Core Web Vitals', 'Title & Meta Tags', 'H1–H6 Structure', 'Structured Data', 'Image Alt Tags', 'Internal Links', 'Content Quality', 'Mobile Viewport', 'Open Graph', 'Robots & Sitemap', 'Canonical URLs'].map(item => (
                      <div key={item} className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-[#FFD700]/50 flex-shrink-0" />
                        <span className="font-sans text-[11px] text-white/30">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Analysing state */}
              {analyzing && (
                <div className="text-center py-8">
                  <div className="inline-block w-10 h-10 rounded-full border-2 border-white/[0.07] border-t-[#FFD700] animate-spin mb-5" />
                  <p className="font-sans text-[14px] text-white font-semibold mb-1">{STEPS[analyzeStep]}</p>
                  <p className="font-sans text-[12px] text-white/30 mb-6">Running 40+ checks on your site</p>
                  <div className="flex justify-center gap-1.5">
                    {STEPS.map((_, i) => (
                      <div key={i} className="h-1 rounded-full transition-all duration-500" style={{ width: i <= analyzeStep ? 28 : 12, background: i <= analyzeStep ? '#FFD700' : 'rgba(255,255,255,0.1)' }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Result state */}
              {result && !analyzing && (
                <div className="space-y-3">

                  {/* Score header */}
                  <div className="flex items-center gap-4 bg-[#0a0a0c] border border-white/[0.07] rounded-xl p-5">
                    <div className="text-center flex-shrink-0">
                      <p
                        className="font-heading text-[56px] leading-none"
                        style={{ letterSpacing: '-2px', color: label?.color, textShadow: `0 0 24px ${label?.color}66` }}
                      >
                        {result.overall_score}
                      </p>
                      <p className="font-sans text-[9px] text-white/28 uppercase tracking-[0.16em] font-semibold mt-0.5">/ 100</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-[15px] font-bold mb-0.5" style={{ color: label?.color }}>{label?.text}</p>
                      <p className="font-sans text-[12px] text-white/38 leading-snug">
                        {criticalCount > 0
                          ? `${criticalCount} critical issue${criticalCount > 1 ? 's' : ''} found${warningCount > 0 ? ` + ${warningCount} warning${warningCount > 1 ? 's' : ''}` : ''} — costing you rankings now.`
                          : warningCount > 0
                          ? `${warningCount} warning${warningCount > 1 ? 's' : ''} found. Fixing these will lift your rankings.`
                          : 'Your site is in good shape. See the full report for growth opportunities.'}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="font-sans text-[10px] text-white/22">
                          {result.result.issues.length} issues · {result.result.content.word_count} words · Readability {result.result.content.readability}/100
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sub-score bars */}
                  <div className="bg-[#0a0a0c] border border-white/[0.07] rounded-xl px-5 py-4 space-y-2.5">
                    <p className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-white/25 mb-3">Score Breakdown</p>
                    {([
                      { label: 'Technical SEO', value: result.technical_score, hint: 'HTTPS · speed · crawlability · mobile' },
                      { label: 'On-Page SEO', value: result.onpage_score, hint: 'Title · meta · headings · schema · links' },
                      { label: 'Content Quality', value: result.content_score, hint: 'Depth · readability · keyword density' },
                      { label: 'Accessibility', value: result.result.onpage.accessibility_score ?? 0, hint: 'Lang · landmarks · ARIA · alt text' },
                    ] as const).map(({ label: lbl, value, hint }) => {
                      const c = value >= 70 ? '#22c55e' : value >= 40 ? '#FFD700' : '#ef4444';
                      return (
                        <div key={lbl}>
                          <div className="flex justify-between items-baseline mb-1">
                            <div className="flex items-baseline gap-2">
                              <span className="font-sans text-[11.5px] text-white/60 font-semibold">{lbl}</span>
                              <span className="font-sans text-[9.5px] text-white/20 hidden sm:inline">{hint}</span>
                            </div>
                            <span className="font-sans text-[11px] font-bold" style={{ color: c }}>{value}/100</span>
                          </div>
                          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: c, boxShadow: `0 0 6px ${c}44` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Top issues */}
                  {topIssues.length > 0 && (
                    <div className="bg-[#0a0a0c] border border-white/[0.07] rounded-xl overflow-hidden">
                      <div className="px-5 py-2.5 border-b border-white/[0.05] flex items-center justify-between">
                        <p className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-white/25">Top Issues Found</p>
                        <div className="flex items-center gap-2">
                          {criticalCount > 0 && <span className="font-sans text-[9px] font-black px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">{criticalCount} CRITICAL</span>}
                          {warningCount > 0 && <span className="font-sans text-[9px] font-black px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">{warningCount} WARN</span>}
                        </div>
                      </div>
                      <div className="divide-y divide-white/[0.04]">
                        {topIssues.map((issue, i) => {
                          const { color, bg, border, Icon } = SEVERITY_CONFIG[issue.severity];
                          return (
                            <div key={i} className="flex items-start gap-3 px-5 py-3" style={{ background: bg }}>
                              <Icon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color, filter: `drop-shadow(0 0 4px ${color}55)` }} strokeWidth={2.5} />
                              <div className="min-w-0 flex-1">
                                <p className="font-sans text-[12px] font-semibold text-white/80 leading-tight">{issue.title}</p>
                                <p className="font-sans text-[10.5px] text-white/35 mt-0.5 leading-snug">{issue.fix_suggestion}</p>
                              </div>
                              <span className="flex-shrink-0 font-sans text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color, background: `${color}15`, border: `1px solid ${border}` }}>
                                {issue.severity}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {result.result.issues.length > topIssues.length && (
                        <div className="px-5 py-2 border-t border-white/[0.05]">
                          <p className="font-sans text-[10.5px] text-white/25">+ {result.result.issues.length - topIssues.length} more issues in your full report</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick checklist — 10 items, 2 cols */}
                  <div className="bg-[#0a0a0c] border border-white/[0.07] rounded-xl px-5 py-4">
                    <p className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-white/25 mb-3">Checks At A Glance</p>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-3">
                      {([
                        { label: 'HTTPS / SSL', pass: result.result.technical.https },
                        { label: 'Mobile viewport', pass: result.result.technical.mobile },
                        { label: 'robots.txt', pass: !!(result.result.technical as any).robots },
                        { label: 'XML sitemap', pass: !!(result.result.technical as any).sitemap },
                        { label: 'Meta description', pass: !result.result.onpage.description.missing },
                        { label: 'Canonical URL', pass: !!result.result.onpage.canonical },
                        { label: 'H1 heading', pass: result.result.onpage.h1 === 1 },
                        { label: 'Open Graph tags', pass: result.result.onpage.open_graph },
                        { label: 'Structured data', pass: result.result.onpage.structured_data },
                        { label: 'Cookie consent', pass: !!result.result.onpage.has_cookie_consent },
                        { label: 'Privacy policy', pass: !!result.result.onpage.has_privacy_policy },
                        { label: 'Language tag', pass: !!result.result.onpage.lang },
                        { label: 'Security headers', pass: (result.result.security_headers?.grade ?? 'F') !== 'F' && (result.result.security_headers?.grade ?? 'F') !== 'D' },
                      ]).map(({ label: lbl, pass }) => (
                        <div key={lbl} className="flex items-center gap-1.5">
                          <span className="text-[11px] flex-shrink-0" style={{ color: pass ? '#22c55e' : '#ef4444' }}>{pass ? '✓' : '✗'}</span>
                          <span className="font-sans text-[11px] truncate" style={{ color: pass ? 'rgba(255,255,255,0.48)' : 'rgba(255,255,255,0.3)' }}>{lbl}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PPC Signals */}
                  <div className="bg-[#0a0a0c] border border-white/[0.07] rounded-xl px-5 py-4">
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-white/25">PPC / Paid Ads Detection</p>
                      {result.result.ppc_signals && (
                        <span className="font-sans text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
                          color: result.result.ppc_signals.activity_level === 'none' ? 'rgba(255,255,255,0.28)' : '#FFD700',
                          background: result.result.ppc_signals.activity_level === 'none' ? 'rgba(255,255,255,0.04)' : 'rgba(255,215,0,0.08)',
                          border: result.result.ppc_signals.activity_level === 'none' ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(255,215,0,0.2)',
                        }}>
                          {result.result.ppc_signals.activity_level === 'none' ? 'No PPC detected' : `${result.result.ppc_signals.total_platforms} platform${result.result.ppc_signals.total_platforms > 1 ? 's' : ''} active`}
                        </span>
                      )}
                    </div>
                    {result.result.ppc_signals && result.result.ppc_signals.total_platforms > 0 ? (
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap gap-1.5">
                          {(['Google Ads', 'Meta / Facebook', 'Microsoft Ads', 'LinkedIn Ads', 'TikTok Ads'] as const).map(platform => {
                            const found = result.result.ppc_signals!.platforms_found.includes(platform);
                            return (
                              <span key={platform} className="font-sans text-[10px] font-semibold px-2 py-0.5 rounded-full border" style={{
                                color: found ? '#22c55e' : 'rgba(255,255,255,0.2)',
                                background: found ? 'rgba(34,197,94,0.07)' : 'rgba(255,255,255,0.02)',
                                borderColor: found ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.06)',
                              }}>{platform}</span>
                            );
                          })}
                        </div>
                        <p className="font-sans text-[10.5px] text-white/32">Est. monthly spend: <span className="text-[#FFD700]/70 font-semibold">{result.result.ppc_signals.spend_estimate}</span></p>
                      </div>
                    ) : (
                      <p className="font-sans text-[10.5px] text-white/30">No Google Ads, Meta, or Microsoft Ads pixels detected. Your competitors may be running paid campaigns for your keywords.</p>
                    )}
                  </div>

                  {/* Spelling / Content Quality */}
                  {result.result.spell_check && (
                    <div className="bg-[#0a0a0c] border border-white/[0.07] rounded-xl px-5 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-white/25">Spelling & Content Quality</p>
                        <span className="font-sans text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
                          color: result.result.spell_check.error_count === 0 ? '#22c55e' : result.result.spell_check.error_count >= 5 ? '#f97316' : '#FFD700',
                          background: result.result.spell_check.error_count === 0 ? 'rgba(34,197,94,0.07)' : 'rgba(249,115,22,0.07)',
                          border: `1px solid ${result.result.spell_check.error_count === 0 ? 'rgba(34,197,94,0.22)' : 'rgba(249,115,22,0.2)'}`,
                        }}>
                          {result.result.spell_check.error_count === 0 ? '✓ No errors found' : `${result.result.spell_check.error_count} error${result.result.spell_check.error_count > 1 ? 's' : ''} found`}
                        </span>
                      </div>
                      {result.result.spell_check.error_count > 0 ? (
                        <div className="space-y-1">
                          {result.result.spell_check.errors.slice(0, 3).map((e, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="font-sans text-[10.5px] text-red-400/70 line-through">{e.word}</span>
                              <span className="font-sans text-[10px] text-white/25">→</span>
                              <span className="font-sans text-[10.5px] text-green-400/70">{e.suggestion}</span>
                            </div>
                          ))}
                          {result.result.spell_check.error_count > 3 && (
                            <p className="font-sans text-[10px] text-white/22">+ {result.result.spell_check.error_count - 3} more in full report</p>
                          )}
                        </div>
                      ) : (
                        <p className="font-sans text-[10.5px] text-white/30">Content passed spelling check — {result.result.spell_check.checked_words} words scanned.</p>
                      )}
                    </div>
                  )}

                  {/* Google Local Position */}
                  {result.result.local_rank && (
                    <div className="bg-[#0a0a0c] border border-white/[0.07] rounded-xl px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-white/25 mb-2">
                            Google Local Pack Position
                            {result.result.local_rank.source === 'google' && <span className="ml-2 text-[#22c55e]/60 normal-case">· live</span>}
                          </p>
                          {result.result.local_rank.pack_present ? (
                            result.result.local_rank.in_local_pack ? (
                              <div>
                                <p className="font-sans text-[13px] font-bold" style={{ color: (result.result.local_rank.position ?? 99) <= 3 ? '#22c55e' : '#FFD700' }}>
                                  #{result.result.local_rank.position} in local pack
                                  {result.result.local_rank.location_detected && <span className="text-white/30 font-normal"> · {result.result.local_rank.location_detected}</span>}
                                </p>
                              </div>
                            ) : (
                              <div>
                                <p className="font-sans text-[13px] font-bold text-red-400">Not in local pack</p>
                                <p className="font-sans text-[10.5px] text-white/30 mt-0.5">
                                  Google is showing a local 3-pack for <span className="text-white/50">"{result.result.local_rank.search_query}"</span> — your business isn't in it.
                                </p>
                                {result.result.local_rank.competitors.length > 0 && (
                                  <p className="font-sans text-[10px] text-white/22 mt-1">
                                    Ranking above you: {result.result.local_rank.competitors.join(', ')}
                                  </p>
                                )}
                              </div>
                            )
                          ) : (
                            <p className="font-sans text-[11px] text-white/35">
                              {result.result.local_rank.source === 'google'
                                ? 'No local pack shown for this search — may not be a local business query.'
                                : 'Local ranking data unavailable — add Google Business Profile details for live data.'}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-white/25 mb-1">Security</p>
                          <span className="font-heading text-[22px] leading-none font-bold" style={{
                            color: { A: '#22c55e', B: '#84cc16', C: '#FFD700', D: '#f97316', F: '#ef4444' }[result.result.security_headers?.grade ?? 'F'],
                          }}>
                            {result.result.security_headers?.grade ?? 'F'}
                          </span>
                          <p className="font-sans text-[9px] text-white/22 mt-0.5">{result.result.security_headers?.present.length ?? 0}/6 headers</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Local Ranking Grid (mini preview + pro teaser) */}
                  <div className="bg-[#0a0a0c] border border-white/[0.07] rounded-xl px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-white/25 mb-1.5">Local Ranking Grid</p>
                        {result.result.local_grid && (
                          <p className="font-sans text-[10.5px] text-white/35 mb-2.5">
                            Est. centre rank: <span style={{ color: result.result.local_grid.center_rank ? (result.result.local_grid.center_rank <= 3 ? '#22c55e' : result.result.local_grid.center_rank <= 10 ? '#FFD700' : '#f97316') : '#ef4444' }} className="font-bold">
                              {result.result.local_grid.center_rank ? `#${result.result.local_grid.center_rank}` : 'Not ranking'}
                            </span>
                            {' · '}Coverage: <span className="font-bold text-white/50">{result.result.local_grid.coverage_score}%</span>
                          </p>
                        )}
                        {/* Mini 3×3 grid preview (centre 9 cells of the 5×5) */}
                        {result.result.local_grid && (
                          <div className="grid gap-0.5 relative" style={{ gridTemplateColumns: 'repeat(3,1fr)', width: 90 }}>
                            <div className="absolute inset-0 backdrop-blur-[1px] bg-[#0a0a0c]/40 rounded z-10 flex items-center justify-center">
                              <span className="font-sans text-[8px] text-white/30 font-bold uppercase tracking-wider">Pro</span>
                            </div>
                            {result.result.local_grid.grid.filter(c => c.row >= 1 && c.row <= 3 && c.col >= 1 && c.col <= 3).map((cell, i) => {
                              const r = cell.rank;
                              const bg = r === null ? '#1a0a0a' : r <= 3 ? 'rgba(34,197,94,0.25)' : r <= 10 ? 'rgba(255,215,0,0.18)' : 'rgba(249,115,22,0.15)';
                              const color = r === null ? 'rgba(255,255,255,0.15)' : r <= 3 ? '#22c55e' : r <= 10 ? '#FFD700' : '#f97316';
                              return (
                                <div key={i} className="rounded flex items-center justify-center" style={{ height: 24, background: bg, border: cell.is_center ? '1px solid rgba(255,215,0,0.5)' : '1px solid rgba(255,255,255,0.05)' }}>
                                  <span className="font-sans text-[9px] font-bold" style={{ color }}>{r ?? '–'}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <a href="/sign-up" className="flex-shrink-0 text-right">
                        <p className="font-sans text-[10px] font-bold text-[#FFD700]/80 hover:text-[#FFD700] transition-colors">See full 5×5 grid →</p>
                        <p className="font-sans text-[9px] text-white/22 mt-0.5">Live data with Pro</p>
                      </a>
                    </div>
                  </div>

                  {/* Social presence + CMS row */}
                  <div className="bg-[#0a0a0c] border border-white/[0.07] rounded-xl px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-white/25 mb-2">Social Presence</p>
                        <div className="flex gap-2 flex-wrap">
                          {(['facebook', 'instagram', 'linkedin', 'twitter', 'youtube'] as const).map(platform => {
                            const found = result.result.onpage.social_presence?.[platform] ?? false;
                            return (
                              <span key={platform} className="font-sans text-[10px] font-semibold capitalize px-2 py-0.5 rounded-full border" style={{
                                color: found ? '#22c55e' : 'rgba(255,255,255,0.2)',
                                background: found ? 'rgba(34,197,94,0.07)' : 'rgba(255,255,255,0.02)',
                                borderColor: found ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.06)',
                              }}>
                                {platform === 'twitter' ? 'X / Twitter' : platform.charAt(0).toUpperCase() + platform.slice(1)}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      {result.result.onpage.cms_detected && (
                        <div className="flex-shrink-0 text-right">
                          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-white/25 mb-1.5">CMS</p>
                          <span className="font-sans text-[11px] font-semibold text-[#FFD700]/70 bg-[#FFD700]/[0.06] border border-[#FFD700]/15 px-2 py-0.5 rounded-full">
                            {result.result.onpage.cms_detected}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Visibility teaser */}
                  <div className="flex items-center justify-between px-4 py-3.5 bg-[#FFD700]/[0.05] border border-[#FFD700]/18 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <span className="font-sans text-[14px] text-[#FFD700]">✦</span>
                      <div>
                        <p className="font-sans text-[12px] font-bold text-[#FFD700]/90">AI Visibility Score</p>
                        <p className="font-sans text-[10px] text-white/28">Are you visible on ChatGPT, Gemini, Perplexity?</p>
                      </div>
                    </div>
                    <a href="/sign-up" className="font-sans text-[11px] font-black uppercase tracking-wide text-[#FFD700] hover:text-[#FFF44F] whitespace-nowrap transition-colors">
                      Unlock →
                    </a>
                  </div>

                  {/* Backlink + Local teaser row */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Backlink Profile', sub: 'Domain authority · lost links' },
                      { label: 'Local SEO Score', sub: 'GMB · NAP · local citations' },
                    ].map(({ label: lbl, sub }) => (
                      <div key={lbl} className="flex items-center justify-between px-3.5 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                        <div>
                          <p className="font-sans text-[11px] font-bold text-white/45">{lbl}</p>
                          <p className="font-sans text-[9.5px] text-white/22">{sub}</p>
                        </div>
                        <span className="font-sans text-[9px] font-black uppercase tracking-wider text-white/20 bg-white/[0.04] border border-white/[0.07] rounded px-1.5 py-0.5">Pro</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => { window.location.href = '/sign-up'; }}
                    className="w-full py-3.5 bg-[#FFD700] text-[#0a0a0c] font-sans text-[14px] font-black uppercase tracking-wider rounded-xl hover:bg-[#FFF44F] transition-all shadow-[0_4px_20px_rgba(255,215,0,0.38)]"
                  >
                    Get Full Report Free — No Card Needed
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => { setUrl(''); setResult(null); }} className="flex-1 h-10 border border-white/[0.09] text-white/32 font-sans text-[12px] rounded-xl hover:border-white/[0.16] hover:text-white/55 transition-all">
                      Analyse Another
                    </button>
                    <button onClick={reset} className="flex-1 h-10 border border-white/[0.09] text-white/32 font-sans text-[12px] rounded-xl hover:border-white/[0.16] hover:text-white/55 transition-all">
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
