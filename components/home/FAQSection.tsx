'use client';
import { useState } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const FAQS = [
  {
    q: 'What is included in the free SEO analysis?',
    a: 'A comprehensive technical audit covering page speed, mobile optimisation, metadata quality, Core Web Vitals, crawl issues, and quick wins. You\'ll also see competitor opportunities surfaced by our AI.',
  },
  {
    q: 'Do you support white-label SEO reports for agencies?',
    a: 'Yes. Reports include your agency logo, brand colours, and custom cover page. Set up automated scheduled delivery and export to PDF or CSV for any client at any time.',
  },
  {
    q: 'How accurate is the keyword rank tracking?',
    a: 'We track rankings daily with Google location targeting across UK and international markets. Starter covers 100 keywords; Growth covers 1,000; Empire provides unlimited tracking across multiple locations.',
  },
  {
    q: 'Can I switch plans or cancel anytime?',
    a: 'Yes. Upgrade, downgrade, or cancel at any time from your dashboard. No penalties, no lock-in. Annual plans receive a 20% discount over monthly billing.',
  },
  {
    q: 'How long does it take to see SEO results?',
    a: 'Technical fixes typically show ranking impact within 2–4 weeks. Content and link building campaigns compound over 3–6 months. All progress is tracked in real-time in your dashboard.',
  },
  {
    q: 'Do you offer done-for-you SEO services in the UK?',
    a: 'Yes. Our UK-based team executes technical SEO, content creation, and link building, all tracked transparently within the SEOInForce platform so you always know what\'s been done and why.',
  },
  {
    q: 'Is there an API available for agency integrations?',
    a: 'Empire plan includes full API access with documentation, webhooks, and white-label embed options for seamless integration into your client workflows and reporting tools.',
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section ref={ref} id="faq" className="py-28 relative bg-[#0a0a0c] overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-[0.35] pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 80% 0%, rgba(255,215,0,0.05) 0%, transparent 50%)' }} />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/22 to-transparent" />

      <div className="relative max-w-[1240px] mx-auto px-6 sm:px-10">

        <div className="mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#FFD700]/60 mb-4">FAQ</p>
            <h2
              className="font-display font-bold text-[38px] sm:text-[48px] text-white leading-[0.96]"
              style={{ letterSpacing: '-0.04em', textShadow: '0 0 28px rgba(255,215,0,0.08)' }}
            >
              Questions{' '}
              <span className="text-[#FFD700]" style={{ textShadow: '0 0 24px rgba(255,215,0,0.35)' }}>Answered</span>
            </h2>
          </div>
          <p className="font-sans text-[14px] text-white/35 max-w-[240px] leading-[1.65]">
            Everything you need to know before you start.
          </p>
        </div>

        <div className="max-w-[780px] mx-auto space-y-2">
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={`bg-[#111116] border rounded-2xl overflow-hidden transition-all duration-200 ${
                  isOpen
                    ? 'border-[#FFD700]/35 shadow-[0_0_28px_rgba(255,215,0,0.07)]'
                    : 'border-white/[0.07] hover:border-white/[0.12]'
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-6 px-6 py-5 text-left"
                >
                  <span className={`font-sans text-[15px] font-semibold leading-[1.5] transition-colors duration-150 ${isOpen ? 'text-[#FFD700]' : 'text-white/70'}`}>
                    {faq.q}
                  </span>
                  <span
                    className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-200 ${
                      isOpen ? 'border-[#FFD700]/45 bg-[#FFD700]/10 rotate-45' : 'border-white/[0.14] bg-transparent'
                    }`}
                  >
                    <svg
                      className={`w-2.5 h-2.5 transition-colors duration-150 ${isOpen ? 'text-[#FFD700]' : 'text-white/28'}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </button>

                <div
                  className="overflow-hidden transition-all duration-300 ease-out"
                  style={{ maxHeight: isOpen ? '220px' : '0px' }}
                >
                  <p className="px-6 pb-6 font-sans text-[14px] text-white/48 leading-[1.78]">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
