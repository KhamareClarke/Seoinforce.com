import NextLink from 'next/link';

const LINKS = {
  Platform: [
    { href: '/features', label: 'Features' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/products', label: 'Products' },
    { href: '/faq', label: 'FAQ' },
  ],
  Resources: [
    { href: '/blog', label: 'Blog' },
    { href: '/support', label: 'Support' },
    { href: '/audit/dashboard', label: 'Dashboard' },
    { href: '/sign-up', label: 'Free Trial' },
  ],
  Legal: [
    { href: '#', label: 'Privacy Policy' },
    { href: '#', label: 'Terms of Service' },
    { href: '#', label: 'GDPR' },
    { href: '#', label: 'Cookies' },
  ],
};

export default function Footer() {
  return (
    <footer className="relative bg-[#0a0a0c]">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

      <div className="max-w-[1240px] mx-auto px-6 sm:px-10 pt-16 pb-10">
        <div className="grid md:grid-cols-4 gap-10 mb-14">

          {/* Brand column */}
          <div>
            <NextLink href="/" className="flex items-center gap-2.5 mb-5 w-fit group">
              <span className="w-7 h-7 rounded-lg overflow-hidden border border-[#FFD700]/22 bg-[#FFD700]/[0.07] flex items-center justify-center group-hover:border-[#FFD700]/45 transition-colors duration-200">
                <img src="/logo.svg" alt="SEOInForce" className="w-4 h-4 object-cover" />
              </span>
              <span className="font-heading text-[14px] text-white/75 tracking-tight">SEOinForce</span>
            </NextLink>
            <p className="font-sans text-[13px] text-white/32 leading-[1.72] mb-5 max-w-[210px]">
              UK's leading SEO platform for businesses and agencies that demand measurable results.
            </p>
            <a
              href="mailto:contact@seoinforce.com"
              className="font-sans text-[12px] text-white/28 hover:text-[#FFD700]/70 transition-colors duration-150"
            >
              contact@seoinforce.com
            </a>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-[#FFD700]/55 mb-5">
                {category}
              </h4>
              <ul className="space-y-3">
                {items.map(({ href, label }) => (
                  <li key={href}>
                    <NextLink
                      href={href}
                      className="font-sans text-[13px] text-white/35 hover:text-white/70 transition-colors duration-150"
                    >
                      {label}
                    </NextLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-sans text-[12px] text-white/20">
            © 2025 SEOinForce. All rights reserved.
          </p>
          <p className="font-sans text-[11px] text-white/14">
            Registered in England &amp; Wales · UK-based SEO services
          </p>
        </div>
      </div>
    </footer>
  );
}
