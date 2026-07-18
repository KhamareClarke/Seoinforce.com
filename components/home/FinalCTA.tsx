'use client';
import NextLink from 'next/link';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const TRUST = [
  'No credit card required',
  'Free 14-day trial',
  'Cancel anytime',
  'UK-based support',
];

export default function FinalCTA() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section ref={ref} className="py-36 relative bg-[#0a0a0c] overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-[0.5] pointer-events-none" />

      {/* Strong central glow for the CTA section */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 55%, rgba(255,215,0,0.1) 0%, transparent 60%)' }}
      />

      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/25 to-transparent" />

      <div className="relative max-w-[1240px] mx-auto px-6 sm:px-10 text-center">

        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#FFD700]/60 mb-6">Get Started</p>

        <h2
          className="font-heading text-[48px] sm:text-[64px] md:text-[76px] text-white leading-[0.9] tracking-[-0.035em] mb-6"
          style={{ textShadow: '0 0 48px rgba(255,215,0,0.1)' }}
        >
          Ready to<br />
          <span
            className="text-[#FFD700]"
            style={{ textShadow: '0 0 36px rgba(255,215,0,0.52), 0 0 72px rgba(255,215,0,0.22)' }}
          >
            Dominate Search?
          </span>
        </h2>

        <p className="font-sans text-[17px] sm:text-[18px] text-white/55 mb-3 max-w-[460px] mx-auto leading-[1.65]">
          Join 10,000+ UK businesses ranking higher, outperforming competitors, and banking results.
        </p>

        <p className="font-sans text-[14px] text-white/30 mb-12">
          Limited spots available this month. Book your call today.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-10">
          <NextLink
            href="/sign-up"
            className="group flex items-center gap-3 justify-center w-full sm:w-auto px-10 py-[17px] bg-[#FFD700] text-[#0a0a0c] font-sans text-[15px] font-black uppercase tracking-wider rounded-2xl hover:bg-[#FFF44F] shadow-[0_6px_36px_rgba(255,215,0,0.42)] hover:shadow-[0_10px_52px_rgba(255,215,0,0.62)] hover:scale-[1.03] transition-all duration-200"
          >
            Start Free Trial
            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </NextLink>
          <a
            href="https://calendly.com/khamareclarke/new-meeting"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full sm:w-auto px-10 py-[17px] border border-[#FFD700]/32 text-[#FFD700]/72 font-sans text-[15px] font-semibold rounded-2xl hover:border-[#FFD700]/65 hover:text-[#FFD700] hover:bg-[#FFD700]/[0.05] transition-all duration-200"
          >
            Book Strategy Call
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6">
          {TRUST.map((item, i) => (
            <div key={i} className="flex items-center gap-2 font-sans text-[13px] text-white/32">
              <svg className="w-3.5 h-3.5 text-[#FFD700]/60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {item}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
