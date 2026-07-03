'use client';
import { useState, useEffect } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const TESTIMONIALS = [
  {
    quote: 'We went from page 3 to position 2 for our main service keyword in under 8 weeks. The competitor gap analysis showed us exactly which content to create, and the rank alerts kept the whole team informed without a single manual check.',
    name: 'Sarah Okafor',
    role: 'Head of Growth',
    company: 'Clearstone Legal',
    result: '+312%',
    metric: 'Organic Traffic (6 months)',
    initial: 'S',
  },
  {
    quote: 'I manage 23 client accounts. The white-label PDF reports alone save me 12 hours a month. My clients think I\'ve built something custom for them. The competitor intelligence section is what closes deals when I show it in pitches.',
    name: 'Marcus Thorne',
    role: 'Founder',
    company: 'Elevate SEO Agency',
    result: '23',
    metric: 'Clients managed, one platform',
    initial: 'M',
  },
  {
    quote: 'The AI Visibility score was the feature that made us switch. Our competitors had no idea they were invisible on ChatGPT and Gemini. We fixed our schema in two weeks and now show up in AI answers for 6 of our target queries.',
    name: 'Priya Nair',
    role: 'SEO Director',
    company: 'Veritas Digital',
    result: '6',
    metric: 'AI search queries now ranked',
    initial: 'P',
  },
];

const DURATION = 7000;

export default function ProvenResults() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const ref = useScrollReveal<HTMLElement>();

  useEffect(() => {
    let start = Date.now();
    const tick = setInterval(() => {
      const elapsed = (Date.now() - start) % DURATION;
      setProgress((elapsed / DURATION) * 100);
      if (elapsed < 80) setActive(a => (a + 1) % TESTIMONIALS.length);
    }, 50);
    return () => clearInterval(tick);
  }, []);

  const t = TESTIMONIALS[active];

  return (
    <section ref={ref} className="py-28 relative bg-[#0a0a0c] overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-[0.35] pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(255,215,0,0.05) 0%, transparent 55%)' }} />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/22 to-transparent" />

      <div className="relative max-w-[1240px] mx-auto px-6 sm:px-10">
        <div className="grid lg:grid-cols-[1fr_480px] gap-14 lg:gap-24 items-center">

          {/* Left: heading + selector */}
          <div>
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#FFD700]/60 mb-4">Client Results</p>
            <h2
              className="font-display font-bold text-[38px] sm:text-[48px] text-white leading-[0.96] mb-3"
              style={{ letterSpacing: '-0.04em', textShadow: '0 0 28px rgba(255,215,0,0.08)' }}
            >
              Real Clients.<br />
              <span className="text-[#FFD700]" style={{ textShadow: '0 0 24px rgba(255,215,0,0.38)' }}>Real Results.</span>
            </h2>
            <p className="font-sans text-[16px] text-white/48 leading-[1.7] max-w-[340px] mb-10">
              Every metric verified. Every client story real. No fluff.
            </p>

            <div className="flex flex-col gap-2">
              {TESTIMONIALS.map((item, i) => (
                <button
                  key={i}
                  onClick={() => { setActive(i); setProgress(0); }}
                  className={`text-left px-5 py-4 rounded-xl border transition-all duration-200 ${
                    i === active
                      ? 'border-[#FFD700]/30 bg-[#FFD700]/[0.05]'
                      : 'border-transparent hover:border-white/[0.07] hover:bg-white/[0.025]'
                  }`}
                >
                  <p className={`font-sans text-[14px] font-semibold transition-colors duration-150 ${i === active ? 'text-white/90' : 'text-white/28'}`}>
                    {item.name}
                  </p>
                  <p className={`font-sans text-[12px] mt-0.5 transition-colors duration-150 ${i === active ? 'text-white/42' : 'text-white/15'}`}>
                    {item.role} · {item.company}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Right: testimonial card */}
          <div>
            <div className="bg-[#111116] border border-white/[0.08] rounded-2xl p-8 sm:p-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_64px_rgba(0,0,0,0.65)]">

              {/* Big metric */}
              <div className="flex items-baseline gap-3 mb-6">
                <span
                  className="font-heading text-[58px] text-[#FFD700] leading-none"
                  style={{ letterSpacing: '-0.03em', textShadow: '0 0 28px rgba(255,215,0,0.45)' }}
                >
                  {t.result}
                </span>
                <span className="font-sans text-[13px] text-white/38 font-medium">{t.metric}</span>
              </div>

              {/* Quote */}
              <blockquote className="font-sans text-[16px] text-white/62 leading-[1.8] mb-8">
                "{t.quote}"
              </blockquote>

              {/* Attribution */}
              <div className="flex items-center gap-3 pt-6 border-t border-white/[0.06]">
                <div className="w-9 h-9 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/25 flex items-center justify-center shrink-0">
                  <span className="font-display font-bold text-[13px] text-[#FFD700]">{t.initial}</span>
                </div>
                <div>
                  <p className="font-sans text-[13px] font-semibold text-white/82">{t.name}</p>
                  <p className="font-sans text-[11px] text-white/30">{t.role} · {t.company}</p>
                </div>
              </div>

              {/* Auto-advance progress */}
              <div className="mt-6 h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-none"
                  style={{ width: `${progress}%`, background: '#FFD700', boxShadow: '0 0 6px rgba(255,215,0,0.55)' }}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
