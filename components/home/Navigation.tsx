'use client';
import { useState, useEffect } from 'react';
import NextLink from 'next/link';

const NAV = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/blog', label: 'Blog' },
  { href: '/support', label: 'Support' },
];

export default function Navigation() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    fn();
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'h-[72px] bg-[#0a0a0c]/97 backdrop-blur-2xl border-b border-white/[0.06]'
          : 'h-[80px] bg-transparent'
      }`}
    >
      <div className="max-w-[1240px] mx-auto px-6 sm:px-10 h-full relative flex items-center">

        {/* Logo: left anchor */}
        <NextLink href="/" className="flex items-center gap-2.5 shrink-0 group z-10">
          <span className="w-8 h-8 rounded-lg overflow-hidden border border-[#FFD700]/25 bg-[#FFD700]/[0.07] flex items-center justify-center group-hover:border-[#FFD700]/55 group-hover:bg-[#FFD700]/[0.12] transition-all duration-200">
            <img src="/logo.svg" alt="SEOInForce" className="w-5 h-5 object-cover" />
          </span>
          <span className="font-heading text-[15px] text-white/90 tracking-tight">SEOinForce</span>
        </NextLink>

        {/* Nav links: absolutely centered so they're unaffected by logo/CTA widths */}
        <ul className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-0.5">
          {NAV.map(({ href, label }) => (
            <li key={href}>
              <NextLink
                href={href}
                className="px-4 py-2 font-sans text-[14px] font-medium text-white/50 hover:text-white/90 transition-colors duration-150 rounded-lg hover:bg-white/[0.05]"
              >
                {label}
              </NextLink>
            </li>
          ))}
        </ul>

        {/* CTA: right anchor */}
        <div className="ml-auto hidden md:flex items-center gap-4 shrink-0 z-10">
          <NextLink
            href="/sign-in"
            className="font-sans text-[14px] font-medium text-white/45 hover:text-white/85 transition-colors duration-150"
          >
            Sign in
          </NextLink>
          <NextLink
            href="/sign-up"
            className="px-5 py-2.5 bg-[#FFD700] text-[#0a0a0c] font-sans text-[13px] font-black uppercase tracking-wider rounded-xl hover:bg-[#FFF44F] transition-all duration-150 shadow-[0_2px_18px_rgba(255,215,0,0.32)] hover:shadow-[0_4px_28px_rgba(255,215,0,0.52)] hover:scale-[1.03]"
          >
            Get Free Audit
          </NextLink>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(o => !o)}
          className="ml-auto md:hidden w-9 h-9 flex items-center justify-center text-white/55 hover:text-white transition-colors z-10"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open
            ? <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" /></svg>
            : <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" /></svg>
          }
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/[0.07] bg-[#0a0a0c]/99 backdrop-blur-2xl">
          <div className="max-w-[1240px] mx-auto px-6 py-5 space-y-0.5">
            {NAV.map(({ href, label }) => (
              <NextLink
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="block py-3 font-sans text-[15px] font-medium text-white/55 hover:text-white/90 transition-colors"
              >
                {label}
              </NextLink>
            ))}
            <div className="pt-4 flex flex-col gap-2.5 pb-1">
              <NextLink
                href="/sign-in"
                onClick={() => setOpen(false)}
                className="py-3.5 text-center font-sans text-[14px] font-medium text-white/55 border border-white/[0.1] rounded-xl hover:border-white/[0.2] hover:text-white/85 transition-all"
              >
                Sign in
              </NextLink>
              <NextLink
                href="/sign-up"
                onClick={() => setOpen(false)}
                className="py-3.5 text-center font-sans text-[13px] font-black uppercase tracking-wider text-[#0a0a0c] bg-[#FFD700] rounded-xl hover:bg-[#FFF44F] transition-all shadow-[0_4px_20px_rgba(255,215,0,0.38)]"
              >
                Get Free Audit
              </NextLink>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
