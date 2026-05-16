import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'SEOInForce — SEO audits and white-label reports';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(145deg, #050505 0%, #111827 45%, #0f172a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
        }}
      >
        <div
          style={{
            fontSize: 88,
            fontWeight: 800,
            letterSpacing: -2,
            color: '#fbbf24',
            display: 'flex',
            lineHeight: 1,
          }}
        >
          SEOInForce
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 36,
            fontWeight: 600,
            color: '#e5e7eb',
            textAlign: 'center',
            maxWidth: 900,
            lineHeight: 1.25,
          }}
        >
          AI-powered SEO audits, competitor analysis & white-label reports — UK
        </div>
      </div>
    ),
    { ...size }
  );
}
