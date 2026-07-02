'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

const LOGOS = [
  { src: '/client1-Photoroom.png', alt: 'Client' },
  { src: '/identi-logo.png', alt: 'Identi' },
  { src: '/myapproved-logo.png', alt: 'MyApproved' },
  { src: '/omni-logo.png', alt: 'Omni' },
  { src: '/6.svg', alt: 'Partner' },
];

export default function HeroSection() {
  const [showModal, setShowModal] = useState(false);
  const [url, setUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{ overall_score: number } | null>(null);

  const analyze = async () => {
    if (!url.trim()) return;
    setAnalyzing(true);
    setResult(null);
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
      alert(e instanceof Error ? e.message : 'Failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => { setShowModal(false); setUrl(''); setResult(null); };

  return (
    <>
      <section className="relative min-h-[100svh] flex flex-col justify-center overflow-hidden bg-[#0a0a0c]">

        {/* Texture */}
        <div className="absolute inset-0 dot-grid opacity-[0.55] pointer-events-none" />

        {/* Ambient glow */}
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[800px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top, rgba(255,215,0,0.1) 0%, transparent 58%)' }}
        />

        <div className="relative z-10 max-w-[1240px] mx-auto px-6 sm:px-10 pt-44 pb-24 w-full">
          <div className="max-w-[820px] mx-auto text-center">

            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 mb-9 px-4 py-1.5 rounded-full border border-[#FFD700]/25 bg-[#FFD700]/[0.06]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] gold-pulse shrink-0" />
              <span className="font-sans text-[12px] font-semibold text-[#FFD700]/85 tracking-[0.06em]">
                UK's Leading SEO Platform · Trusted by 10,000+ Businesses
              </span>
            </div>

            {/* H1: the page's single dominant element */}
            <h1
              className="font-heading text-[58px] sm:text-[76px] md:text-[90px] lg:text-[104px] text-white leading-[0.88] tracking-[-0.035em] mb-7"
              style={{ textShadow: '0 0 48px rgba(255,215,0,0.12)' }}
            >
              Dominate Search.
              <br />
              <span
                className="text-[#FFD700]"
                style={{ textShadow: '0 0 32px rgba(255,215,0,0.5), 0 0 64px rgba(255,215,0,0.22)' }}
              >
                Command Authority.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="font-sans text-[18px] sm:text-[19px] text-white/65 leading-[1.65] max-w-[520px] mx-auto mb-9">
              The UK's most powerful SEO platform, built for service businesses that compete to win and demand real, measurable results.
            </p>

            {/* Client logo strip: social proof before CTA */}
            <div className="mb-9">
              <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-white/22 font-semibold mb-5">
                Trusted by teams at
              </p>
              <div className="flex items-center justify-center gap-7 sm:gap-12 flex-wrap">
                {LOGOS.map((logo, i) => (
                  <img
                    key={i}
                    src={logo.src}
                    alt={logo.alt}
                    className="h-5 sm:h-[22px] w-auto opacity-22 hover:opacity-55 grayscale hover:grayscale-0 transition-all duration-300"
                  />
                ))}
              </div>
            </div>

            {/* CTAs */}
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

            {/* Trust line */}
            <p className="font-sans text-[12px] text-white/30">
              14-day free trial · No credit card required · Cancel anytime
            </p>

          </div>
        </div>
      </section>

      {/* Audit modal */}
      {showModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/88 backdrop-blur-md p-4">
          <div className="relative w-full max-w-[420px] bg-[#141418] border border-[#FFD700]/20 rounded-2xl p-8 shadow-[0_48px_100px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,215,0,0.06)]">

            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-52 h-24 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top, rgba(255,215,0,0.08), transparent 70%)' }} />

            <div className="relative">
              <div className="flex items-start justify-between mb-7">
                <div>
                  <h3 className="font-display font-bold text-[20px] text-white tracking-tight">Analyse My Website</h3>
                  <p className="font-sans text-[13px] text-white/38 mt-1">Free audit · No account needed</p>
                </div>
                <button onClick={reset} className="w-7 h-7 flex items-center justify-center text-white/22 hover:text-white/65 transition-colors rounded-lg hover:bg-white/[0.06]">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

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
                  <div className="flex gap-2.5">
                    <button
                      onClick={analyze}
                      disabled={!url.trim()}
                      className="flex-1 h-12 bg-[#FFD700] text-[#0a0a0c] font-sans text-[14px] font-black uppercase tracking-wider rounded-xl hover:bg-[#FFF44F] disabled:opacity-35 transition-all shadow-[0_4px_20px_rgba(255,215,0,0.32)]"
                    >
                      Run Audit
                    </button>
                    <button onClick={reset} className="flex-1 h-12 border border-white/[0.1] text-white/38 font-sans text-[14px] rounded-xl hover:border-white/[0.18] hover:text-white/65 transition-all">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {analyzing && (
                <div className="text-center py-10">
                  <div className="inline-block w-8 h-8 rounded-full border-2 border-white/[0.07] border-t-[#FFD700] animate-spin mb-5" />
                  <p className="font-sans text-[14px] text-white font-semibold mb-1">Scanning your site…</p>
                  <p className="font-sans text-[12px] text-white/30">Up to 60 seconds</p>
                </div>
              )}

              {result && !analyzing && (
                <div className="space-y-3">
                  <div className="text-center py-7 bg-[#0a0a0c] border border-white/[0.07] rounded-xl">
                    <p className="font-heading text-[60px] text-[#FFD700] leading-none" style={{ letterSpacing: '-2px', textShadow: '0 0 28px rgba(255,215,0,0.45)' }}>
                      {result.overall_score}
                    </p>
                    <p className="font-sans text-[10px] text-white/28 uppercase tracking-[0.18em] font-semibold mt-2">Overall SEO Score</p>
                  </div>
                  <button onClick={() => { window.location.href = '/sign-in'; }} className="w-full h-12 bg-[#FFD700] text-[#0a0a0c] font-sans text-[14px] font-black uppercase tracking-wider rounded-xl hover:bg-[#FFF44F] transition-all shadow-[0_4px_20px_rgba(255,215,0,0.35)]">
                    Download Full Report
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
