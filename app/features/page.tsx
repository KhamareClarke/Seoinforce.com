import NextLink from 'next/link';
import {
  Search, BarChart2, TrendingUp, FileText, Zap, Users,
  Link2, MapPin, Sparkles, ShieldCheck, Globe, Bell,
  Check, X,
} from 'lucide-react';

const FEATURES = [
  {
    Icon: Search,
    title: 'AI-Powered SEO Audits',
    desc: 'Technical audits that surface critical issues, Core Web Vitals, missing structured data, and quick wins in under 60 seconds. No manual crawl setup. No waiting days for reports.',
    pills: ['Technical health', 'Core Web Vitals', 'On-page scoring', 'Content analysis'],
  },
  {
    Icon: BarChart2,
    title: 'Competitor Intelligence',
    desc: "Uncover exactly what your rivals rank for, where they earn links, and which content gaps they've left open. Know before they know you're watching.",
    pills: ['Keyword gap analysis', 'Competitor rank tracking', 'Domain comparison', 'Content gap finder'],
  },
  {
    Icon: TrendingUp,
    title: 'Keyword & Rank Tracking',
    desc: 'Daily UK position monitoring for every keyword you care about. Instant alerts when you climb or when a competitor moves in. 100 to unlimited keywords.',
    pills: ['Daily rank updates', 'UK location targeting', 'Rank history charts', 'Rank alerts'],
  },
  {
    Icon: Link2,
    title: 'Backlink Analysis',
    desc: 'Discover your complete backlink profile: total link count, referring domains, anchor text distribution, and link-building opportunities your competitors are already exploiting.',
    pills: ['Domain authority', 'Anchor text breakdown', 'Link opportunities', 'Competitor backlinks'],
  },
  {
    Icon: MapPin,
    title: 'Local SEO Intelligence',
    desc: 'For service-area businesses: GMB presence detection, NAP consistency scoring, structured data validation, and local signal analysis.',
    pills: ['GMB detection', 'NAP consistency', 'LocalBusiness schema', 'Contact page audit'],
  },
  {
    Icon: Sparkles,
    title: 'AI Visibility Score',
    desc: 'The first SEO platform to score how visible your brand is inside ChatGPT, Gemini, and Perplexity. Track your AIO/GEO signals and get actionable recommendations to get cited by AI.',
    pills: ['ChatGPT visibility', 'Gemini visibility', 'Perplexity visibility', 'Entity optimisation'],
    badge: 'New',
  },
  {
    Icon: FileText,
    title: 'White-Label Reports',
    desc: 'Fully branded SEO reports for your clients. Your logo, your colours, your cover page. Schedule automated PDF delivery weekly or monthly. Zero effort per client.',
    pills: ['Custom branding', 'PDF & CSV export', 'Scheduled delivery', 'Client portal'],
  },
  {
    Icon: Zap,
    title: 'Content Optimisation',
    desc: 'AI-assisted content briefs and on-page recommendations aligned to search intent. See exactly which terms to add, which headings to restructure, and which content to expand.',
    pills: ['AI content briefs', 'Keyword optimisation', 'Readability scoring', 'Heading structure'],
  },
  {
    Icon: Globe,
    title: 'Technical Deep Dive',
    desc: 'Beyond the basics: redirect chains, mixed content, crawl depth, hreflang, canonical issues, and structured data errors. The diagnostics your developer needs to actually fix things.',
    pills: ['Redirect chains', 'Mixed content', 'hreflang audit', 'Schema validation'],
  },
  {
    Icon: Bell,
    title: 'Rank Alerts & Notifications',
    desc: 'Know the moment something changes. Rank drop alerts, new competitor entries, technical regressions — delivered via email or SMS so your team can act before traffic falls.',
    pills: ['Email alerts', 'SMS via GoHighLevel', 'Rank drop detection', 'Competitor alerts'],
  },
  {
    Icon: ShieldCheck,
    title: 'Full API Access',
    desc: 'Empire plan includes a documented REST API with webhooks. Embed SEO data directly into your internal dashboards, CRMs, or client-facing reporting tools.',
    pills: ['REST API', 'Webhooks', 'White-label embeds', 'CRM integration'],
  },
  {
    Icon: Users,
    title: 'Done-For-You SEO',
    desc: 'Our UK-based team executes your strategy end-to-end: technical fixes, content creation, link building, and reporting — all tracked transparently inside the SEOInForce platform.',
    pills: ['Technical SEO', 'Content creation', 'Link building', 'Dedicated strategist'],
  },
];

