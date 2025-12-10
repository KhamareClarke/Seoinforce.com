'use client';
import React, { useState } from "react";
import { Shield, Search, Download, Award, ChevronRight, FileText, LucideLink, Wrench, CheckCircle, AlertTriangle, XCircle, User, Sparkles, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function AnimatedNumber({ value, duration = 1000, suffix = "" }: { value: number; duration?: number; suffix?: string }) {
  const [display, setDisplay] = React.useState(0);
  React.useEffect(() => {
    let start = 0;
    let startTime: number | null = null;
    function animate(ts: number) {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setDisplay(start + (value - start) * progress);
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
    return () => setDisplay(value);
  }, [value, duration]);
  return <div className="text-2xl font-bold text-[#FFD700] drop-shadow animate-pulse">{display.toFixed(1)}{suffix}</div>;
}

function AnimatedProgress({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [width, setWidth] = React.useState(0);
  React.useEffect(() => {
    let start = 0;
    let startTime: number | null = null;
    function animate(ts: number) {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setWidth(start + (value - start) * progress);
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
    return () => setWidth(value);
  }, [value, duration]);
  return <div className="h-3 rounded-full bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 transition-all duration-700" style={{ width: `${width}%` }} />;
}

const mockAudit = {
  score: 82,
  categories: {
    Technical: 75,
    "On-Page": 88,
    Content: 79,
    Competitor: 68,
  },
  technical: {
    lcp: 2.3,
    fcp: 1.6,
    tti: 3.1,
    https: true,
    mobile: true,
  },
  onpage: {
    title: { length: 58, keyword: true },
    description: { missing: false, tooLong: false },
    h1: 1,
    h2: 3,
    h3: 8,
    images: { missing: 2, valid: 10 },
  },
  content: {
    readability: 69,
    keywordDensity: [
      { term: "seo", pct: 3.2 },
      { term: "audit", pct: 2.1 },
      { term: "tool", pct: 1.8 },
      { term: "uk", pct: 1.2 },
      { term: "report", pct: 1.1 },
    ],
    duplicate: false,
    suggestions: ["seo audit tool uk", "competitor analysis software", "white-label seo reports"],
  },
  competitors: [
    { name: "semrush.com", overlap: 8, missing: 3 },
    { name: "ahrefs.com", overlap: 7, missing: 2 },
    { name: "moz.com", overlap: 6, missing: 4 },
  ],
  fixes: [
    { level: "critical", text: "Missing meta description on homepage." },
    { level: "warning", text: "2 images missing alt tags." },
    { level: "good", text: "HTTPS active and secure." },
  ],
};

function AnimatedGauge({ value, max = 100, size = 180 }: { value: number; max?: number; size?: number }) {
  const [angle, setAngle] = React.useState(0);
  React.useEffect(() => {
    let start = 0;
    let startTime: number | null = null;
    const target = (value / max) * 180;
    function animate(ts: number) {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / 1000, 1);
      setAngle(start + (target - start) * progress);
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [value, max]);
  const cx = size / 2, cy = size / 2, r = size / 2 - 18;
  // Arc for gold dial
  const startAngle = -90, endAngle = angle - 90;
  const start = [cx + r * Math.cos((Math.PI * startAngle) / 180), cy + r * Math.sin((Math.PI * startAngle) / 180)];
  const end = [cx + r * Math.cos((Math.PI * endAngle) / 180), cy + r * Math.sin((Math.PI * endAngle) / 180)];
  const largeArc = angle > 180 ? 1 : 0;
  const arcPath = `M ${start[0]} ${start[1]} A ${r} ${r} 0 ${largeArc} 1 ${end[0]} ${end[1]}`;
  // Needle
  const needleAngle = ((value / max) * 180) - 90;
  const needleX = cx + (r - 10) * Math.cos((Math.PI * needleAngle) / 180);
  const needleY = cy + (r - 10) * Math.sin((Math.PI * needleAngle) / 180);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size/1.15}`} className="block mx-auto drop-shadow-[0_0_32px_#FFD70088]">
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`} fill="none" stroke="#232323" strokeWidth={18} />
      <path d={arcPath} fill="none" stroke="#FFD700" strokeWidth={18} strokeLinecap="round" filter="url(#glow)" />
      <defs>
        <filter id="glow">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#FFD700" floodOpacity="0.7" />
        </filter>
      </defs>
      {/* Needle */}
      <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="#FFD700" strokeWidth={6} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={14} fill="#FFD700" stroke="#232323" strokeWidth={4} />
      {/* Score number */}
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#FFD700" fontSize="2.5rem" fontWeight="bold">{value}</text>
      <text x={cx} y={cy + 38} textAnchor="middle" fill="#C0C0C0" fontSize="1rem" fontWeight="bold">SEO Score</text>
    </svg>
  );
}

export default function AuditDashboard() {
  // Mission timer state
  React.useEffect(() => {
    let start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const ss = String(elapsed % 60).padStart(2, '0');
      const el = document.getElementById('mission-timer');
      if (el) el.textContent = `${mm}:${ss}`;
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- LAYOUT: Sidebar + Main ---
  // Sidebar for logo, nav, and agency toggle
  // Sticky header for CTAs
  // Main: clean vertical flow, grouped cards, elite visuals

  const [domain, setDomain] = useState("");
  const [comparison, setComparison] = useState(false);
  const [whiteLabel, setWhiteLabel] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [mobileView, setMobileView] = useState(false);
  // Radar chart points (mock)
function VitalsHeatmap({ mobile }: { mobile: boolean }) {
  // Mock data: 6 months
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  const desktop = [2.8, 2.6, 2.5, 2.4, 2.3, 2.3];
  const mobileD = [3.7, 3.5, 3.3, 3.2, 3.1, 3.1];
  const data = mobile ? mobileD : desktop;
  return (
    <div className="flex items-center justify-between gap-3 px-6">
      {data.map((val, i) => (
        <div key={months[i]} className="flex flex-col items-center group cursor-pointer">
          <svg width="32" height="32">
            <circle
              cx="16"
              cy="16"
              r="10"
              fill={val <= 3.0 ? '#FFD700' : '#38bdf8'}
              className={val <= 3.0 ? 'animate-pulse-gold' : 'animate-pulse-blue'}
              filter={val <= 3.0 ? 'url(#gold-glow)' : 'url(#blue-glow)'}
            />
            <defs>
              <filter id="gold-glow">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#FFD700" floodOpacity="0.7" />
              </filter>
              <filter id="blue-glow">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.7" />
              </filter>
            </defs>
          </svg>
          <span className="text-xs mt-1 text-[#FFD700] group-hover:text-white transition font-semibold">{months[i]}</span>
          <span className="text-xs text-[#C0C0C0]">{val.toFixed(1)}s</span>
        </div>
      ))}
      <style>{`
        .animate-pulse-gold { animation: pulseGold 1.4s infinite; }
        .animate-pulse-blue { animation: pulseBlue 1.4s infinite; }
        @keyframes pulseGold { 0%,100%{opacity:1;} 50%{opacity:.5; filter:drop-shadow(0 0 16px #FFD70088);} }
        @keyframes pulseBlue { 0%,100%{opacity:1;} 50%{opacity:.5; filter:drop-shadow(0 0 16px #38bdf888);} }
      `}</style>
    </div>
  );
}

function VitalsTrendGraph({ mobile }: { mobile: boolean }) {
  // Mock data: 6 months
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  const desktop = [2.8, 2.6, 2.5, 2.4, 2.3, 2.3];
  const mobileD = [3.7, 3.5, 3.3, 3.2, 3.1, 3.1];
  const data = mobile ? mobileD : desktop;
  const maxY = 4.0;
  const minY = 2.0;
  const width = 280, height = 80, padding = 32;
  const points = data.map((v, i) => [padding + (i * (width - 2 * padding) / (data.length - 1)), height - ((v - minY) / (maxY - minY)) * (height - 2 * padding) + padding]);
  const path = points.map((p, i) => i === 0 ? `M ${p[0]},${p[1]}` : `L ${p[0]},${p[1]}`).join(' ');
  return (
    <svg width={width} height={height} className="block mx-auto">
      <rect x={0} y={0} width={width} height={height} fill="none" />
      {/* Y axis labels */}
      {[maxY, 3.0, 2.0].map((y, i) => (
        <text key={i} x={8} y={height - ((y - minY) / (maxY - minY)) * (height - 2 * padding) + padding + 5} fill="#C0C0C0" fontSize="12">{y.toFixed(1)}s</text>
      ))}
      {/* X axis labels */}
      {months.map((m, i) => (
        <text key={m} x={points[i][0]} y={height - 2} fill="#FFD700" fontSize="12" textAnchor="middle">{m}</text>
      ))}
      {/* Line */}
      <polyline points={points.map(p => p.join(",")).join(" ")} fill="none" stroke={mobile ? '#38bdf8' : '#FFD700'} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" filter={mobile ? 'url(#blue-glow)' : 'url(#gold-glow)'} />
      {/* Points */}
      {points.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={5} fill={mobile ? '#38bdf8' : '#FFD700'} />
      ))}
      <defs>
        <filter id="gold-glow">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#FFD700" floodOpacity="0.7" />
        </filter>
        <filter id="blue-glow">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#38bdf8" floodOpacity="0.7" />
        </filter>
      </defs>
    </svg>
  );
}

  const radarData = comparison
    ? [82, 75, 88, 79, 68] // My Site
    : [68, 60, 72, 65, 80]; // Competitor
  const radarLabels = ["Overall", "Technical", "On-Page", "Content", "Competitor"];
  function RadarChart({ myData, competitorData, labels, size = 220, focus = 'my' }: { myData: number[]; competitorData: number[]; labels: string[]; size?: number; focus?: 'my' | 'competitor' }) {
    const points = myData.length;
    const angle = (2 * Math.PI) / points;
    const cx = size / 2, cy = size / 2, r = size / 2 - 30;
    const getPoint = (i: number, val: number) => [
      cx + r * (val / 100) * Math.sin(i * angle),
      cy - r * (val / 100) * Math.cos(i * angle),
    ];
    const poly = (d: number[]) => d.map((val, i) => getPoint(i, val).join(",")).join(" ");
    return (
      <div className="relative">
        <svg width={size} height={size} className="mx-auto transition-all duration-700 ease-in-out">
          {[...Array(points)].map((_, i) => (
            <line key={i} x1={cx} y1={cy} x2={getPoint(i, 100)[0]} y2={getPoint(i, 100)[1]} stroke="#FFD700" strokeDasharray="2,2" strokeWidth={1} />
          ))}
          {/* Competitor polygon (silver) */}
          <polygon points={poly(competitorData)} fill="#C0C0C055" stroke="#C0C0C0" strokeWidth={2} filter="url(#silver-glow)" />
          {/* My Site polygon (gold) */}
          <polygon points={poly(myData)} fill="#FFD70033" stroke="#FFD700" strokeWidth={3} filter="url(#gold-glow)" />
          <defs>
            <filter id="gold-glow">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#FFD700" floodOpacity="0.7" />
            </filter>
            <filter id="silver-glow">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#C0C0C0" floodOpacity="0.6" />
            </filter>
          </defs>
          {/* Points */}
          {myData.map((val, i) => (
            <circle key={i} cx={getPoint(i, val)[0]} cy={getPoint(i, val)[1]} r={focus === 'my' ? 7 : 5} fill="#FFD700" />
          ))}
          {competitorData.map((val, i) => (
            <circle key={i} cx={getPoint(i, val)[0]} cy={getPoint(i, val)[1]} r={focus === 'competitor' ? 7 : 5} fill="#C0C0C0" />
          ))}
          {/* Labels */}
          {labels.map((label, i) => (
            <text key={label} x={getPoint(i, 110)[0]} y={getPoint(i, 110)[1]} fill="#FFD700" fontSize="13" textAnchor="middle">{label}</text>
          ))}
        </svg>
        <div className="absolute top-2 right-2 flex gap-2 items-center bg-black/60 px-3 py-1 rounded-full text-xs font-bold">
          <span className="inline-flex items-center"><span className="inline-block h-3 w-3 rounded-full bg-[#FFD700] mr-1" />My Site</span>
          <span className="inline-flex items-center"><span className="inline-block h-3 w-3 rounded-full bg-[#C0C0C0] mr-1" />Competitor</span>
        </div>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen bg-gradient-to-r from-[#101010] via-[#181818] to-[#232323]">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-gradient-to-b from-black via-[#181818] to-[#232323] border-r border-yellow-400/20 py-8 px-6 shadow-2xl z-20">
        <div className="flex items-center gap-3 mb-10">
          <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-yellow-400 overflow-hidden">
            <img src={whiteLabel ? "/client1-Photoroom.png" : "/logo.svg"} alt="Logo" className="h-8 w-8 rounded-full object-cover" />
          </div>
          <span className="text-2xl font-extrabold hero-gradient-text tracking-tight">{whiteLabel ? 'Agency' : 'SEOInForce'}</span>
        </div>
        <button
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold border-2 border-[#FFD700] bg-black/70 text-[#FFD700] shadow-lg transition-all duration-200 ${whiteLabel ? 'ring-2 ring-yellow-400' : ''}`}
          onClick={() => setWhiteLabel(w => !w)}
        >
          {whiteLabel ? (
            <>
              <Sparkles className="h-5 w-5" /> Agency Mode
            </>
          ) : (
            <>
              <Shield className="h-5 w-5" /> White-Label Mode
            </>
          )}
        </button>
        <nav className="mt-10 flex flex-col gap-4 text-[#FFD700] font-semibold text-lg">
          <a href="#overview" className="hover:text-white transition">Overview</a>
          <a href="#technical" className="hover:text-white transition">Technical SEO</a>
          <a href="#onpage" className="hover:text-white transition">On-Page</a>
          <a href="#content" className="hover:text-white transition">Content</a>
          <a href="#competitors" className="hover:text-white transition">Competitors</a>
          <a href="#fixes" className="hover:text-white transition">Fixes</a>
        </nav>
      </aside>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 bg-gradient-to-r from-black/80 via-[#181818]/80 to-[#232323]/80 backdrop-blur-md border-b border-yellow-400/10 px-4 py-3 flex items-center justify-between shadow-lg">
          <div className="text-lg font-bold hero-gradient-text">SEO Task Force Command Center</div>
          <div className="flex gap-3">
            <Button className="bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 text-black font-bold px-6 py-2 rounded-lg shadow hover:bg-yellow-500 transition" onClick={() => setShowLeadModal(true)}>
              <Download className="h-5 w-5 mr-2" /> {whiteLabel ? 'Agency PDF' : 'White-Label PDF'}
            </Button>
            <Button className="bg-gradient-to-r from-[#C0C0C0] via-[#FFD700] to-yellow-400 text-black font-bold px-6 py-2 rounded-lg shadow hover:bg-yellow-500 transition" onClick={() => setShowBookModal(true)}>
              <Shield className="h-5 w-5 mr-2" /> Book Strategy Call
            </Button>
          </div>
        </header>
        {/* Main Content Stack */}
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-10 flex flex-col gap-10">

      <style>{`
        .fade-in-up { opacity: 0; transform: translateY(32px); animation: fadeInUp 1s forwards; }
        .fade-in-up.delay-1 { animation-delay: .2s; }
        .fade-in-up.delay-2 { animation-delay: .4s; }
        .fade-in-up.delay-3 { animation-delay: .6s; }
        @keyframes fadeInUp { to { opacity: 1; transform: none; } }
      `}</style>
      {/* Hero/Input Bar */}
      <section className="max-w-2xl mx-auto px-4 pt-16 pb-10 text-center fade-in-up">
        <h1 className="text-4xl sm:text-5xl font-extrabold hero-gradient-text mb-3">See SEOInForce in action – instant audits, real results.</h1>
        <p className="text-[#C0C0C0] text-lg mb-6">Enter your domain and get a free instant SEO audit report in under 60 seconds.</p>
        <form className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-2" onSubmit={e => { e.preventDefault(); }}>
          <Input
            value={domain}
            onChange={e => setDomain(e.target.value)}
            placeholder="Enter your domain (e.g. example.com)"
            className="flex-1 bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border border-yellow-400/30 text-white px-5 py-4 rounded-2xl text-lg shadow"
          />
          <Button type="submit" className="bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 text-black font-bold px-8 py-4 rounded-2xl shadow-lg text-lg hover:bg-yellow-500 transition flex items-center gap-2">
            <Search className="h-5 w-5" /> Analyze My Site
          </Button>
        </form>
        <div className="text-xs text-[#FFD700] font-semibold mb-4">Instant SEO Audit in under 60 seconds. No credit card required.</div>
      </section>

      {/* Audit Score Panel */}
      <section className="max-w-5xl mx-auto px-6 py-10 mb-10 rounded-3xl ${whiteLabel ? 'bg-gradient-to-br from-[#003366] via-[#00b8d9] to-[#e0f7fa] border-2 border-[#00b8d9]/40 shadow-xl' : 'bg-black/70 border-2 border-yellow-400/30 shadow-xl backdrop-blur-lg relative group'} fade-in-up delay-2">
        <div className="flex flex-col md:flex-row items-center gap-8 justify-center">
  <div className="flex flex-col items-center">
    <div className="relative group">
  <AnimatedGauge value={mockAudit.score} />
  {/* HUD scan lines */}
  <div className="absolute inset-0 pointer-events-none opacity-30 animate-hud-scan bg-[repeating-linear-gradient(180deg,rgba(255,215,0,0.10)_0_2px,transparent_2px_8px)] rounded-full" />
</div>
    <div className="text-xl font-bold hero-gradient-text mt-2">Overall SEO Score</div>
  </div>
  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-6">
    {Object.entries(mockAudit.categories).map(([cat, score]) => (
      <div key={cat} className="text-center">
        <div className="flex items-center justify-center gap-2 font-semibold text-[#FFD700] mb-1">
  {cat === 'Technical' && <Wrench className="h-5 w-5 transition-transform group-hover:scale-110" />}
  {cat === 'On-Page' && <FileText className="h-5 w-5 transition-transform group-hover:scale-110" />}
  {cat === 'Content' && <MessageCircle className="h-5 w-5 transition-transform group-hover:scale-110" />}
  {cat === 'Competitor' && <LucideLink className="h-5 w-5 transition-transform group-hover:scale-110" />}
  {cat}
</div>
        <div className="w-full h-3 bg-[#232323] rounded-full overflow-hidden mb-1">
          <div className="relative group">
  <AnimatedProgress value={score} />
  <div className="absolute inset-0 pointer-events-none opacity-40 animate-hud-scan bg-[repeating-linear-gradient(90deg,rgba(255,215,0,0.10)_0_2px,transparent_2px_12px)] rounded-full" />
</div>
        </div>
        <div className="text-xs text-[#C0C0C0] font-medium">{score}/100</div>
      </div>
    ))}
  </div>
</div>
{/* Enhanced Radar Chart Section */}
<div className="mt-10 mb-2 flex items-center justify-center gap-4">
  <button
    className={`px-5 py-2 rounded-full font-bold border-2 transition-all duration-200 ${comparison ? 'border-[#C0C0C0] text-[#C0C0C0] bg-black/60' : 'border-[#FFD700] text-[#FFD700] bg-black/80 shadow-lg'}`}
    onClick={() => setComparison(false)}
  >
    My Site
  </button>
  <button
    className={`px-5 py-2 rounded-full font-bold border-2 transition-all duration-200 ${comparison ? 'border-[#FFD700] text-[#FFD700] bg-black/80 shadow-lg' : 'border-[#C0C0C0] text-[#C0C0C0] bg-black/60'}`}
    onClick={() => setComparison(true)}
  >
    Competitor
  </button>
</div>
<RadarChart
  myData={[82, 75, 88, 79, 68]}
  competitorData={[68, 60, 72, 65, 80]}
  labels={radarLabels}
  size={260}
  focus={comparison ? 'competitor' : 'my'}
/>
      </section>

      {/* Mobile/Desktop Split Toggle */}
      <div className="flex items-center justify-end mb-2 gap-3">
        <span className="font-bold text-[#FFD700]">View:</span>
        <button
          className={`px-4 py-1 rounded-full font-bold border-2 transition-all duration-200 ${!mobileView ? 'border-[#FFD700] text-[#FFD700] bg-black/80 shadow-lg' : 'border-blue-400 text-blue-400 bg-black/60'}`}
          onClick={() => setMobileView(false)}
        >
          Desktop
        </button>
        <button
          className={`px-4 py-1 rounded-full font-bold border-2 transition-all duration-200 ${mobileView ? 'border-blue-400 text-blue-400 bg-black/80 shadow-lg' : 'border-[#FFD700] text-[#FFD700] bg-black/60'}`}
          onClick={() => setMobileView(true)}
        >
          Mobile
        </button>
      </div>
      {/* Technical SEO Section */}
      <section className="max-w-5xl mx-auto px-4 py-8 mb-6 rounded-2xl bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border border-yellow-400/20 shadow fade-in-up delay-2">
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="h-6 w-6 text-yellow-400" />
          <h2 className="text-xl font-bold hero-gradient-text">Technical SEO</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-4">
          <div className="text-center">
            <div className="font-medium text-[#FFD700]">LCP</div>
            <AnimatedNumber value={mobileView ? 3.1 : 2.3} suffix="s" />
          </div>
          <div className="text-center">
            <div className="font-medium text-[#FFD700]">FCP</div>
            <AnimatedNumber value={mobileView ? 2.2 : 1.6} suffix="s" />
          </div>
          <div className="text-center">
            <div className="font-medium text-[#FFD700]">TTI</div>
            <AnimatedNumber value={mobileView ? 4.0 : 3.1} suffix="s" />
          </div>
          <div className="text-center">
            <div className="font-medium text-[#FFD700]">HTTPS</div>
            <div className="text-2xl font-bold">{(mobileView ? true : mockAudit.technical.https) ? <CheckCircle className="inline h-6 w-6 text-green-400" /> : <XCircle className="inline h-6 w-6 text-red-500" />}</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-[#FFD700]">Mobile</div>
            <div className="text-2xl font-bold">{mockAudit.technical.mobile ? <CheckCircle className="inline h-6 w-6 text-green-400" /> : <XCircle className="inline h-6 w-6 text-red-500" />}</div>
          </div>
        </div>
      </section>

      {/* Core Web Vitals Trend Graph */}
      <section className="max-w-3xl mx-auto px-4 py-6 mb-8 rounded-2xl bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border border-yellow-400/30 shadow-lg fade-in-up delay-2">
        <h3 className="text-lg font-bold hero-gradient-text mb-3">Core Web Vitals Trend (LCP, 6 months)</h3>
        <VitalsHeatmap mobile={mobileView} />
      </section>

      {/* AI Traffic Potential */}
      <section className="max-w-3xl mx-auto px-8 py-10 mb-12 rounded-3xl ${whiteLabel ? 'bg-gradient-to-br from-[#003366] via-[#00b8d9] to-[#e0f7fa] border-2 border-[#00b8d9]/80 shadow-[0_0_32px_#00b8d988]' : 'bg-black/90 border-2 border-yellow-400/80 shadow-[0_0_32px_#FFD70088] backdrop-blur-lg relative group'} fade-in-up delay-2 flex flex-col items-center text-center relative overflow-hidden">
  {/* Military icons and mission timer */}
  <div className="absolute top-4 left-4 flex items-center gap-3 z-10">
    <Shield className="h-7 w-7 text-yellow-400 drop-shadow-[0_0_6px_#FFD70077] animate-pulse" />
    <ChevronRight className="h-6 w-6 text-yellow-400 animate-bounce-x" />
    <svg width="32" height="32" className="animate-spin-slow">
      <circle cx="16" cy="16" r="12" fill="none" stroke="#FFD700" strokeWidth="2" opacity=".4" />
      <circle cx="16" cy="16" r="7" fill="#FFD70022" />
      <rect x="15" y="5" width="2" height="8" fill="#FFD700" rx="1" />
    </svg>
  </div>
  {/* Live mission timer */}
  <div className="absolute top-4 right-4 bg-yellow-400/20 border border-yellow-400/60 rounded-full px-4 py-2 text-yellow-200 font-mono font-bold text-lg shadow animate-pulse-slow">
    Mission Timer: <span id="mission-timer"></span>
  </div>
  {/* Animated gold-glow badge */}
  <div className="inline-flex items-center px-6 py-3 mb-5 rounded-full ${whiteLabel ? 'bg-[#00b8d9]/30 text-[#003366] font-extrabold text-xl tracking-wider shadow border-2 border-[#00b8d9]/80 animate-glow-agency' : 'bg-yellow-400/30 text-yellow-300 font-extrabold text-xl tracking-wider shadow animate-pulse border-2 border-yellow-400/80 animate-glow-gold'}">
    <Sparkles className="inline-block w-7 h-7 mr-3 animate-spin-slow" aria-label="AI Traffic Potential" /> COMMANDER’S BRIEFING
  </div>
  {/* Animated border */}
  <div className="absolute inset-0 pointer-events-none rounded-3xl border-4 ${whiteLabel ? 'border-[#00b8d9]/60 animate-border-glow-agency' : 'border-yellow-400/50 animate-border-glow'}" />
  {/* Traffic Potential */}
  <div className="text-6xl font-extrabold ${whiteLabel ? 'text-[#003366] drop-shadow-[0_0_16px_#00b8d999]' : 'text-yellow-300 drop-shadow-[0_0_16px_#FFD70099]'} mb-3 animate-pulse">
    <AnimatedNumber value={38} duration={1800} suffix="%" />
  </div>
  <div className="text-[#FFD700] text-lg font-bold mb-3 tracking-wide uppercase">Mission: Maximize Traffic Growth</div>
  {/* Typewriter effect for insight */}
  <div className="text-[#C0C0C0] text-lg max-w-xl mx-auto font-mono whitespace-pre-line animate-typewriter border-l-4 border-yellow-400/60 pl-4 bg-black/40 py-3 rounded-xl shadow-inner">
    {`Intel: By executing all critical SEO fixes, your domain can unlock up to `}
    <span className="text-[#FFD700] font-bold">38% more organic traffic</span>
    {` in the next 3 months. Prioritize meta descriptions, image alts, and Core Web Vitals for fastest gains.

Recommendation: Deploy Task Force for full implementation and ongoing surveillance.`}
  </div>
  <style>{`
    .animate-glow-gold { box-shadow: 0 0 32px #FFD70055, 0 0 8px #FFD70077 inset; }
    .animate-border-glow { animation: borderGlow 2s infinite alternate; }
    @keyframes borderGlow { 0%{box-shadow:0 0 0 #FFD70000;} 100%{box-shadow:0 0 32px #FFD70099;} }
    .animate-spin-slow { animation: spin 6s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .animate-typewriter { animation: typewriter 3.5s steps(60) 1 normal both; overflow: hidden; }
    @keyframes typewriter { from { width: 0; } to { width: 100%; } }
  `}</style>
</section>

      {/* On-Page SEO Section */}
      <section className="max-w-5xl mx-auto px-4 py-8 mb-6 rounded-2xl bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border border-yellow-400/20 shadow">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-6 w-6 text-yellow-400" />
          <h2 className="text-xl font-bold hero-gradient-text">On-Page SEO</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-4">
          <div className="text-center">
            <div className="font-medium text-[#FFD700]">Meta Title</div>
            <div className="text-base">{mockAudit.onpage.title.length} chars {mockAudit.onpage.title.keyword ? <CheckCircle className="inline h-5 w-5 text-green-400 ml-1" /> : <AlertTriangle className="inline h-5 w-5 text-red-500 ml-1" />}</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-[#FFD700]">Meta Desc</div>
            <div className="text-base">{mockAudit.onpage.description.missing ? <XCircle className="inline h-5 w-5 text-red-500" /> : mockAudit.onpage.description.tooLong ? <AlertTriangle className="inline h-5 w-5 text-yellow-400" /> : <CheckCircle className="inline h-5 w-5 text-green-400" />}</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-[#FFD700]">H1/H2/H3</div>
            <div className="text-base">H1: {mockAudit.onpage.h1} | H2: {mockAudit.onpage.h2} | H3: {mockAudit.onpage.h3}</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-[#FFD700]">Images</div>
            <div className="text-base">{mockAudit.onpage.images.valid} valid / {mockAudit.onpage.images.missing} missing alt</div>
          </div>
        </div>
      </section>

      {/* Content Optimization Section */}
      <section className="max-w-5xl mx-auto px-4 py-8 mb-6 rounded-2xl bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border border-yellow-400/20 shadow">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-6 w-6 text-yellow-400" />
          <h2 className="text-xl font-bold hero-gradient-text">Content Optimization</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-4">
          <div className="text-center">
            <div className="font-medium text-[#FFD700]">Readability</div>
            <div className="text-base">{mockAudit.content.readability}/100</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-[#FFD700]">Keyword Density</div>
            <div className="text-base">
              {mockAudit.content.keywordDensity.map(kd => (
                <div key={kd.term}>{kd.term}: {kd.pct}%</div>
              ))}
            </div>
          </div>
          <div className="text-center">
            <div className="font-medium text-[#FFD700]">Duplicate?</div>
            <div className="text-base">{mockAudit.content.duplicate ? <XCircle className="inline h-5 w-5 text-red-500" /> : <CheckCircle className="inline h-5 w-5 text-green-400" />}</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-[#FFD700]">Suggestions</div>
            <div className="text-base">{mockAudit.content.suggestions.join(", ")}</div>
          </div>
        </div>
      </section>

      {/* Competitor Snapshot Section */}
      <section className="max-w-5xl mx-auto px-4 py-8 mb-6 rounded-2xl bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border border-yellow-400/20 shadow">
        <div className="flex items-center gap-2 mb-4">
          <LucideLink className="h-6 w-6 text-yellow-400" />
          <h2 className="text-xl font-bold hero-gradient-text">Competitor Snapshot</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          {mockAudit.competitors.map((c, i) => (
            <div key={c.name} className="bg-[#232323] rounded-xl p-4 flex flex-col items-center">
              <User className="h-8 w-8 text-yellow-400 mb-2" />
              <div className="font-bold text-[#FFD700] mb-1">{c.name}</div>
              <div className="text-sm">Keyword Overlap: <span className="font-bold text-green-400">{c.overlap}</span></div>
              <div className="text-sm">Missing: <span className="font-bold text-red-400">{c.missing}</span></div>
            </div>
          ))}
        </div>
        <div className="mt-12 mb-8">
  <h3 className="text-xl font-extrabold hero-gradient-text mb-6 flex items-center gap-3">
    <LucideLink className="h-6 w-6 text-yellow-400 animate-pulse" /> Competitor Snapshot <span className="ml-2 text-sm text-[#FFD700]/70 font-normal">(Live HUD)</span>
  </h3>
  <div className="relative flex flex-col md:flex-row gap-8">
    {/* Radar scan animation */}
    <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10 pointer-events-none opacity-40">
      <svg width="240" height="240">
        <circle cx="120" cy="120" r="110" fill="none" stroke="#FFD70066" strokeWidth="2" />
        <circle cx="120" cy="120" r="80" fill="none" stroke="#FFD70033" strokeWidth="1" />
        <circle cx="120" cy="120" r="50" fill="none" stroke="#FFD70022" strokeWidth="1" />
        <g>
          <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 120 120" to="360 120 120" dur="2s" repeatCount="indefinite" />
          <path d="M120,120 L120,20" stroke="#FFD700" strokeWidth="3" strokeLinecap="round" opacity=".7">
            <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 120 120" to="360 120 120" dur="2s" repeatCount="indefinite" />
          </path>
        </g>
      </svg>
    </div>
    {/* Bar charts and target lock */}
    {[{name: 'semrush.com', overlap: 8, missing: 3, keywords: ['seo audit', 'white-label', 'backlinks']},
      {name: 'ahrefs.com', overlap: 7, missing: 2, keywords: ['competitor analysis', 'keyword gap']},
      {name: 'moz.com', overlap: 6, missing: 4, keywords: ['domain authority', 'site explorer', 'link gap', 'rank tracking']}
    ].map((c, i) => (
      <div key={c.name} className="relative flex-1 bg-black/80 rounded-2xl p-6 shadow-2xl border-2 border-yellow-400/20 group overflow-hidden">
        {/* Target lock animation */}
        <span className="absolute top-2 right-2 animate-pulse text-yellow-400 z-20">
          <svg width="32" height="32"><circle cx="16" cy="16" r="13" stroke="#FFD700" strokeWidth="2" fill="none" /><circle cx="16" cy="16" r="3" fill="#FFD700" /></svg>
        </span>
        <div className="font-bold text-[#FFD700] mb-3 flex items-center gap-2 text-lg">
          <User className="h-6 w-6 text-yellow-400" /> {c.name}
        </div>
        <div className="flex items-end gap-4 mb-4 h-20">
          <div className="flex flex-col items-center w-1/2">
            <div className="h-full w-7 bg-gradient-to-b from-yellow-400 to-yellow-700 rounded-t-lg shadow-lg animate-pulse" style={{height: `${c.overlap*10}px`}} />
            <span className="text-xs text-[#FFD700] mt-2">{c.overlap} Overlap</span>
          </div>
          <div className="flex flex-col items-center w-1/2">
            <div className="h-full w-7 bg-gradient-to-b from-[#C0C0C0] to-[#232323] rounded-t-lg shadow-lg animate-pulse" style={{height: `${c.missing*10}px`}} />
            <span className="text-xs text-[#C0C0C0] mt-2">{c.missing} Missing</span>
          </div>
        </div>
        <div className="mt-4 text-xs text-[#FFD700] font-semibold bg-black/50 rounded-lg px-3 py-2 shadow-inner border border-yellow-400/10 animate-fade-in">
          Quick wins: <span className="text-yellow-300">{c.keywords.map(k=>`‘${k}’`).join(', ')}</span>.
        </div>
      </div>
    ))}
  </div>
</div>
      </section>

      {/* Fix-It-Now Recommendations */}
      <section className="max-w-5xl mx-auto px-4 py-8 mb-10 rounded-2xl bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border border-yellow-400/20 shadow fade-in-up delay-3">
        <div className="flex items-center gap-2 mb-4">
          <Award className="h-6 w-6 text-yellow-400" />
          <h2 className="text-xl font-bold hero-gradient-text">Fix-It-Now Recommendations</h2>
        </div>
        <ul className="space-y-4">
  {mockAudit.fixes.map((fix, i) => (
    <li key={i} className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-base">
        {fix.level === "critical" && <XCircle className="h-5 w-5 text-red-500" />}
        {fix.level === "warning" && <AlertTriangle className="h-5 w-5 text-yellow-400" />}
        {fix.level === "good" && <CheckCircle className="h-5 w-5 text-green-400" />}
        <span className={fix.level === "critical" ? "text-red-400" : fix.level === "warning" ? "text-yellow-400" : "text-green-400"}>{fix.text}</span>
      </div>
      {/* AI-powered suggestion */}
      <div className={
        fix.level === "critical"
          ? "ml-8 px-4 py-3 rounded-xl bg-black/80 border-2 border-yellow-400/70 shadow-[0_0_24px_#FFD70099] animate-pulse flex items-center gap-3"
          : fix.level === "warning"
          ? "ml-8 px-4 py-3 rounded-xl bg-black/70 border-2 border-yellow-400/50 shadow-[0_0_16px_#FFD70066] flex items-center gap-3"
          : "ml-8 px-4 py-3 rounded-xl bg-black/60 border-2 border-yellow-400/30 shadow-[0_0_8px_#FFD70044] flex items-center gap-3"
      }>
        <span className="flex-1">
          {fix.level === "critical" && (
            <>Suggested Fix: <span className="italic">"Boost your rankings with SEOInForce – fast audits, white-label reports, and done-for-you SEO services."</span></>
          )}
          {fix.level === "warning" && (
            <>Suggested Fix: <span className="italic">"Add descriptive alt tags to all product images for better accessibility and rankings."</span></>
          )}
          {fix.level === "good" && (
            <>Great! <span className="italic">"HTTPS is active and secure. No action needed."</span></>
          )}
        </span>
        <button
          className="ml-2 px-4 py-1 rounded-full bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 text-black font-bold shadow hover:scale-105 hover:shadow-lg active:scale-95 transition"
          onClick={() => {navigator.clipboard.writeText(
            fix.level === 'critical' ? 'Boost your rankings with SEOInForce – fast audits, white-label reports, and done-for-you SEO services.' :
            fix.level === 'warning' ? 'Add descriptive alt tags to all product images for better accessibility and rankings.' :
            'HTTPS is active and secure. No action needed.'
          )}}
        >
          Copy Fix
        </button>
      </div>
    </li>
  ))}
</ul>
      </section>

      {/* Report Export & CTA */}
      <section className="max-w-5xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center gap-10 justify-between rounded-3xl ${whiteLabel ? 'bg-gradient-to-br from-[#003366] via-[#00b8d9] to-[#e0f7fa] border-2 border-[#00b8d9]/60 shadow-2xl' : 'bg-black/80 border-2 border-yellow-400/50 shadow-2xl backdrop-blur-lg relative group'} fade-in-up delay-3">
        <div className="flex-1 text-center md:text-left">
          <div className="text-lg font-bold hero-gradient-text mb-2">Let us fix these issues for you — our Task Force executes what others only report.</div>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Button
  className="bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 text-black font-bold px-8 py-4 rounded-xl shadow-lg text-lg hover:bg-yellow-500 transition flex items-center gap-2"
  onClick={() => setShowLeadModal(true)}
>
  <Download className="h-5 w-5" /> {whiteLabel ? 'Download Agency-Branded PDF' : 'Download Full White-Label Report (PDF)'}
</Button>
            <Button className="bg-gradient-to-r from-[#C0C0C0] via-[#FFD700] to-yellow-400 text-black font-bold px-8 py-4 rounded-xl shadow-lg text-lg hover:bg-yellow-500 transition flex items-center gap-2" asChild>
              <a href="https://calendly.com/khamareclarke/new-meeting" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <Shield className="h-5 w-5" /> Book Consultation with SEO Task Force
              </a>
            </Button>
          </div>
        </div>
      </section>
      {/* Lead Capture Modal */}
      {showLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#181818] border-2 border-yellow-400/40 rounded-2xl p-8 w-full max-w-sm shadow-2xl flex flex-col items-center">
            <h3 className="text-xl font-bold hero-gradient-text mb-2">Download {whiteLabel ? 'Agency-Branded' : 'White-Label'} PDF</h3>
            <p className="text-[#FFD700] text-sm mb-4">Enter your details to receive the full report.</p>
            <form className="w-full flex flex-col gap-4" onSubmit={e => { e.preventDefault(); setShowLeadModal(false); }}>
              <input type="text" required placeholder="Your Name" value={leadName} onChange={e => setLeadName(e.target.value)} className="px-4 py-3 rounded-lg bg-[#232323] text-white border border-yellow-400/30 focus:border-yellow-400 outline-none" />
              <input type="email" required placeholder="Your Email" value={leadEmail} onChange={e => setLeadEmail(e.target.value)} className="px-4 py-3 rounded-lg bg-[#232323] text-white border border-yellow-400/30 focus:border-yellow-400 outline-none" />
              <div className="flex gap-3 mt-2">
                <button type="submit" className="flex-1 bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 text-black font-bold py-3 rounded-lg shadow hover:bg-yellow-500 transition">Download PDF</button>
                <button type="button" className="flex-1 bg-[#232323] border border-yellow-400/30 text-[#FFD700] font-bold py-3 rounded-lg hover:bg-yellow-900/30 transition" onClick={() => setShowLeadModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Book Call Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#181818] border-2 border-yellow-400/40 rounded-2xl p-8 w-full max-w-sm shadow-2xl flex flex-col items-center">
            <h3 className="text-xl font-bold hero-gradient-text mb-2">Book Free Strategy Call</h3>
            <p className="text-[#FFD700] text-sm mb-4">Pick a time with our SEO Task Force.</p>
            <a href="https://calendly.com/your-agency/seo-strategy-call" target="_blank" rel="noopener noreferrer" className="w-full bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 text-black font-bold py-3 rounded-lg shadow hover:bg-yellow-500 transition text-center mb-4">Open Calendar</a>
            <button className="w-full bg-[#232323] border border-yellow-400/30 text-[#FFD700] font-bold py-3 rounded-lg hover:bg-yellow-900/30 transition" onClick={() => setShowBookModal(false)}>Cancel</button>
          </div>
        </div>
      )}
      {/* Credibility Seals Bar */}
      <div className="fixed bottom-20 left-0 w-full z-50 bg-gradient-to-r from-yellow-400/80 via-yellow-300/60 to-yellow-400/80 flex items-center justify-center gap-7 px-6 py-2 shadow-lg border-t-2 border-yellow-400/50 font-bold text-[#232323] text-xs tracking-wide">
  <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-yellow-700" /> Trusted by 10,000+ businesses</span>
  <span className="flex items-center gap-2"><Award className="h-4 w-4 text-yellow-700" /> GDPR & ISO 27001 Secure</span>
  <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-yellow-700" /> Instant White-Label Reports</span>
  <span className="flex items-center gap-2"><User className="h-4 w-4 text-yellow-700" /> 24/7 Support</span>
  <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-yellow-700" /> 30-Day Money-Back Guarantee</span>
</div>
      {/* Sticky Command Center CTA Bar */}
      <div className="fixed bottom-0 left-0 w-full z-50 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 flex flex-col sm:flex-row items-center justify-between px-6 py-5 shadow-2xl border-t-4 border-yellow-700 animate-glow-gold">
        <div className="font-extrabold text-[#232323] text-lg flex items-center gap-3 mb-2 sm:mb-0 tracking-tight">
  <Shield className="h-6 w-6 text-yellow-700 animate-pulse" /> Ready to deploy your SEO Task Force? Elite fixes start at <span className="text-2xl">£497/mo</span>
</div>
        <button
          className="bg-black text-yellow-400 font-bold px-8 py-4 rounded-2xl shadow-xl hover:bg-yellow-800 hover:text-white transition mt-2 sm:mt-0 border-2 border-yellow-400 animate-pulse"
          onClick={() => setShowBookModal(true)}
        >
          Book Strategy Call Now
        </button>
      </div>
        </main>
      </div>
    </div>
  );
}
