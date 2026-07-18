'use client';
import { useState } from 'react';
import NextLink from 'next/link';
import { Check } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const SAAS_PLANS = [
  {
    name: 'Starter',
    price: '£49',
    period: '/mo',
    desc: 'For small businesses & freelancers',
    roi: 'Avg. +38% organic traffic in 90 days',
    features: [
      'Track 100 keywords',
      'Monthly SEO audits',
      '5 competitors tracked',
      'Basic rank reports',
      'Email support',
    ],
  },
  {
    name: 'Growth',
    price: '£249',
    period: '/mo',
    desc: 'For growing teams & agencies',
    recommended: true,
    roi: 'Avg. +212% organic traffic in 6 months',
    features: [
      'Track 1,000 keywords',
      'Weekly SEO audits',
      '25 competitors tracked',
      'White-label reports (10/mo)',
      'Content optimisation',
      'Priority support',
    ],
  },
  {
    name: 'Empire',
    price: '£499',
    period: '/mo',
    desc: 'For agencies & enterprises',
    roi: 'Agencies report 5.9x client growth on avg.',
    features: [
      'Unlimited keyword tracking',
      'Daily SEO audits',
      'Unlimited competitors',
      'Unlimited white-label reports',
      'Full API access',
      'Dedicated account manager',
    ],
  },
];

const DFY_SERVICES = [
  {
    name: 'On-Page SEO',
    price: 'From £497/mo',
    desc: 'Technical fixes, structure optimisation, and metadata improvements for measurable ranking gains.',
  },
  {
    name: 'Link Building',
    price: 'From £997/mo',
    desc: 'Authority-driven outreach and white-hat link acquisition from relevant UK domains.',
  },
  {
    name: 'Content Creation',
    price: 'From £1,497/mo',
    desc: 'SEO-optimised content creation and strategy aligned to your target keywords.',
  },
  {
    name: 'Full-Service SEO',
    price: '£2,997–£4,997/mo',
    desc: 'Complete SEO execution with a dedicated strategist: audits, content, links, reporting.',
    recommended: true,
  },
];

