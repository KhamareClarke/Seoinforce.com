'use client';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const CASES = [
  {
    tag: 'E-Commerce',
    client: 'UK Online Retailer',
    before: '8K visits/mo · Page 3+',
    after: '27K visits/mo · 47 Page 1 rankings',
    metric: '+247%',
    metricLabel: 'Organic Traffic',
    timeframe: '90 days',
    desc: 'Technical overhaul + content velocity. Fixed Core Web Vitals, resolved crawl errors, published 18 intent-matched articles.',
  },
  {
    tag: 'SaaS',
    client: 'London Tech Startup',
    before: '0 branded rankings · 2 demos/week',
    after: '#1 primary keyword · 11 demos/week',
    metric: '+189%',
    metricLabel: 'Demo Bookings',
    timeframe: '6 months',
    desc: 'Competitor gap analysis surfaced 14 uncontested keywords. Strategic blog and authority links drove qualified demo requests.',
  },
  {
    tag: 'Agency',
    client: 'UK Marketing Agency',
    before: '8 clients · Manual PDF reports',
    after: '47 white-label clients · Automated',
    metric: '£38K',
    metricLabel: 'Monthly Retainer',
    timeframe: '60 days',
    desc: 'White-label dashboard enabled rapid client onboarding. Automation freed 12 billable hours per week.',
  },
];

export default function CaseStudies() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section ref={ref} className="py-28 relative bg-[#0a0a0c] overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-[0.35] pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 20% 60%, rgba(255,215,0,0.05) 0%, transparent 50%)' }} />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/22 to-transparent" />

      <div className="relative max-w-[1240px] mx-auto px-6 sm:px-10">

        {/* Section header */}
        <div className="mb-14">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#FFD700]/60 mb-4">Case Studies</p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <h2
              className="font-display font-bold text-[38px] sm:text-[48px] text-white leading-[0.96]"
              style={{ letterSpacing: '-0.04em', textShadow: '0 0 28px rgba(255,215,0,0.08)' }}
            >
              Before &amp; After.
              <br />
              <span className="text-[#FFD700]" style={{ textShadow: '0 0 24px rgba(255,215,0,0.35)' }}>Real Money Made.</span>
            </h2>
            <p className="font-sans text-[14px] text-white/38 max-w-[220px] leading-[1.6]">
              Verified campaigns. Transparent methodology.
            </p>
          </div>
        </div>

        {/* Case cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {CASES.map((c, i) => (
            <div
              key={i}
              className="group flex flex-col bg-[#111116] border-l-[4px] border-[#FFD700] rounded-r-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.5)] hover:shadow-[0_0_48px_rgba(255,215,0,0.1),0_16px_56px_rgba(0,0,0,0.65)] hover:-translate-y-1.5 transition-all duration-300 border border-white/[0.06] border-l-[#FFD700]"
            >
              {/* Metric header */}
              <div className="px-7 pt-7 pb-5 border-b border-white/[0.06]">
                <span className="inline-block px-2.5 py-1 bg-[#FFD700]/[0.08] border border-[#FFD700]/20 text-[#FFD700]/70 font-sans text-[10px] font-semibold uppercase tracking-[0.15em] rounded-md mb-5">
                  {c.tag}
                </span>
                <p
                  className="font-heading text-[60px] text-[#FFD700] leading-none mb-1"
                  style={{ letterSpacing: '-0.03em', textShadow: '0 0 28px rgba(255,215,0,0.42)' }}
                >
                  {c.metric}
                </p>
                <p className="font-sans text-[12px] font-semibold text-white/40 uppercase tracking-[0.12em]">{c.metricLabel}</p>
              </div>

              {/* Detail */}
              <div className="p-7 flex-1 flex flex-col">
                <h3 className="font-sans text-[15px] font-semibold text-white/78 mb-5">{c.client}</h3>

                <div className="grid grid-cols-2 gap-2 mb-5">
                  <div className="p-3.5 bg-[#0a0a0c] border border-white/[0.06] rounded-xl">
                    <p className="font-sans text-[9px] uppercase tracking-[0.18em] text-white/22 font-semibold mb-2">Before</p>
                    <p className="font-sans text-[12px] text-white/48 leading-relaxed">{c.before}</p>
                  </div>
                  <div className="p-3.5 bg-[#0a0a0c] border border-[#FFD700]/14 rounded-xl">
                    <p className="font-sans text-[9px] uppercase tracking-[0.18em] text-[#FFD700]/50 font-semibold mb-2">After</p>
                    <p className="font-sans text-[12px] text-white/75 leading-relaxed">{c.after}</p>
                  </div>
                </div>

                <p className="font-sans text-[13px] text-white/42 leading-[1.72] flex-1">{c.desc}</p>

                <div className="mt-5 pt-4 border-t border-white/[0.05] flex items-center justify-between">
                  <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-white/22">Timeframe</span>
                  <span className="font-sans text-[13px] font-semibold text-white/65">{c.timeframe}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
