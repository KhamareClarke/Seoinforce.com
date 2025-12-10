import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://seoinforce.com'),
  title: {
    default: 'SEOInForce – SEO Audit Tool & White-Label SEO Services UK',
    template: '%s | SEOInForce',
  },
  description:
    'Take command of search with SEOInForce. AI-powered audits, competitor analysis, white-label SEO reports, and done-for-you SEO services trusted by 10,000+ businesses.',
  keywords: [
    'SEO Audit Tool UK',
    'Competitor Analysis Software',
    'White-Label SEO Reports',
    'SEO Services UK',
    'AI SEO Tool',
    'Rank Tracking Software',
    'Agency SEO Tools',
    'Technical SEO Audit',
    'Backlink Analysis',
    'Keyword Research Tool',
  ],
  authors: [{ name: 'SEOInForce' }],
  creator: 'SEOInForce',
  publisher: 'SEOInForce',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/logo.svg',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://seoinforce.com',
    title: 'SEOInForce – SEO Audit Tool & White-Label SEO Services UK',
    description:
      'Take command of search with AI-powered SEO audits, competitor analysis, and white-label SEO reports. Get results fast – or let our Task Force do it for you.',
    siteName: 'SEOInForce',
    images: [
      {
        url: '/logo.svg',
        width: 1200,
        height: 630,
        alt: 'SEOInForce - Premium SEO Tools and Services',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SEOInForce – SEO Audit Tool & White-Label SEO Services UK',
    description:
      'Take command of search with AI-powered SEO audits, competitor analysis, and white-label SEO reports. Get results fast – or let our Task Force do it for you.',
    creator: '@seoinforce',
    images: ['/logo.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://seoinforce.com',
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.youtube.com" />
        <link rel="dns-prefetch" href="https://calendly.com" />
      </head>
      <body className={`bg-gradient-to-b from-black to-black min-h-screen ${inter.className}`}>
        {/* Organization (LocalBusiness) Schema */}
        <Script id="ld-localbusiness" type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: 'SEOInForce',
            url: 'https://seoinforce.com',
            logo: 'https://seoinforce.com/logo.svg',
            image: 'https://seoinforce.com/logo.svg',
            areaServed: {
              '@type': 'AdministrativeArea',
              name: 'United Kingdom',
            },
            sameAs: [
              'https://twitter.com/',
              'https://www.linkedin.com/',
              'https://github.com/'
            ],
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'customer support',
              email: 'contact@seoforce.com',
              telephone: '+1-234-567-890',
              availableLanguage: ['English'],
            },
          })}
        </Script>
        {/* SaaS (SoftwareApplication) Schema */}
        <Script id="ld-saas" type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'SEOInForce',
            applicationCategory: 'SEO Software',
            operatingSystem: 'Web',
            offers: {
              '@type': 'AggregateOffer',
              lowPrice: '49',
              highPrice: '499',
              priceCurrency: 'GBP',
            },
            url: 'https://seoinforce.com',
            description:
              'SEO audit tool (UK), competitor analysis software, rank tracking, and white‑label SEO reports for agencies.',
            publisher: {
              '@type': 'Organization',
              name: 'SEOInForce',
            },
          })}
        </Script>
        {children}
      </body>
    </html>
  );
}