export default function PricingSection() {
  const [tab, setTab] = useState<'saas' | 'dfy'>('saas');
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section ref={ref} id="pricing" className="py-28 relative bg-[#0a0a0c] overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-[0.35] pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,215,0,0.08) 0%, transparent 55%)' }} />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/22 to-transparent" />

      <div className="relative max-w-[1240px] mx-auto px-6 sm:px-10">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#FFD700]/60 mb-4">Transparent Pricing</p>
          <h2
            className="font-display font-bold text-[38px] sm:text-[48px] text-white leading-[0.96] mb-4"
            style={{ letterSpacing: '-0.04em', textShadow: '0 0 28px rgba(255,215,0,0.08)' }}
          >
            Command Your{' '}
            <span className="text-[#FFD700]" style={{ textShadow: '0 0 24px rgba(255,215,0,0.38)' }}>Market</span>
          </h2>
          <p className="font-sans text-[16px] text-white/42 max-w-[380px] mx-auto leading-[1.65]">
            Authority-grade tools. Enterprise execution. No lock-in.
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1 bg-[#111116] border border-white/[0.08] rounded-xl gap-1">
            {(['saas', 'dfy'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-7 py-2.5 rounded-[9px] font-sans text-[13px] font-semibold transition-all duration-150 ${
                  tab === t
                    ? 'bg-[#FFD700] text-[#0a0a0c] font-black shadow-[0_2px_16px_rgba(255,215,0,0.38)]'
                    : 'text-white/38 hover:text-white/70'
                }`}
              >
                {t === 'saas' ? 'SaaS Plans' : 'Done-For-You SEO'}
              </button>
            ))}
          </div>
        </div>

        {/* SaaS plans */}
        {tab === 'saas' && (
          <div className="grid md:grid-cols-3 gap-4">
            {SAAS_PLANS.map((plan, i) => (
              <div
                key={i}
                className={`relative flex flex-col p-8 rounded-2xl border transition-all duration-300 ${
                  plan.recommended
                    ? 'bg-[#111116] border-[#FFD700]/50 shadow-[0_0_56px_rgba(255,215,0,0.12),0_20px_60px_rgba(0,0,0,0.65)]'
                    : 'bg-[#111116] border-white/[0.07] shadow-[0_8px_36px_rgba(0,0,0,0.5)] hover:border-white/[0.13]'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-[13px] left-1/2 -translate-x-1/2 px-4 py-1 bg-[#FFD700] text-[#0a0a0c] font-sans text-[11px] font-black uppercase tracking-wider rounded-full whitespace-nowrap shadow-[0_4px_16px_rgba(255,215,0,0.45)]">
                    Most Popular
                  </div>
                )}

                <h3 className="font-display font-bold text-[21px] text-white mb-1" style={{ letterSpacing: '-0.02em' }}>
                  {plan.name}
                </h3>
                <p className="font-sans text-[13px] text-white/35 mb-7">{plan.desc}</p>

                <div className="mb-7 pb-7 border-b border-white/[0.07]">
                  <span
                    className="font-heading text-[50px] text-[#FFD700] leading-none"
                    style={{ letterSpacing: '-0.03em', textShadow: plan.recommended ? '0 0 20px rgba(255,215,0,0.38)' : 'none' }}
                  >
                    {plan.price}
                  </span>
                  <span className="font-sans text-[13px] text-white/28 ml-1">/mo</span>
                  {plan.roi && (
                    <p className="font-sans text-[11px] text-[#FFD700]/55 mt-2 leading-tight">{plan.roi}</p>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5">
                      <Check className="w-[14px] h-[14px] text-[#FFD700] shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span className="font-sans text-[13px] text-white/58">{f}</span>
                    </li>
                  ))}
                </ul>

                <NextLink
                  href="/sign-up"
                  className={`block w-full py-3.5 text-center font-sans text-[13px] font-black uppercase tracking-wider rounded-xl transition-all duration-150 ${
                    plan.recommended
                      ? 'bg-[#FFD700] text-[#0a0a0c] hover:bg-[#FFF44F] shadow-[0_4px_20px_rgba(255,215,0,0.38)] hover:shadow-[0_6px_28px_rgba(255,215,0,0.52)] hover:scale-[1.02]'
                      : 'border border-white/[0.1] text-white/45 hover:border-[#FFD700]/30 hover:text-[#FFD700]/80'
                  }`}
                >
                  Get Started Now
                </NextLink>
              </div>
            ))}
          </div>
        )}

        {/* DFY services */}
        {tab === 'dfy' && (
          <div className="grid sm:grid-cols-2 gap-4 max-w-[840px] mx-auto">
            {DFY_SERVICES.map((s, i) => (
              <div
                key={i}
                className={`relative flex flex-col p-8 rounded-2xl border transition-all duration-300 ${
                  s.recommended
                    ? 'bg-[#111116] border-[#FFD700]/45 shadow-[0_0_48px_rgba(255,215,0,0.1),0_16px_48px_rgba(0,0,0,0.6)]'
                    : 'bg-[#111116] border-white/[0.07] shadow-[0_8px_36px_rgba(0,0,0,0.5)] hover:border-white/[0.13]'
                }`}
              >
                {s.recommended && (
                  <div className="absolute -top-[13px] left-1/2 -translate-x-1/2 px-4 py-1 bg-[#FFD700] text-[#0a0a0c] font-sans text-[11px] font-black uppercase tracking-wider rounded-full whitespace-nowrap shadow-[0_4px_16px_rgba(255,215,0,0.45)]">
                    Most Popular
                  </div>
                )}
                <h3 className="font-sans text-[16px] font-semibold text-white/85 mb-1.5">{s.name}</h3>
                <p className="font-sans text-[14px] text-[#FFD700] font-semibold mb-4" style={{ textShadow: '0 0 10px rgba(255,215,0,0.25)' }}>{s.price}</p>
                <p className="font-sans text-[13px] text-white/45 leading-[1.72] mb-8 flex-1">{s.desc}</p>
                <NextLink
                  href="/sign-up"
                  className="block w-full py-3.5 text-center font-sans text-[13px] font-black uppercase tracking-wider border border-white/[0.1] text-white/42 rounded-xl hover:border-[#FFD700]/35 hover:text-[#FFD700]/80 transition-all duration-150"
                >
                  Get Started Now
                </NextLink>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
