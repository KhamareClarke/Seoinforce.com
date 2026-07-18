'use client';
import { useState, useEffect } from 'react';

type SubScore = { label: string; value: number };
type AuditResult = {
  overall_score: number;
  technical_score: number;
  onpage_score: number;
  content_score: number;
};

export default function WidgetPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState('');
  const [brand, setBrand] = useState({ name: 'SEOInForce', color: '#FFD700', logo: '' });

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setBrand({
      name: p.get('brand') || 'SEOInForce',
      color: p.get('color') ? `#${p.get('color')}` : '#FFD700',
      logo: p.get('logo') || '',
    });
  }, []);

  const run = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const res = await fetch(`${appUrl}/api/audit/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: url }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Audit failed');
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const subScores: SubScore[] = result
    ? [
        { label: 'Technical', value: result.technical_score },
        { label: 'On-Page', value: result.onpage_score },
        { label: 'Content', value: result.content_score },
      ]
    : [];

  const barColor = (v: number) => (v >= 70 ? '#22c55e' : v >= 45 ? brand.color : '#ef4444');

  return (
    <div style={{
      background: '#141418',
      border: `1px solid ${brand.color}33`,
      borderRadius: 16,
      padding: 24,
      minHeight: '100vh',
      boxSizing: 'border-box',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#fff',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        {brand.logo && <img src={brand.logo} alt={brand.name} style={{ height: 28, width: 'auto' }} />}
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{brand.name}</div>
          <div style={{ fontSize: 11, color: `${brand.color}99` }}>Free SEO Audit</div>
        </div>
      </div>

      {!result && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="text"
            placeholder="yourdomain.com"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && run()}
            style={{
              background: '#0a0a0c',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              padding: '10px 14px',
              color: '#fff',
              fontSize: 13,
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
          {error && <p style={{ color: '#ef4444', fontSize: 12, margin: 0 }}>{error}</p>}
          <button
            onClick={run}
            disabled={!url.trim()}
            style={{
              background: brand.color,
              color: '#0a0a0c',
              border: 'none',
              borderRadius: 10,
              padding: '12px 0',
              fontSize: 13,
              fontWeight: 800,
              cursor: url.trim() ? 'pointer' : 'not-allowed',
              opacity: url.trim() ? 1 : 0.4,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              width: '100%',
            }}
          >
            Analyse My Site
          </button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '28px 0' }}>
          <style>{`@keyframes seoif-spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.08)',
            borderTopColor: brand.color,
            animation: 'seoif-spin 0.8s linear infinite',
            margin: '0 auto 12px',
          }} />
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0 }}>Scanning your site…</p>
        </div>
      )}

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            background: '#0a0a0c',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12,
            padding: '16px 0',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: 56, fontWeight: 800, color: brand.color,
              lineHeight: 1, letterSpacing: '-2px',
              textShadow: `0 0 24px ${brand.color}66`,
            }}>
              {result.overall_score}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.18em', marginTop: 4 }}>
              Overall SEO Score
            </div>
          </div>

          <div style={{ background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
            {subScores.map(({ label, value }) => (
              <div key={label} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{label}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>{value}/100</span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 9999 }}>
                  <div style={{
                    height: '100%', width: `${value}%`,
                    background: barColor(value),
                    borderRadius: 9999,
                    boxShadow: `0 0 6px ${barColor(value)}66`,
                  }} />
                </div>
              </div>
            ))}
          </div>

          <a
            href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://seoinforce.com'}/sign-up`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              textAlign: 'center',
              background: brand.color,
              color: '#0a0a0c',
              textDecoration: 'none',
              borderRadius: 10,
              padding: '12px 0',
              fontSize: 13,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Get Full Report Free
          </a>
          <button
            onClick={() => { setResult(null); setUrl(''); setError(''); }}
            style={{
              background: 'none', border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 10, padding: '8px 0', color: 'rgba(255,255,255,0.35)',
              fontSize: 12, cursor: 'pointer', width: '100%',
            }}
          >
            Analyse another site
          </button>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', textAlign: 'center' }}>
            Powered by{' '}
            <a href="https://seoinforce.com" target="_blank" rel="noopener noreferrer" style={{ color: `${brand.color}88`, textDecoration: 'none' }}>
              SEOInForce
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