// What the audit covers — used for the audit coverage section
const AUDIT_CHECKS = [
  { category: 'Technical', items: ['HTTPS / SSL certificate', 'Mobile viewport meta tag', 'Robots.txt presence', 'Sitemap.xml presence', 'Redirect chain analysis', 'Mixed content detection', 'Page speed (LCP, FCP, CLS)', 'Crawlability estimate'] },
  { category: 'On-Page', items: ['Title tag length & keyword', 'Meta description quality', 'H1 / H2 / H3 structure', 'Image alt text coverage', 'Canonical URL', 'Open Graph tags', 'Twitter Card tags', 'Internal & external links'] },
  { category: 'Content', items: ['Word count vs benchmark', 'Readability score', 'Keyword density & top terms', 'Content structure', 'Duplicate content signals', 'Content gap opportunities', 'E-E-A-T signals', 'FAQs & structured answers'] },
  { category: 'Advanced', items: ['JSON-LD structured data', 'Schema.org validation', 'LocalBusiness schema', 'hreflang (multilingual)', 'Backlink profile summary', 'Local SEO & GMB check', 'AI Visibility Score', 'Competitor benchmark'] },
];

const COMPARISON = [
  { feature: 'Full technical SEO audit', seoinforce: true, semrush: true, moz: true, freeTools: false },
  { feature: 'Daily rank tracking', seoinforce: true, semrush: true, moz: true, freeTools: false },
  { feature: 'Competitor intelligence', seoinforce: true, semrush: true, moz: false, freeTools: false },
  { feature: 'Backlink analysis', seoinforce: true, semrush: true, moz: true, freeTools: false },
  { feature: 'Local SEO & GMB check', seoinforce: true, semrush: true, moz: false, freeTools: false },
  { feature: 'AI Visibility Score (AIO/GEO)', seoinforce: true, semrush: false, moz: false, freeTools: false },
  { feature: 'White-label client reports', seoinforce: true, semrush: false, moz: false, freeTools: false },
  { feature: 'Done-for-you execution', seoinforce: true, semrush: false, moz: false, freeTools: false },
  { feature: 'SMS rank alerts', seoinforce: true, semrush: false, moz: false, freeTools: false },
  { feature: 'Embeddable lead gen widget', seoinforce: true, semrush: false, moz: false, freeTools: false },
  { feature: 'UK-specific targeting', seoinforce: true, semrush: true, moz: false, freeTools: false },
  { feature: 'Starting price (full access)', seoinforce: '£49/mo', semrush: '£108/mo', moz: '£79/mo', freeTools: '£0 (limited)' },
];

type ColKey = 'seoinforce' | 'semrush' | 'moz' | 'freeTools';

function Cell({ value, gold }: { value: boolean | string; gold?: boolean }) {
  if (typeof value === 'string') {
    return <span className="font-sans text-[12px] font-bold" style={{ color: gold ? '#FFD700' : 'rgba(255,255,255,0.35)' }}>{value}</span>;
  }
  if (value) {
    return <Check className="w-4 h-4 mx-auto" style={{ color: gold ? '#FFD700' : 'rgba(255,255,255,0.28)' }} strokeWidth={2.5} />;
  }
  return <X className="w-3.5 h-3.5 mx-auto text-white/12" strokeWidth={2} />;
}

