'use client';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const STATS = [
  { n: '1M+',   label: 'Audits Delivered',   sub: 'and counting' },
  { n: '87%',   label: 'Client Success Rate', sub: 'vs. UK average' },
  { n: '20+',   label: 'Countries Served',    sub: 'global reach' },
  { n: '£25M+', label: 'Revenue Influenced',  sub: 'for our clients' },
];

export default function AuthorityStats() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section ref={ref} className="py-20 relative bg-[#0a0a0c] overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-[0.35] pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,215,0,0.07) 0%, transparent 62%)' }} />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/22 to-transparent" />

      <div className="relative max-w-[1240px] mx-auto px-6 sm:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <div
              key={i}
              className="group flex flex-col p-8 bg-[#111116] border border-white/[0.07] rounded-2xl hover:border-[#FFD700]/30 hover:shadow-[0_0_40px_rgba(255,215,0,0.07),0_8px_32px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 transition-all duration-300 cursor-default"
            >
              <p
                className="font-heading text-[52px] sm:text-[58px] text-[#FFD700] leading-none mb-3"
                style={{ letterSpacing: '-0.03em', textShadow: '0 0 24px rgba(255,215,0,0.35)' }}
              >
                {s.n}
              </p>
              <p className="font-sans text-[14px] font-semibold text-white/80 mb-1">{s.label}</p>
              <p className="font-sans text-[12px] text-white/32">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
