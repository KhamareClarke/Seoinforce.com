'use client';
import NextLink from 'next/link';
import { Search, BarChart2, TrendingUp, FileText, Zap, Users } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const SERVICES = [
  {
    Icon: Search,
    title: 'SEO Audit & Analysis',
    desc: 'AI-powered technical audits that surface critical issues and quick wins, delivered in minutes, not days.',
    href: '/features',
  },
  {
    Icon: BarChart2,
    title: 'Competitor Intelligence',
    desc: 'Know what\'s ranking, why it ranks, and where your rivals are vulnerable. Act first.',
    href: '/features',
  },
  {
    Icon: TrendingUp,
    title: 'Keyword & Rank Tracking',
    desc: 'Daily UK position monitoring. Know when you climb or when a competitor moves in.',
    href: '/features',
  },
  {
    Icon: FileText,
    title: 'White-Label Reports',
    desc: 'Fully branded SEO reports for your clients. Scheduled delivery, PDF export, zero effort.',
    href: '/features',
  },
  {
    Icon: Zap,
    title: 'Content Optimisation',
    desc: 'AI-assisted briefs and on-page recommendations aligned to search intent.',
    href: '/features',
  },
  {
    Icon: Users,
    title: 'Done-For-You SEO',
    desc: 'Our UK team executes your strategy end-to-end: technical SEO, content, and link building.',
    href: '/pricing',
  },
];

export default function ServicesSection() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section ref={ref} className="py-28 relative bg-[#0a0a0c] overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-[0.35] pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(255,215,0,0.06) 0%, transparent 55%)' }} />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/22 to-transparent" />

      <div className="relative max-w-[1240px] mx-auto px-6 sm:px-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
          <div>
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#FFD700]/60 mb-4">What We Do</p>
            <h2
              className="font-display font-bold text-[38px] sm:text-[48px] text-white leading-[0.96]"
              style={{ letterSpacing: '-0.04em', textShadow: '0 0 28px rgba(255,215,0,0.08)' }}
            >
              Everything SEO.
              <br />
              <span className="text-[#FFD700]" style={{ textShadow: '0 0 24px rgba(255,215,0,0.35)' }}>One Platform.</span>
            </h2>
          </div>
          <NextLink
            href="/features"
            className="hidden sm:inline-flex items-center gap-2 font-sans text-[13px] font-medium text-white/30 hover:text-[#FFD700] transition-colors duration-200 group"
          >
            All features
            <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </NextLink>
        </div>

        {/* 3-column grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {SERVICES.map(({ Icon, title, desc, href }, i) => (
            <NextLink
              key={i}
              href={href}
              className="group flex flex-col gap-5 p-7 bg-[#111116] border border-white/[0.07] rounded-2xl hover:border-[#FFD700]/30 hover:shadow-[0_0_40px_rgba(255,215,0,0.07),0_12px_40px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 transition-all duration-300"
            >
              {/* Icon container */}
              <div className="w-11 h-11 rounded-xl bg-[#FFD700]/[0.08] border border-[#FFD700]/15 flex items-center justify-center group-hover:bg-[#FFD700]/[0.14] group-hover:border-[#FFD700]/35 transition-all duration-300">
                <Icon className="w-5 h-5 text-[#FFD700]" strokeWidth={1.75} />
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="font-sans text-[16px] font-semibold text-white/82 group-hover:text-white mb-2 transition-colors duration-150">
                  {title}
                </h3>
                <p className="font-sans text-[13px] text-white/42 leading-[1.72] group-hover:text-white/55 transition-colors duration-150">
                  {desc}
                </p>
              </div>

              {/* Link */}
              <span className="font-sans text-[12px] font-semibold text-[#FFD700]/55 group-hover:text-[#FFD700] flex items-center gap-1.5 transition-colors duration-150">
                Learn more
                <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </NextLink>
          ))}
        </div>

      </div>
    </section>
  );
}