export default function FeaturesPage() {
  return (
    <main className="bg-[#0a0a0c] min-h-screen">

      {/* Hero */}
      <section className="relative pt-36 pb-20 overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-[0.35] pointer-events-none" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[700px] pointer-events-none" style={{ background: 'radial-gradient(ellipse at top, rgba(255,215,0,0.1) 0%, transparent 60%)' }} />
        <div className="relative max-w-[1240px] mx-auto px-6 sm:px-10 text-center">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#FFD700]/60 mb-5">Platform Capabilities</p>
          <h1
            className="font-heading text-[52px] sm:text-[68px] md:text-[82px] text-white leading-[0.9] tracking-[-0.04em] mb-6"
            style={{ textShadow: '0 0 48px rgba(255,215,0,0.12)' }}
          >
            Everything You Need
            <br />
            <span className="text-[#FFD700]" style={{ textShadow: '0 0 32px rgba(255,215,0,0.45), 0 0 64px rgba(255,215,0,0.2)' }}>
              To Win Search.
            </span>
          </h1>
          <p className="font-sans text-[17px] sm:text-[18px] text-white/50 leading-[1.7] max-w-[540px] mx-auto mb-10">
            12 integrated capabilities. One platform. No stack of disconnected tools, no agency black box, no blind spots.
          </p>
          <div className="flex flex-col sm:flex-row gap-3.5 justify-center">
            <NextLink href="/sign-up" className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-[#FFD700] text-[#0a0a0c] font-sans text-[14px] font-black uppercase tracking-wider rounded-2xl hover:bg-[#FFF44F] shadow-[0_6px_32px_rgba(255,215,0,0.42)] hover:scale-[1.02] transition-all duration-200">
              Start Free Trial
            </NextLink>
            <NextLink href="/pricing" className="inline-flex items-center justify-center px-8 py-4 border border-[#FFD700]/35 text-[#FFD700]/80 font-sans text-[14px] font-semibold rounded-2xl hover:border-[#FFD700]/65 hover:text-[#FFD700] transition-all duration-200">
              View Pricing
            </NextLink>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="relative py-16">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(255,215,0,0.04) 0%, transparent 55%)' }} />
        <div className="relative max-w-[1240px] mx-auto px-6 sm:px-10">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ Icon, title, desc, pills, badge }, i) => (
              <div key={i} className="relative flex flex-col gap-5 p-7 bg-[#111116] border border-white/[0.07] rounded-2xl hover:border-[#FFD700]/25 hover:shadow-[0_0_40px_rgba(255,215,0,0.06),0_12px_40px_rgba(0,0,0,0.5)] transition-all duration-300">
                {badge && (
                  <div className="absolute top-4 right-4 px-2.5 py-0.5 bg-[#FFD700] text-[#0a0a0c] font-sans text-[9px] font-black uppercase tracking-widest rounded-full">
                    {badge}
                  </div>
                )}
                <div className="w-11 h-11 rounded-xl bg-[#FFD700]/[0.08] border border-[#FFD700]/15 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#FFD700]" strokeWidth={1.75} />
                </div>
                <div className="flex-1">
                  <h3 className="font-sans text-[16px] font-bold text-white/90 mb-2.5">{title}</h3>
                  <p className="font-sans text-[13px] text-white/42 leading-[1.75]">{desc}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {pills.map((pill, j) => (
                    <span key={j} className="font-sans text-[10px] font-semibold text-white/35 bg-white/[0.05] border border-white/[0.07] rounded-full px-2.5 py-1">
                      {pill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What our audit covers */}
      <section className="py-20 relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/18 to-transparent" />
        <div className="relative max-w-[1240px] mx-auto px-6 sm:px-10">
          <div className="text-center mb-12">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#FFD700]/60 mb-4">Audit Coverage</p>
            <h2 className="font-display font-bold text-[36px] sm:text-[48px] text-white leading-[0.96]" style={{ letterSpacing: '-0.04em' }}>
              40+ Checks.{' '}
              <span className="text-[#FFD700]" style={{ textShadow: '0 0 24px rgba(255,215,0,0.38)' }}>Every Audit.</span>
            </h2>
            <p className="font-sans text-[15px] text-white/40 mt-4 max-w-[440px] mx-auto leading-[1.65]">
              Every free audit runs the same checks our paid clients get. No watered-down version. No upsell bait.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {AUDIT_CHECKS.map(({ category, items }) => (
              <div key={category} className="bg-[#111116] border border-white/[0.07] rounded-2xl p-6">
                <p className="font-sans text-[11px] font-black uppercase tracking-[0.16em] text-[#FFD700]/70 mb-4">{category}</p>
                <ul className="space-y-2.5">
                  {items.map(item => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-[#FFD700]/60 flex-shrink-0" strokeWidth={2.5} />
                      <span className="font-sans text-[12px] text-white/52">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <NextLink
              href="/"
              onClick={undefined}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#FFD700] text-[#0a0a0c] font-sans text-[13px] font-black uppercase tracking-wider rounded-xl hover:bg-[#FFF44F] shadow-[0_4px_20px_rgba(255,215,0,0.38)] transition-all duration-150"
            >
              Run a Free Audit Now
            </NextLink>
          </div>
        </div>
      </section>

      {/* Competitor comparison */}
      <section className="py-20 relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/18 to-transparent" />
        <div className="relative max-w-[1240px] mx-auto px-6 sm:px-10">
          <div className="text-center mb-12">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#FFD700]/60 mb-4">Why SEOInForce</p>
            <h2 className="font-display font-bold text-[36px] sm:text-[48px] text-white leading-[0.96]" style={{ letterSpacing: '-0.04em' }}>
              More Than{' '}
              <span className="text-[#FFD700]" style={{ textShadow: '0 0 24px rgba(255,215,0,0.38)' }}>Any Alternative</span>
            </h2>
            <p className="font-sans text-[15px] text-white/40 mt-4 max-w-[400px] mx-auto leading-[1.65]">
              We built what Semrush, Moz, and free tools all can't. One platform, no gaps.
            </p>
          </div>

          <div className="max-w-[920px] mx-auto overflow-x-auto rounded-2xl border border-white/[0.07] bg-[#111116]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  <th className="text-left font-sans text-[12px] text-white/30 font-semibold py-4 px-6 w-[40%]">Capability</th>
                  <th className="text-center py-4 px-4">
                    <div className="inline-flex flex-col items-center">
                      <span className="font-sans text-[13px] font-black text-[#FFD700]">SEOInForce</span>
                      <span className="font-sans text-[10px] text-[#FFD700]/50">from £49/mo</span>
                    </div>
                  </th>
                  <th className="text-center font-sans text-[12px] text-white/28 font-semibold py-4 px-4">Semrush</th>
                  <th className="text-center font-sans text-[12px] text-white/28 font-semibold py-4 px-4">Moz</th>
                  <th className="text-center font-sans text-[12px] text-white/28 font-semibold py-4 px-4">Free Tools</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={i} className="border-t border-white/[0.05] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-6 font-sans text-[13px] text-white/55">{row.feature}</td>
                    {(['seoinforce', 'semrush', 'moz', 'freeTools'] as ColKey[]).map(col => (
                      <td key={col} className="py-3.5 px-4 text-center">
                        <Cell value={row[col]} gold={col === 'seoinforce'} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SEOInForce score callout */}
          <div className="mt-6 max-w-[920px] mx-auto flex flex-wrap gap-3 justify-between items-center bg-[#FFD700]/[0.05] border border-[#FFD700]/18 rounded-2xl px-6 py-4">
            <div>
              <p className="font-sans text-[14px] font-bold text-[#FFD700]">SEOInForce covers 100% of the capabilities above.</p>
              <p className="font-sans text-[12px] text-white/38 mt-0.5">No other tool on this list does. And we cost less than Semrush.</p>
            </div>
            <NextLink href="/sign-up" className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFD700] text-[#0a0a0c] font-sans text-[12px] font-black uppercase tracking-wider rounded-xl hover:bg-[#FFF44F] shadow-[0_4px_16px_rgba(255,215,0,0.35)] transition-all">
              Start Free
            </NextLink>
          </div>
        </div>
      </section>

      {/* Agency embed widget CTA */}
      <section className="py-20 relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/18 to-transparent" />
        <div className="relative max-w-[1240px] mx-auto px-6 sm:px-10">
          <div className="max-w-[780px] mx-auto bg-[#111116] border border-[#FFD700]/20 rounded-2xl p-10 sm:p-14">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#FFD700]/60 mb-4">For Agencies</p>
            <h2 className="font-display font-bold text-[32px] sm:text-[40px] text-white leading-[1.0] mb-4" style={{ letterSpacing: '-0.03em' }}>
              Embed a Free Audit Widget{' '}
              <span className="text-[#FFD700]">on Your Site</span>
            </h2>
            <p className="font-sans text-[15px] text-white/45 leading-[1.7] mb-8 max-w-[480px]">
              Drop one line of code onto your agency website. Your prospects run a free SEO audit, see their score, and convert to your services. Fully white-labelled with your brand.
            </p>
            <div className="bg-[#0a0a0c] border border-white/[0.07] rounded-xl p-4 mb-6 overflow-x-auto">
              <code className="font-mono text-[12px] sm:text-[13px] text-[#FFD700]/75">
                {'<script src="https://seoinforce.com/embed.js" data-brand="Your Agency" data-color="FFD700"></script>'}
              </code>
            </div>
            <div className="flex flex-col sm:flex-row gap-3.5">
              <NextLink href="/sign-up" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#FFD700] text-[#0a0a0c] font-sans text-[13px] font-black uppercase tracking-wider rounded-xl hover:bg-[#FFF44F] shadow-[0_4px_20px_rgba(255,215,0,0.38)] transition-all duration-150">
                Get Your Embed Code
              </NextLink>
              <NextLink href="/pricing" className="inline-flex items-center justify-center px-7 py-3.5 border border-white/[0.1] text-white/40 font-sans text-[13px] font-semibold rounded-xl hover:border-[#FFD700]/30 hover:text-[#FFD700]/75 transition-all duration-150">
                View Agency Plans
              </NextLink>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/18 to-transparent" />
        <div className="relative max-w-[1240px] mx-auto px-6 sm:px-10 text-center">
          <h2 className="font-heading text-[44px] sm:text-[60px] text-white leading-[0.92] tracking-[-0.04em] mb-6" style={{ textShadow: '0 0 32px rgba(255,215,0,0.1)' }}>
            Start Ranking.<br />
            <span className="text-[#FFD700]" style={{ textShadow: '0 0 28px rgba(255,215,0,0.45)' }}>Today.</span>
          </h2>
          <p className="font-sans text-[16px] text-white/42 mb-9 max-w-[360px] mx-auto leading-[1.65]">
            14-day free trial. No credit card. Full access from day one.
          </p>
          <NextLink href="/sign-up" className="inline-flex items-center gap-2.5 px-10 py-[17px] bg-[#FFD700] text-[#0a0a0c] font-sans text-[15px] font-black uppercase tracking-wider rounded-2xl hover:bg-[#FFF44F] shadow-[0_6px_32px_rgba(255,215,0,0.42)] hover:scale-[1.02] transition-all duration-200">
            Start Free Trial
          </NextLink>
        </div>
      </section>

    </main>
  );
}
