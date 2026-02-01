'use client';
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Search, Download, Award, ChevronRight, FileText, LucideLink, Wrench, CheckCircle, AlertTriangle, XCircle, User, Sparkles, MessageCircle, LogOut, Loader2, Plus, Edit2, Trash2, Mail, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseClient } from "@/lib/supabase/client";
import { getCurrentUserClient, signOutClient } from "@/lib/auth/client";
import PricingModal from "@/components/PricingModal";

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
  
  const padding = 20;
  const gaugeHeight = size * 0.7;
  const textHeight = 60;
  const totalHeight = gaugeHeight + textHeight;
  const cx = size / 2;
  const cy = gaugeHeight / 2 + padding;
  const r = (size - padding * 2) / 2 - 20;
  
  const startAngle = -90;
  const endAngle = angle - 90;
  const start = [cx + r * Math.cos((Math.PI * startAngle) / 180), cy + r * Math.sin((Math.PI * startAngle) / 180)];
  const end = [cx + r * Math.cos((Math.PI * endAngle) / 180), cy + r * Math.sin((Math.PI * endAngle) / 180)];
  const largeArc = angle > 180 ? 1 : 0;
  const arcPath = `M ${start[0]} ${start[1]} A ${r} ${r} 0 ${largeArc} 1 ${end[0]} ${end[1]}`;
  const needleAngle = ((value / max) * 180) - 90;
  const needleX = cx + (r - 10) * Math.cos((Math.PI * needleAngle) / 180);
  const needleY = cy + (r - 10) * Math.sin((Math.PI * needleAngle) / 180);
  
  return (
    <div className="flex flex-col items-center justify-center">
      <svg 
        width={size} 
        height={totalHeight} 
        viewBox={`0 0 ${size} ${totalHeight}`} 
        className="block mx-auto drop-shadow-[0_0_32px_#FFD70088]"
        style={{ overflow: 'visible' }}
      >
        <path 
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`} 
          fill="none" 
          stroke="#232323" 
          strokeWidth={20} 
          strokeLinecap="round"
        />
        <path 
          d={arcPath} 
          fill="none" 
          stroke="#FFD700" 
          strokeWidth={20} 
          strokeLinecap="round" 
          filter="url(#glow)"
        />
        <defs>
          <filter id="glow">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#FFD700" floodOpacity="0.8" />
          </filter>
        </defs>
        <line 
          x1={cx} 
          y1={cy} 
          x2={needleX} 
          y2={needleY} 
          stroke="#FFD700" 
          strokeWidth={8} 
          strokeLinecap="round"
          filter="url(#glow)"
        />
        <circle 
          cx={cx} 
          cy={cy} 
          r={16} 
          fill="#FFD700" 
          stroke="#232323" 
          strokeWidth={4}
          filter="url(#glow)"
        />
        <text 
          x={cx} 
          y={cy + 8} 
          textAnchor="middle" 
          fill="#FFD700" 
          fontSize="3.5rem" 
          fontWeight="bold"
          className="drop-shadow-[0_0_8px_#FFD700]"
        >
          {Math.round(value)}
        </text>
        <text 
          x={cx} 
          y={gaugeHeight + 35} 
          textAnchor="middle" 
          fill="#C0C0C0" 
          fontSize="1.1rem" 
          fontWeight="bold"
        >
          SEO Score
        </text>
      </svg>
    </div>
  );
}

function MissionTimer({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = React.useState(0);
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);
  
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  
  return (
    <div className="text-3xl font-bold text-yellow-400 font-mono">
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
}

function calculateTrafficGrowth(issuesCount: number, overallScore: number): number {
  const issueImpact = issuesCount * 2.5;
  const scoreGap = (100 - overallScore) * 0.3;
  return Math.min(Math.round(issueImpact + scoreGap), 50);
}

function VitalsTrendGraph({ history, metric }: { history: any[]; metric: 'lcp' | 'fcp' | 'tti' }) {
  if (!history || history.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-[#C0C0C0] text-sm">
        No historical data available
      </div>
    );
  }

  const data = history
    .filter(h => h[metric] != null)
    .slice(-6)
    .map(h => ({
      date: new Date(h.date).toLocaleDateString('en-US', { month: 'short' }),
      value: parseFloat(h[metric]),
    }));

  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  return (
    <div className="h-32 relative">
      <svg width="100%" height="100%" className="overflow-visible">
        <polyline
          points={data.map((d, i) => {
            const x = (i / (data.length - 1 || 1)) * 100;
            const y = 100 - ((d.value - minValue) / range) * 80;
            return `${x},${y}`;
          }).join(' ')}
          fill="none"
          stroke="#FFD700"
          strokeWidth="2"
          className="drop-shadow-[0_0_8px_#FFD70066]"
        />
        {data.map((d, i) => {
          const x = (i / (data.length - 1 || 1)) * 100;
          const y = 100 - ((d.value - minValue) / range) * 80;
          return (
            <g key={i}>
              <circle cx={`${x}%`} cy={`${y}%`} r="4" fill="#FFD700" />
              <text x={`${x}%`} y="95%" textAnchor="middle" fill="#C0C0C0" fontSize="10">{d.date}</text>
              <text x={`${x}%`} y={`${y - 8}%`} textAnchor="middle" fill="#FFD700" fontSize="10">{d.value.toFixed(1)}s</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function RadarChart({ mySite, competitor }: { mySite: any; competitor: any }) {
  const metrics = [
    { key: 'technical', label: 'Technical' },
    { key: 'onpage', label: 'On-Page' },
    { key: 'content', label: 'Content' },
    { key: 'competitor', label: 'Competitor' },
  ];

  const maxValue = 100;
  const centerX = 150;
  const centerY = 150;
  const radius = 100;

  return (
    <div className="flex justify-center">
      <svg width="300" height="300" viewBox="0 0 300 300">
        {[20, 40, 60, 80, 100].map((r, i) => (
          <circle
            key={i}
            cx={centerX}
            cy={centerY}
            r={(r / 100) * radius}
            fill="none"
            stroke="#232323"
            strokeWidth="1"
          />
        ))}
        
        {metrics.map((metric, i) => {
          const angle = (i * 2 * Math.PI) / metrics.length - Math.PI / 2;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          return (
            <line
              key={metric.key}
              x1={centerX}
              y1={centerY}
              x2={x}
              y2={y}
              stroke="#232323"
              strokeWidth="1"
            />
          );
        })}

        {mySite && (
          <polygon
            points={metrics.map((metric, i) => {
              const angle = (i * 2 * Math.PI) / metrics.length - Math.PI / 2;
              const value = (mySite[`${metric.key}_score`] || 0) / maxValue;
              const x = centerX + radius * value * Math.cos(angle);
              const y = centerY + radius * value * Math.sin(angle);
              return `${x},${y}`;
            }).join(' ')}
            fill="#FFD700"
            fillOpacity="0.3"
            stroke="#FFD700"
            strokeWidth="2"
          />
        )}

        {competitor && (
          <polygon
            points={metrics.map((metric, i) => {
              const angle = (i * 2 * Math.PI) / metrics.length - Math.PI / 2;
              const value = (competitor[`${metric.key}_score`] || 0) / maxValue;
              const x = centerX + radius * value * Math.cos(angle);
              const y = centerY + radius * value * Math.sin(angle);
              return `${x},${y}`;
            }).join(' ')}
            fill="#C0C0C0"
            fillOpacity="0.3"
            stroke="#C0C0C0"
            strokeWidth="2"
          />
        )}

        {metrics.map((metric, i) => {
          const angle = (i * 2 * Math.PI) / metrics.length - Math.PI / 2;
          const x = centerX + (radius + 20) * Math.cos(angle);
          const y = centerY + (radius + 20) * Math.sin(angle);
          return (
            <text
              key={metric.key}
              x={x}
              y={y}
              textAnchor="middle"
              fill="#C0C0C0"
              fontSize="12"
            >
              {metric.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default function AuditDashboard() {
  const router = useRouter();
  const supabase = createSupabaseClient();
  
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [audit, setAudit] = useState<any>(null);
  const [audits, setAudits] = useState<any[]>([]);
  // White-label mode removed - always false
  const whiteLabel = false;
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [competitorData, setCompetitorData] = useState<any>(null);
  const [vitalsHistory, setVitalsHistory] = useState<any[]>([]);
  const [missionStartTime] = useState(Date.now());
  const [newCompetitorDomain, setNewCompetitorDomain] = useState("");
  const [addingCompetitor, setAddingCompetitor] = useState(false);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [editingCompetitor, setEditingCompetitor] = useState<string | null>(null);
  const [editCompetitorDomain, setEditCompetitorDomain] = useState("");
  const [trackedKeywords, setTrackedKeywords] = useState<any[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [addingKeyword, setAddingKeyword] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<string | null>(null);
  const [editKeywordText, setEditKeywordText] = useState("");
  const [backlinkData, setBacklinkData] = useState<any>(null);
  const [backlinkHistory, setBacklinkHistory] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [auditCount, setAuditCount] = useState(0);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showAuditHistory, setShowAuditHistory] = useState(false);

  useEffect(() => {
    setAudit(null);
    setError(null);
    setDomain("");
    loadProjects();
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      loadAllAudits();
    }
  }, [projects.length]);

  useEffect(() => {
    if (projects.length === 0 && !loading) {
      const checkProjects = async () => {
        const user = await getCurrentUserClient();
        if (user) {
          const response = await fetch('/api/projects');
          if (response.ok) {
            const data = await response.json();
            if (!data.projects || data.projects.length === 0) {
              router.push('/create-project');
            }
          }
        }
      };
      checkProjects();
    }
  }, [projects.length, loading, router]);

  const loadProjects = async () => {
    try {
      // Use custom auth instead of Supabase Auth
      const user = await getCurrentUserClient();
      if (!user) {
        router.push('/sign-in');
        return;
      }

      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      // Create profile if it doesn't exist
      if (!profile || profileError) {
        console.log('Profile not found or error, creating new profile:', profileError);
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.full_name || user.email?.split('@')[0] || 'User',
            plan_type: 'free',
            api_credits: 100,
          })
          .select()
          .single();
        
        if (!createError && newProfile) {
          profile = newProfile;
        } else if (createError) {
          console.error('Error creating profile:', createError);
        }
      }
      
      // Always set userProfile, even if we have to use defaults
      if (profile) {
        setUserProfile({
          ...profile,
          email: user.email || profile.email,
          full_name: profile.full_name || user.full_name || user.email?.split('@')[0] || 'User',
        });
      } else {
        // Fallback: set profile from auth user data
        setUserProfile({
          id: user.id,
          email: user.email,
          full_name: user.full_name || user.email?.split('@')[0] || 'User',
          plan_type: 'free',
          api_credits: 100,
        });
      }

      // Load audit_count from users table (not from counting audits)
      const { data: userData } = await supabase
        .from('users')
        .select('audit_count')
        .eq('id', user.id)
        .single();
      
      if (userData) {
        setAuditCount(userData.audit_count || 0);
      }

      const response = await fetch('/api/projects');
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to load projects:', errorText);
        return;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Response is not JSON:', contentType);
        return;
      }

      const data = await response.json();
      setProjects(data.projects || []);
      if (data.projects && data.projects.length > 0) {
        setCurrentProject(data.projects[0]);
        await loadAllAudits();
      }
    } catch (err) {
      console.error('Error loading projects:', err);
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  const loadAudits = async (projectId: string) => {
    try {
      const response = await fetch(`/api/audit?project_id=${projectId}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to load audits:', errorText);
        return;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Response is not JSON:', contentType);
        return;
      }

      const data = await response.json();
      setAudits(data.audits || []);
      
      // Load audit_count from users table (not from counting audits)
      const user = await getCurrentUserClient();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('audit_count')
          .eq('id', user.id)
          .single();
        
        if (userData) {
          setAuditCount(userData.audit_count || 0);
        }
      }
    } catch (err) {
      console.error('Error loading audits:', err);
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  const loadAllAudits = async () => {
    try {
      const allAudits: any[] = [];

      // If we have projects, load audits by project
      if (projects.length > 0) {
        const projectIds = projects.map((p: any) => p.id);
        for (const projectId of projectIds) {
          const response = await fetch(`/api/audit?project_id=${projectId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.audits && Array.isArray(data.audits)) {
              allAudits.push(...data.audits);
            }
          }
        }
      }

      // Also try to load all audits for the user directly
      try {
        const user = await getCurrentUserClient();
        if (user) {
          const { data: userAudits } = await supabase
            .from('audits')
            .select(`
              *,
              projects:project_id (
                id,
                domain,
                name
              )
            `)
            .order('created_at', { ascending: false });

          if (userAudits && Array.isArray(userAudits)) {
            // Merge with existing audits, avoiding duplicates
            const existingIds = new Set(allAudits.map(a => a.id));
            userAudits.forEach(audit => {
              if (!existingIds.has(audit.id)) {
                allAudits.push(audit);
              }
            });
          }
        }
      } catch (supabaseError) {
        console.log('Could not load audits from Supabase directly:', supabaseError);
      }

      allAudits.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });

      setAudits(allAudits);
      
      // Load audit_count from users table (not from counting audits)
      const user = await getCurrentUserClient();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('audit_count')
          .eq('id', user.id)
          .single();
        
        if (userData) {
          setAuditCount(userData.audit_count || 0);
        }
      }
    } catch (err) {
      console.error('Error loading all audits:', err);
    }
  };

  const loadAuditById = async (auditId: string) => {
    try {
      const response = await fetch(`/api/audit?id=${auditId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.audit) {
          setAudit(data.audit);
          setDomain(data.audit.domain || '');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    } catch (err) {
      console.error('Error loading audit:', err);
      setError('Failed to load audit');
    }
  };

  const handleSubscribe = async (planType: string) => {
    // PricingModal now handles Stripe checkout directly
    // This function is kept for compatibility but the actual
    // Stripe flow is handled in PricingModal component which redirects to Stripe
    // The modal will handle the Stripe redirect, no need to do anything here
    console.log('Plan selected:', planType);
  };

  const loadVitalsHistory = async (auditId: string) => {
    try {
      const response = await fetch(`/api/vitals/history?audit_id=${auditId}&months=6`);
      if (response.ok) {
        const data = await response.json();
        setVitalsHistory(data.history || []);
      }
    } catch (err) {
      console.error('Error loading vitals history:', err);
    }
  };

  const loadCompetitorData = async (projectId: string) => {
    try {
      const user = await getCurrentUserClient();
      if (!user) return;

      const response = await fetch(`/api/competitors?project_id=${projectId}`);
      
      if (response.ok) {
        const data = await response.json();
        const competitorList = data.competitors || [];
        setCompetitors(competitorList);
        
        if (competitorList.length > 0) {
          const analyzeResponse = await fetch('/api/competitors/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              competitorDomains: competitorList.map((c: any) => c.domain),
            }),
          });
          
          if (analyzeResponse.ok) {
            const analysisData = await analyzeResponse.json();
            setCompetitorData(analysisData);
          }
        } else {
          setCompetitorData(null);
        }
      }
    } catch (err) {
      console.error('Error loading competitor data:', err);
    }
  };

  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !newCompetitorDomain.trim()) return;

    setAddingCompetitor(true);
    try {
      const domain = newCompetitorDomain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
      
      const response = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject.id,
          domain,
          name: domain,
        }),
      });

      if (response.ok) {
        setNewCompetitorDomain("");
        await loadCompetitorData(currentProject.id);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to add competitor');
      }
    } catch (err) {
      setError('Failed to add competitor');
    } finally {
      setAddingCompetitor(false);
    }
  };

  const handleRemoveCompetitor = async (competitorId: string) => {
    if (!currentProject) return;

    try {
      const response = await fetch(`/api/competitors?id=${competitorId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadCompetitorData(currentProject.id);
      }
    } catch (err) {
      console.error('Error removing competitor:', err);
    }
  };

  const handleEditCompetitor = (competitor: any) => {
    setEditingCompetitor(competitor.id);
    setEditCompetitorDomain(competitor.domain);
  };

  const handleSaveCompetitorEdit = async (competitorId: string) => {
    if (!currentProject || !editCompetitorDomain.trim()) return;

    try {
      const domain = editCompetitorDomain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
      
      const response = await fetch(`/api/competitors?id=${competitorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, name: domain }),
      });

      if (response.ok) {
        setEditingCompetitor(null);
        setEditCompetitorDomain("");
        await loadCompetitorData(currentProject.id);
      }
    } catch (err) {
      console.error('Error updating competitor:', err);
    }
  };

  const loadTrackedKeywords = async (projectId: string) => {
    try {
      const response = await fetch(`/api/keywords?project_id=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setTrackedKeywords(data.keywords || []);
      }
    } catch (err) {
      console.error('Error loading keywords:', err);
    }
  };

  const loadBacklinks = async (projectId: string) => {
    try {
      console.log('Loading backlinks for project:', projectId);
      const response = await fetch(`/api/backlinks?project_id=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Backlinks data received:', data);
        setBacklinkData(data.backlinks);
        setBacklinkHistory(data.history || []);
      } else {
        const errorData = await response.json();
        console.warn('Failed to load backlinks:', response.status, errorData);
      }
    } catch (err) {
      console.error('Error loading backlinks:', err);
    }
  };

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !newKeyword.trim()) return;

    setAddingKeyword(true);
    try {
      const response = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject.id,
          keyword: newKeyword.trim(),
          location: 'United Kingdom',
          deviceType: 'desktop',
        }),
      });

      if (response.ok) {
        setNewKeyword("");
        await loadTrackedKeywords(currentProject.id);
        if (currentProject.id) {
          await loadCompetitorData(currentProject.id);
          await loadBacklinks(currentProject.id);
        }
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to add keyword');
      }
    } catch (err) {
      setError('Failed to add keyword');
    } finally {
      setAddingKeyword(false);
    }
  };

  const handleDeleteKeyword = async (keywordId: string) => {
    if (!currentProject) return;

    try {
      const response = await fetch(`/api/keywords?id=${keywordId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadTrackedKeywords(currentProject.id);
        if (currentProject.id) {
          await loadCompetitorData(currentProject.id);
          await loadBacklinks(currentProject.id);
        }
      }
    } catch (err) {
      console.error('Error deleting keyword:', err);
    }
  };

  const handleEditKeyword = (keyword: any) => {
    setEditingKeyword(keyword.id);
    setEditKeywordText(keyword.keyword);
  };

  const handleSaveKeywordEdit = async (keywordId: string) => {
    if (!currentProject || !editKeywordText.trim()) return;

    try {
      const response = await fetch(`/api/keywords?id=${keywordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: editKeywordText.trim() }),
      });

      if (response.ok) {
        setEditingKeyword(null);
        setEditKeywordText("");
        await loadTrackedKeywords(currentProject.id);
        if (currentProject.id) {
          await loadCompetitorData(currentProject.id);
          await loadBacklinks(currentProject.id);
        }
      }
    } catch (err) {
      console.error('Error updating keyword:', err);
    }
  };

  const handleRunAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) {
      setError('Please enter a domain');
      return;
    }

    if (auditCount >= 2 && (!userProfile || userProfile.plan_type === 'free')) {
      setShowPricingModal(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const normalizedDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
      
      let project = currentProject;
      if (!project || project.domain !== normalizedDomain) {
        const projectResponse = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: normalizedDomain }),
        });

        if (projectResponse.ok) {
          const projectData = await projectResponse.json();
          project = projectData.project;
          setCurrentProject(project);
          setProjects([...projects, project]);
        }
      }

      const auditResponse = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          domain: normalizedDomain,
          projectId: project?.id 
        }),
      });

      if (!auditResponse.ok) {
        const contentType = auditResponse.headers.get('content-type');
        let errorMessage = 'Failed to run audit';
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await auditResponse.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
          }
        } else {
          const errorText = await auditResponse.text();
          console.error('Non-JSON error response:', errorText);
        }
        
        throw new Error(errorMessage);
      }

      const contentType = auditResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format from server');
      }

      const auditData = await auditResponse.json();
      setAudit(auditData.result);
      
      if (auditData.audit_id) {
        pollAuditStatus(auditData.audit_id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to run audit');
      setAudit(null);
      setLoading(false);
    }
  };

  const pollAuditStatus = async (auditId: string) => {
    const maxAttempts = 30;
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/audit?id=${auditId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.audit && data.audit.status === 'completed') {
            setAudit(data.audit);
            setLoading(false);
            
            // Reload audit_count from users table (not from counting audits)
            const user = await getCurrentUserClient();
            if (user) {
              const { data: userData } = await supabase
                .from('users')
                .select('audit_count')
                .eq('id', user.id)
                .single();
              
              if (userData) {
                setAuditCount(userData.audit_count || 0);
              }
            }
            
            if (data.audit?.id) {
              loadVitalsHistory(data.audit.id);
            }
            
            if (currentProject) {
              loadAudits(currentProject.id);
              loadCompetitorData(currentProject.id);
              loadTrackedKeywords(currentProject.id);
              setTimeout(() => {
                loadBacklinks(currentProject.id);
              }, 3000);
            }
            
            if (!data.audit?.raw_data?.technical?.lcp || data.audit?.raw_data?.technical?.lcp === 0) {
              console.log('Starting PageSpeed polling for audit', auditId);
              let psiPollCount = 0;
              const maxPsiPolls = 18;
              const psiPollInterval = setInterval(async () => {
                psiPollCount++;
                console.log(`PageSpeed poll attempt ${psiPollCount}/${maxPsiPolls} for audit ${auditId}`);
                
                if (psiPollCount > maxPsiPolls) {
                  console.log('PageSpeed polling stopped - max attempts reached');
                  clearInterval(psiPollInterval);
                  return;
                }
                
                try {
                  const refreshResponse = await fetch(`/api/audit?id=${auditId}`);
                  if (refreshResponse.ok) {
                    const refreshData = await refreshResponse.json();
                    const lcp = refreshData.audit?.raw_data?.technical?.lcp;
                    console.log('Polling check - LCP value:', lcp);
                    
                    if (lcp && lcp > 0) {
                      console.log('PageSpeed data found! Updating dashboard...');
                      setAudit(refreshData.audit);
                      if (refreshData.audit?.id) {
                        loadVitalsHistory(refreshData.audit.id);
                      }
                      clearInterval(psiPollInterval);
                      console.log('PageSpeed polling stopped - data loaded');
                    }
                  }
                } catch (err) {
                  console.warn('PageSpeed polling error:', err);
                }
              }, 5000);
            }
            
            return;
          } else if (data.audit && data.audit.status === 'failed') {
            setError('Audit failed. Please try again.');
            setLoading(false);
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setError('Audit is taking longer than expected. Please refresh the page.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Polling error:', err);
        setLoading(false);
      }
    };

    poll();
  };

  const handleDownloadPDF = async () => {
    if (!audit || !currentProject) {
      setError('No audit data available');
      return;
    }

    try {
      let auditId = audit.id;
      
      if (!auditId) {
        const auditRecord = audits.find(a => 
          a.domain === currentProject.domain || 
          (a.project_id && a.project_id === currentProject.id)
        );
        if (auditRecord) {
          auditId = auditRecord.id;
        }
      }
      
      if (!auditId && currentProject.id) {
        const projectAudits = audits.filter(a => a.project_id === currentProject.id);
        if (projectAudits.length > 0) {
          const sortedAudits = projectAudits.sort((a, b) => 
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          );
          auditId = sortedAudits[0].id;
        }
      }

      if (!auditId) {
        setError('Audit ID not found. Please run an audit first.');
        return;
      }

      setError(null);
      setLoading(true);

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          auditId: auditId,
          whiteLabel: undefined
        }),
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        
        // Check if response is PDF
        if (contentType && contentType.includes('application/pdf')) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `seo-audit-${currentProject.domain}-${Date.now()}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          setShowLeadModal(false);
          setLeadName('');
          setLeadEmail('');
        } else {
          // If not PDF, try to parse as JSON error
          const errorData = await response.json();
          setError(errorData.error || 'Failed to generate PDF');
        }
      } else {
        // Handle error response
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to generate PDF');
        } else {
          const errorText = await response.text();
          setError(errorText || 'Failed to generate PDF');
        }
      }
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to download PDF');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutClient();
      // signOutClient already handles redirect
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const auditData = audit?.raw_data || audit || {
    overall_score: 0,
    technical_score: 0,
    onpage_score: 0,
    content_score: 0,
    technical: { https: false, mobile: false, lcp: 0, fcp: 0, tti: 0 },
    onpage: { title: { length: 0 }, description: { missing: true }, h1: 0, h2: 0, h3: 0, images: { total: 0, missing: 0, valid: 0 } },
    content: { readability: 0, word_count: 0, keyword_density: [], suggestions: [] },
    issues: []
  };

  const getIssues = (): any[] => {
    let issuesList: any[] = [];
    const currentAuditData = audit?.raw_data || audit || auditData;
    
    if (audit?.audit_issues) {
      if (Array.isArray(audit.audit_issues)) {
        issuesList = audit.audit_issues;
      } else if (typeof audit.audit_issues === 'object') {
        const values = Object.values(audit.audit_issues);
        if (values.length > 0 && Array.isArray(values[0])) {
          issuesList = values[0] as any[];
        } else {
          issuesList = values.filter((item: any) => item && typeof item === 'object' && item.title);
        }
      }
    }
    
    if (issuesList.length === 0 && currentAuditData?.issues && Array.isArray(currentAuditData.issues)) {
      issuesList = currentAuditData.issues;
    }
    
    if (issuesList.length === 0 && currentAuditData) {
      const inferredIssues: any[] = [];
      
      if (currentAuditData.onpage?.title?.length && (currentAuditData.onpage.title.length < 30 || currentAuditData.onpage.title.length > 60)) {
        inferredIssues.push({
          type: 'onpage',
          severity: 'warning',
          title: 'Title tag length not optimal',
          description: `Your title is ${currentAuditData.onpage.title.length} characters. Optimal length is 30-60 characters.`,
          fix_suggestion: 'Adjust your title tag to be between 30-60 characters.',
        });
      }
      
      if (currentAuditData.onpage?.images?.missing > 0) {
        inferredIssues.push({
          type: 'onpage',
          severity: 'warning',
          title: `${currentAuditData.onpage.images.missing} images missing alt text`,
          description: 'Images without alt text are not accessible and hurt SEO.',
          fix_suggestion: 'Add descriptive alt text to all images.',
        });
      }
      
      if (currentAuditData.onpage?.description?.missing) {
        inferredIssues.push({
          type: 'onpage',
          severity: 'critical',
          title: 'Missing meta description',
          description: 'Your page has no meta description.',
          fix_suggestion: 'Add a compelling meta description between 120-160 characters.',
        });
      }
      
      if (!currentAuditData.technical?.https) {
        inferredIssues.push({
          type: 'technical',
          severity: 'critical',
          title: 'HTTPS not enabled',
          description: 'Your site is not using HTTPS, which is required for security and SEO.',
          fix_suggestion: 'Install an SSL certificate and redirect all HTTP traffic to HTTPS.',
        });
      }
      
      if (inferredIssues.length > 0) {
        issuesList = inferredIssues;
      }
    }
    
    return issuesList;
  };
  
  const issues = getIssues();

  return (
    <div className="flex min-h-screen bg-gradient-to-r from-[#101010] via-[#181818] to-[#232323]">
      <aside className="hidden md:flex flex-col w-64 bg-gradient-to-b from-black via-[#181818] to-[#232323] border-r border-yellow-400/20 py-8 px-6 shadow-2xl z-20 h-screen">
        <div className="flex items-center gap-3 mb-10">
          <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-yellow-400 overflow-hidden">
            <img src="/logo.svg" alt="Logo" className="h-8 w-8 rounded-full object-cover" />
          </div>
          <span className="text-2xl font-extrabold hero-gradient-text tracking-tight">SEOInForce</span>
        </div>
        <nav className="mt-10 flex flex-col gap-4 text-[#FFD700] font-semibold text-lg">
          <button 
            onClick={() => setShowAuditHistory(false)}
            className={`text-left hover:text-white transition ${!showAuditHistory ? 'text-white' : ''}`}
          >
            Overview
          </button>
          <button 
            onClick={() => {
              setShowAuditHistory(true);
              loadAllAudits(); // Reload audits when clicking on history
            }}
            className={`text-left hover:text-white transition flex items-center gap-2 ${showAuditHistory ? 'text-white' : ''}`}
          >
            <FileText className="h-4 w-4" />
            Audit History
          </button>
          {!showAuditHistory && (
            <>
              <a href="#technical" className="hover:text-white transition">Technical SEO</a>
              <a href="#onpage" className="hover:text-white transition">On-Page</a>
              <a href="#content" className="hover:text-white transition">Content</a>
              <a href="#competitors" className="hover:text-white transition">Competitors</a>
              <a href="#fixes" className="hover:text-white transition">Fixes</a>
            </>
          )}
        </nav>
        <div className="mt-auto pt-8 border-t border-yellow-400/20">
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-gradient-to-r from-black/80 via-[#181818]/80 to-[#232323]/80 backdrop-blur-md border-b border-yellow-400/10 px-3 sm:px-4 py-2 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 shadow-lg">
          <div className="flex flex-col w-full sm:w-auto">
            <div className="text-base sm:text-lg font-bold hero-gradient-text">SEO Task Force Command Center</div>
            <div className="flex items-center gap-2 sm:gap-4 text-xs text-[#C0C0C0] mt-1 flex-wrap">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="truncate max-w-[120px] sm:max-w-none">{userProfile?.full_name || 'User'}</span>
              </div>
              <div className="hidden sm:flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span className="truncate">{userProfile?.email || 'No email'}</span>
              </div>
              {currentProject && (
                <div className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  <span className="truncate max-w-[100px] sm:max-w-none">{currentProject.name || currentProject.domain}</span>
                </div>
              )}
              {userProfile?.plan_type && (
                <div className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  userProfile.plan_type === 'empire' ? 'bg-purple-500/20 text-purple-400' :
                  userProfile.plan_type === 'growth' ? 'bg-yellow-400/20 text-yellow-400' :
                  userProfile.plan_type === 'starter' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {userProfile.plan_type.charAt(0).toUpperCase() + userProfile.plan_type.slice(1)} Plan
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 items-center w-full sm:w-auto flex-wrap">
            {audit && (
              <Button 
                className="bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 text-black font-bold px-3 sm:px-6 py-2 rounded-lg shadow hover:bg-yellow-500 transition text-sm sm:text-base flex-1 sm:flex-initial" 
                onClick={() => setShowLeadModal(true)}
              >
                <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" /> 
                <span className="hidden sm:inline">Download PDF</span>
                <span className="sm:hidden">PDF</span>
              </Button>
            )}
            <Button className="bg-gradient-to-r from-[#C0C0C0] via-[#FFD700] to-yellow-400 text-black font-bold px-3 sm:px-6 py-2 rounded-lg shadow hover:bg-yellow-500 transition text-sm sm:text-base flex-1 sm:flex-initial" onClick={() => setShowBookModal(true)}>
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" /> 
              <span className="hidden sm:inline">Book Strategy Call</span>
              <span className="sm:hidden">Book Call</span>
            </Button>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 px-3 sm:px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm sm:text-base"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-10 flex flex-col gap-10">
          {showAuditHistory ? (
            <section className="w-full py-6 rounded-3xl bg-gradient-to-br from-black/90 via-[#181818]/95 to-black/90 border-2 border-yellow-400/30 shadow-2xl backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 px-4 sm:px-6 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-3 rounded-xl bg-yellow-400/20 border border-yellow-400/30">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold hero-gradient-text">Audit History</h2>
                    <p className="text-xs sm:text-sm text-[#C0C0C0] mt-1">{audits.length} audit{audits.length !== 1 ? 's' : ''} completed</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowAuditHistory(false)}
                  variant="outline"
                  className="border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10 text-sm sm:text-base w-full sm:w-auto"
                >
                  <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
                  Back to Dashboard
                </Button>
              </div>

              {audits.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <FileText className="h-16 w-16 text-[#C0C0C0] mx-auto mb-4 opacity-50" />
                  <p className="text-[#C0C0C0] text-lg">No audit history yet</p>
                  <p className="text-[#C0C0C0] text-sm mt-2">Run your first audit to see it here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4 sm:px-6 pb-6">
                  {audits.map((auditRecord: any) => {
                    const auditDate = new Date(auditRecord.created_at);
                    const isCompleted = auditRecord.status === 'completed';
                    const score = auditRecord.overall_score || 0;
                    const scoreColor = score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400';
                    
                    return (
                      <div
                        key={auditRecord.id}
                        onClick={() => {
                          if (isCompleted) {
                            loadAuditById(auditRecord.id);
                            setShowAuditHistory(false);
                          }
                        }}
                        className={`bg-gradient-to-br from-black/80 to-[#181818]/80 p-5 rounded-2xl border-2 transition-all ${
                          isCompleted
                            ? 'border-yellow-400/30 hover:border-yellow-400/50 hover:shadow-lg hover:scale-[1.02] cursor-pointer'
                            : 'border-gray-700/50 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="text-sm text-[#C0C0C0] mb-1">Domain</div>
                            <div className="text-base font-bold text-white truncate">{auditRecord.domain}</div>
                          </div>
                          {isCompleted && (
                            <div className={`text-2xl font-bold ${scoreColor}`}>
                              {score}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-[#C0C0C0] mb-3">
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            <span>{auditDate.toLocaleDateString()}</span>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-semibold ${
                            auditRecord.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            auditRecord.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                            auditRecord.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {auditRecord.status}
                          </div>
                        </div>

                        {isCompleted && (
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <div className="text-[#C0C0C0]">Technical</div>
                              <div className="text-yellow-400 font-semibold">{auditRecord.technical_score || 0}</div>
                            </div>
                            <div>
                              <div className="text-[#C0C0C0]">On-Page</div>
                              <div className="text-yellow-400 font-semibold">{auditRecord.onpage_score || 0}</div>
                            </div>
                            <div>
                              <div className="text-[#C0C0C0]">Content</div>
                              <div className="text-yellow-400 font-semibold">{auditRecord.content_score || 0}</div>
                            </div>
                          </div>
                        )}

                        {!isCompleted && (
                          <div className="text-xs text-[#C0C0C0] italic">
                            {auditRecord.status === 'processing' ? 'Processing...' : 'Not completed'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          ) : (
            <>
              <section className="max-w-2xl mx-auto px-4 sm:px-6 pt-8 sm:pt-16 pb-6 sm:pb-10 text-center fade-in-up">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold hero-gradient-text mb-3">See SEOInForce in action – instant audits, real results.</h1>
                <p className="text-[#C0C0C0] text-base sm:text-lg mb-6 px-4">Enter your domain and get a free instant SEO audit report in under 60 seconds.</p>
                <form className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-2 px-4 sm:px-0" onSubmit={handleRunAudit}>
                  {error && (
                    <div className="w-full bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
                      {error}
                    </div>
                  )}
                  <Input
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                    placeholder="Enter your domain (e.g. example.com)"
                    className="w-full sm:flex-1 bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border border-yellow-400/30 text-white px-4 sm:px-5 py-3 sm:py-4 rounded-2xl text-base sm:text-lg shadow"
                    disabled={loading}
                  />
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full sm:w-auto bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 text-black font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-2xl shadow-lg text-base sm:text-lg hover:bg-yellow-500 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" /> Analyzing...
                      </>
                    ) : (
                      <>
                        <Search className="h-5 w-5" /> Analyze My Site
                      </>
                    )}
                  </Button>
                </form>
                <div className="text-xs text-[#FFD700] font-semibold mb-4">Instant SEO Audit in under 60 seconds. No credit card required.</div>
              </section>

              {loading && (
                <div className="text-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-yellow-400 mx-auto mb-4" />
                  <p className="text-[#C0C0C0]">Running SEO audit... This may take up to 60 seconds.</p>
                </div>
              )}

              {audit && !loading && (
                <>
                  <section className="relative w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 mb-12 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-[#FFD700]/5 to-transparent rounded-3xl blur-3xl"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.1),transparent_70%)]"></div>
                    
                    <div className="relative bg-gradient-to-br from-black/90 via-[#181818]/95 to-black/90 rounded-3xl border-2 border-yellow-400/40 shadow-2xl backdrop-blur-xl p-8 md:p-12">
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-yellow-400/20">
                        <div>
                          <div className="text-sm text-[#C0C0C0] mb-1">Domain Analyzed</div>
                          <div className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                            <Shield className="h-6 w-6" />
                            {audit?.domain || currentProject?.domain || auditData.domain || domain || 'N/A'}
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div className="text-right">
                            <div className="text-sm text-[#C0C0C0]">Issues Found</div>
                            <div className="text-xl font-bold text-red-400">{issues.length}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-[#C0C0C0]">Critical</div>
                            <div className="text-xl font-bold text-red-500">{issues.filter((i: any) => i.severity === 'critical').length}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 mb-8">
                        <div className="flex-shrink-0 w-full lg:w-auto flex justify-center items-center py-4">
                          <AnimatedGauge value={auditData.overall_score || 0} size={280} />
                        </div>

                        <div className="flex-1 w-full grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                          <div className="bg-gradient-to-br from-black/80 to-[#181818]/80 p-5 lg:p-6 rounded-2xl border-2 border-yellow-400/30 shadow-lg hover:border-yellow-400/50 transition-all group min-w-0">
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              <Wrench className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                              <span className="text-sm font-semibold text-[#FFD700] whitespace-nowrap">Technical</span>
                            </div>
                            <div className="w-full h-4 bg-[#232323] rounded-full overflow-hidden mb-2">
                              <AnimatedProgress value={auditData.technical_score || 0} />
                            </div>
                            <div className="text-xl lg:text-2xl font-bold text-yellow-400 break-words">
                              {auditData.technical_score || 0}
                              <span className="text-xs lg:text-sm text-[#C0C0C0] ml-1">/100</span>
                            </div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-black/80 to-[#181818]/80 p-5 lg:p-6 rounded-2xl border-2 border-yellow-400/30 shadow-lg hover:border-yellow-400/50 transition-all group min-w-0">
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              <FileText className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                              <span className="text-sm font-semibold text-[#FFD700] whitespace-nowrap">On-Page</span>
                            </div>
                            <div className="w-full h-4 bg-[#232323] rounded-full overflow-hidden mb-2">
                              <AnimatedProgress value={auditData.onpage_score || 0} />
                            </div>
                            <div className="text-xl lg:text-2xl font-bold text-yellow-400 break-words">
                              {auditData.onpage_score || 0}
                              <span className="text-xs lg:text-sm text-[#C0C0C0] ml-1">/100</span>
                            </div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-black/80 to-[#181818]/80 p-5 lg:p-6 rounded-2xl border-2 border-yellow-400/30 shadow-lg hover:border-yellow-400/50 transition-all group min-w-0">
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              <MessageCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                              <span className="text-sm font-semibold text-[#FFD700] whitespace-nowrap">Content</span>
                            </div>
                            <div className="w-full h-4 bg-[#232323] rounded-full overflow-hidden mb-2">
                              <AnimatedProgress value={auditData.content_score || 0} />
                            </div>
                            <div className="text-xl lg:text-2xl font-bold text-yellow-400 break-words">
                              {auditData.content_score || 0}
                              <span className="text-xs lg:text-sm text-[#C0C0C0] ml-1">/100</span>
                            </div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-black/80 to-[#181818]/80 p-5 lg:p-6 rounded-2xl border-2 border-yellow-400/30 shadow-lg hover:border-yellow-400/50 transition-all group min-w-0">
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              <LucideLink className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                              <span className="text-sm font-semibold text-[#FFD700] whitespace-nowrap">Competitor</span>
                            </div>
                            <div className="w-full h-4 bg-[#232323] rounded-full overflow-hidden mb-2">
                              <AnimatedProgress value={(competitorData?.competitor_score ?? auditData.competitor_score) || 0} />
                            </div>
                            <div className="text-xl lg:text-2xl font-bold text-yellow-400 break-words">
                              {(competitorData?.competitor_score ?? auditData.competitor_score) || 0}
                              <span className="text-xs lg:text-sm text-[#C0C0C0] ml-1">/100</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-yellow-400/20 via-[#FFD700]/20 to-yellow-400/20 rounded-2xl p-6 border-2 border-yellow-400/40">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div>
                            <div className="text-sm text-[#C0C0C0] mb-1">Potential Traffic Growth</div>
                            <div className="text-4xl font-extrabold text-yellow-400">
                              +{calculateTrafficGrowth(issues.length, auditData.overall_score)}%
                            </div>
                            <div className="text-sm text-[#C0C0C0] mt-1">By fixing all {issues.length} issues in the next 3 months</div>
                          </div>
                          <div className="flex gap-3">
                            <Button
                              className="bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 text-black font-bold px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition"
                              onClick={() => setShowLeadModal(true)}
                            >
                              <Download className="h-5 w-5 mr-2" /> Get Full Report
                            </Button>
                            <Button
                              className="bg-gradient-to-r from-[#C0C0C0] via-[#FFD700] to-yellow-400 text-black font-bold px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition"
                              onClick={() => setShowBookModal(true)}
                            >
                              <Shield className="h-5 w-5 mr-2" /> Book Strategy Call
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {auditData.overall_score === 0 && auditData.content?.word_count === 0 && (
                    <section className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 mb-6 rounded-2xl bg-yellow-400/10 border-2 border-yellow-400/50 shadow-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-bold text-yellow-400 mb-2">Limited Audit Results</h3>
                          <p className="text-sm text-[#C0C0C0] mb-2">
                            The audit couldn't extract meaningful content from this site. This may happen if:
                          </p>
                          <ul className="text-sm text-[#C0C0C0] list-disc list-inside space-y-1">
                            <li>The site requires authentication or login</li>
                            <li>The site blocks automated access (bot protection)</li>
                            <li>The site is JavaScript-heavy (SPA) and requires browser rendering</li>
                            <li>The site redirected to an error or login page</li>
                          </ul>
                          <p className="text-sm text-yellow-400 mt-3 font-semibold">
                            💡 Try analyzing a traditional HTML website or ensure the site allows public access.
                          </p>
                        </div>
                      </div>
                    </section>
                  )}

                  <section className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 mb-12">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-3xl font-extrabold hero-gradient-text mb-2">Priority Action Items</h2>
                        <p className="text-[#C0C0C0]">Fix these issues to boost your SEO score and traffic</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className={viewMode === 'desktop' ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400' : 'border-[#C0C0C0]/30 text-[#C0C0C0]'}
                          onClick={() => setViewMode('desktop')}
                        >
                          Desktop
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={viewMode === 'mobile' ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400' : 'border-[#C0C0C0]/30 text-[#C0C0C0]'}
                          onClick={() => setViewMode('mobile')}
                        >
                          Mobile
                        </Button>
                      </div>
                    </div>

                    {issues.filter((i: any) => i.severity === 'critical').length > 0 && (
                      <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                          <XCircle className="h-6 w-6 text-red-500" />
                          <h3 className="text-xl font-bold text-red-400">Critical Issues ({issues.filter((i: any) => i.severity === 'critical').length})</h3>
                          <span className="px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-full text-xs text-red-400 font-semibold">HIGH PRIORITY</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {issues.filter((i: any) => i.severity === 'critical').slice(0, 6).map((issue: any, i: number) => (
                            <div key={i} className="bg-gradient-to-br from-red-500/10 via-red-900/5 to-black/50 p-6 rounded-2xl border-2 border-red-500/40 shadow-lg hover:border-red-500/60 hover:shadow-xl transition-all group">
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex items-start gap-3 flex-1">
                                  <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
                                  <div className="flex-1">
                                    <h4 className="font-bold text-red-400 mb-1 group-hover:text-red-300 transition">{issue.title}</h4>
                                    {issue.description && (
                                      <p className="text-sm text-[#C0C0C0] mb-2">{issue.description}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {issue.fix_suggestion && (
                                <div className="bg-black/70 p-4 rounded-xl border border-yellow-400/30 mb-3">
                                  <div className="flex items-start gap-2 mb-2">
                                    <Sparkles className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm font-semibold text-yellow-400">Recommended Fix:</span>
                                  </div>
                                  <p className="text-sm text-[#C0C0C0] ml-6 mb-3">{issue.fix_suggestion}</p>
                                  <button
                                    className="ml-6 px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-[#ffd700] text-black font-bold text-sm hover:scale-105 transition shadow-lg"
                                    onClick={async (e) => {
                                      const button = e.currentTarget;
                                      const originalText = button.textContent;
                                      const textToCopy = issue.fix_suggestion;
                                      
                                      // Try modern clipboard API first
                                      if (navigator.clipboard && navigator.clipboard.writeText) {
                                        try {
                                          await navigator.clipboard.writeText(textToCopy);
                                          button.textContent = 'Copied!';
                                          button.classList.add('bg-green-500', 'from-green-400', 'to-green-500');
                                          setTimeout(() => {
                                            button.textContent = originalText;
                                            button.classList.remove('bg-green-500', 'from-green-400', 'to-green-500');
                                          }, 2000);
                                          return;
                                        } catch (clipboardErr) {
                                          console.log('Clipboard API failed, trying fallback');
                                        }
                                      }
                                      
                                      // Fallback method for older browsers
                                      try {
                                        const textArea = document.createElement('textarea');
                                        textArea.value = textToCopy;
                                        textArea.style.position = 'fixed';
                                        textArea.style.left = '0';
                                        textArea.style.top = '0';
                                        textArea.style.width = '2em';
                                        textArea.style.height = '2em';
                                        textArea.style.padding = '0';
                                        textArea.style.border = 'none';
                                        textArea.style.outline = 'none';
                                        textArea.style.boxShadow = 'none';
                                        textArea.style.background = 'transparent';
                                        textArea.style.opacity = '0';
                                        document.body.appendChild(textArea);
                                        textArea.focus();
                                        textArea.select();
                                        
                                        const successful = document.execCommand('copy');
                                        document.body.removeChild(textArea);
                                        
                                        if (successful) {
                                          button.textContent = 'Copied!';
                                          button.classList.add('bg-green-500', 'from-green-400', 'to-green-500');
                                          setTimeout(() => {
                                            button.textContent = originalText;
                                            button.classList.remove('bg-green-500', 'from-green-400', 'to-green-500');
                                          }, 2000);
                                        } else {
                                          throw new Error('execCommand failed');
                                        }
                                      } catch (fallbackErr) {
                                        // Last resort: show text in a prompt or selectable area
                                        const modal = document.createElement('div');
                                        modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1a1a1a;padding:20px;border:2px solid #fbbf24;border-radius:8px;z-index:10000;max-width:90%;max-height:90%;overflow:auto;';
                                        modal.innerHTML = `
                                          <h3 style="color:#fbbf24;margin-bottom:10px;">Copy this text:</h3>
                                          <textarea readonly style="width:100%;min-height:60px;padding:10px;background:#000;color:#fff;border:1px solid #fbbf24;border-radius:4px;font-family:monospace;" onclick="this.select()">${textToCopy}</textarea>
                                          <button onclick="this.parentElement.remove()" style="margin-top:10px;padding:8px 16px;background:#fbbf24;color:#000;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">Close</button>
                                        `;
                                        document.body.appendChild(modal);
                                        const textarea = modal.querySelector('textarea');
                                        if (textarea) {
                                          textarea.select();
                                          textarea.focus();
                                        }
                                      }
                                    }}
                                  >
                                    Copy Fix
                                  </button>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-xs text-[#C0C0C0]">
                                <span className="px-2 py-1 bg-red-500/20 rounded text-red-400">Impact: High</span>
                                <span className="px-2 py-1 bg-yellow-400/20 rounded text-yellow-400">Time: Quick Fix</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {issues.filter((i: any) => i.severity === 'warning').length > 0 && (
                      <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                          <AlertTriangle className="h-6 w-6 text-yellow-400" />
                          <h3 className="text-xl font-bold text-yellow-400">Warnings ({issues.filter((i: any) => i.severity === 'warning').length})</h3>
                          <span className="px-3 py-1 bg-yellow-400/20 border border-yellow-400/50 rounded-full text-xs text-yellow-400 font-semibold">MEDIUM PRIORITY</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {issues.filter((i: any) => i.severity === 'warning').slice(0, 9).map((issue: any, i: number) => (
                            <div key={i} className="bg-gradient-to-br from-yellow-500/10 via-yellow-900/5 to-black/50 p-5 rounded-xl border-2 border-yellow-400/30 shadow-lg hover:border-yellow-400/50 hover:shadow-xl transition-all group">
                              <div className="flex items-start gap-2 mb-3">
                                <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-1" />
                                <div className="flex-1">
                                  <h4 className="font-bold text-yellow-400 mb-1 text-sm group-hover:text-yellow-300 transition">{issue.title}</h4>
                                </div>
                              </div>
                              {issue.fix_suggestion && (
                                <div className="bg-black/70 p-3 rounded-lg border border-yellow-400/20 mb-2">
                                  <p className="text-xs text-[#C0C0C0] mb-2">{issue.fix_suggestion}</p>
                                  <button
                                    className="w-full px-3 py-1.5 rounded-lg bg-yellow-400/20 border border-yellow-400/30 text-yellow-400 font-semibold text-xs hover:bg-yellow-400/30 transition"
                                    onClick={async (e) => {
                                      const button = e.currentTarget;
                                      const originalText = button.textContent;
                                      const textToCopy = issue.fix_suggestion;
                                      
                                      if (navigator.clipboard && navigator.clipboard.writeText) {
                                        try {
                                          await navigator.clipboard.writeText(textToCopy);
                                          button.textContent = 'Copied!';
                                          setTimeout(() => {
                                            button.textContent = originalText;
                                          }, 2000);
                                          return;
                                        } catch (err) {
                                          console.log('Clipboard API failed, trying fallback');
                                        }
                                      }
                                      
                                      try {
                                        const textArea = document.createElement('textarea');
                                        textArea.value = textToCopy;
                                        textArea.style.position = 'fixed';
                                        textArea.style.left = '0';
                                        textArea.style.top = '0';
                                        textArea.style.width = '2em';
                                        textArea.style.height = '2em';
                                        textArea.style.opacity = '0';
                                        document.body.appendChild(textArea);
                                        textArea.select();
                                        const successful = document.execCommand('copy');
                                        document.body.removeChild(textArea);
                                        
                                        if (successful) {
                                          button.textContent = 'Copied!';
                                          setTimeout(() => {
                                            button.textContent = originalText;
                                          }, 2000);
                                        } else {
                                          throw new Error('execCommand failed');
                                        }
                                      } catch {
                                        const modal = document.createElement('div');
                                        modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1a1a1a;padding:20px;border:2px solid #fbbf24;border-radius:8px;z-index:10000;max-width:90%;';
                                        modal.innerHTML = `
                                          <h3 style="color:#fbbf24;margin-bottom:10px;">Copy this text:</h3>
                                          <textarea readonly style="width:100%;min-height:60px;padding:10px;background:#000;color:#fff;border:1px solid #fbbf24;border-radius:4px;" onclick="this.select()">${textToCopy}</textarea>
                                          <button onclick="this.parentElement.remove()" style="margin-top:10px;padding:8px 16px;background:#fbbf24;color:#000;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">Close</button>
                                        `;
                                        document.body.appendChild(modal);
                                        const textarea = modal.querySelector('textarea');
                                        if (textarea) {
                                          textarea.select();
                                          textarea.focus();
                                        }
                                      }
                                    }}
                                  >
                                    Copy Fix
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {issues.filter((i: any) => i.severity === 'info' || i.severity === 'good').length > 0 && (
                      <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                          <CheckCircle className="h-6 w-6 text-green-400" />
                          <h3 className="text-xl font-bold text-green-400">Optimization Opportunities ({issues.filter((i: any) => i.severity === 'info' || i.severity === 'good').length})</h3>
                          <span className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full text-xs text-green-400 font-semibold">LOW PRIORITY</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          {issues.filter((i: any) => i.severity === 'info' || i.severity === 'good').slice(0, 12).map((issue: any, i: number) => (
                            <div key={i} className="bg-gradient-to-br from-green-500/5 to-black/50 p-4 rounded-xl border border-green-400/20 shadow hover:border-green-400/40 transition-all">
                              <div className="flex items-start gap-2 mb-2">
                                <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0 mt-1" />
                                <h4 className="font-semibold text-green-400 text-xs">{issue.title}</h4>
                              </div>
                              {issue.fix_suggestion && (
                                <p className="text-xs text-[#C0C0C0] mb-2">{issue.fix_suggestion}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {issues.length > 0 && (
                      <div className="text-center mt-8">
                        <Button
                          className="bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 text-black font-bold px-8 py-3 rounded-xl shadow-lg hover:scale-105 transition"
                          onClick={() => {
                            const fixesSection = document.getElementById('fixes');
                            fixesSection?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          View All {issues.length} Issues & Recommendations
                        </Button>
                      </div>
                    )}
                  </section>

                  <section id="technical" className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-10 mb-12 rounded-3xl bg-gradient-to-br from-black/90 via-[#181818]/95 to-black/90 border-2 border-yellow-400/30 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-yellow-400/20 border border-yellow-400/30">
                          <Wrench className="h-7 w-7 text-yellow-400" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-extrabold hero-gradient-text">Technical SEO</h2>
                          <p className="text-[#C0C0C0] text-sm mt-1">Core Web Vitals & Performance Metrics</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-yellow-400">{auditData.technical_score || 0}/100</div>
                        <div className="text-sm text-[#C0C0C0]">Technical Score</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
                      <div className="bg-gradient-to-br from-black/80 to-[#181818]/80 p-6 rounded-2xl border-2 border-yellow-400/20 shadow-lg hover:border-yellow-400/40 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-[#FFD700]">LCP</span>
                          {auditData.technical?.lcp && auditData.technical.lcp > 0 ? (
                            auditData.technical.lcp < 2.5 ? (
                              <CheckCircle className="h-5 w-5 text-green-400" />
                            ) : auditData.technical.lcp < 4 ? (
                              <AlertTriangle className="h-5 w-5 text-yellow-400" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )
                          ) : null}
                        </div>
                        {auditData.technical?.lcp && auditData.technical.lcp > 0 ? (
                          <>
                            <AnimatedNumber value={auditData.technical.lcp} suffix="s" />
                            <div className="text-xs text-[#C0C0C0] mt-2">
                              {auditData.technical.lcp < 2.5 ? 'Good' : auditData.technical.lcp < 4 ? 'Needs Improvement' : 'Poor'}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-[#C0C0C0]">Not measured</div>
                        )}
                      </div>

                      <div className="bg-gradient-to-br from-black/80 to-[#181818]/80 p-6 rounded-2xl border-2 border-yellow-400/20 shadow-lg hover:border-yellow-400/40 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-[#FFD700]">FCP</span>
                          {auditData.technical?.fcp && auditData.technical.fcp > 0 ? (
                            auditData.technical.fcp < 1.8 ? (
                              <CheckCircle className="h-5 w-5 text-green-400" />
                            ) : auditData.technical.fcp < 3 ? (
                              <AlertTriangle className="h-5 w-5 text-yellow-400" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )
                          ) : null}
                        </div>
                        {auditData.technical?.fcp && auditData.technical.fcp > 0 ? (
                          <>
                            <AnimatedNumber value={auditData.technical.fcp} suffix="s" />
                            <div className="text-xs text-[#C0C0C0] mt-2">
                              {auditData.technical.fcp < 1.8 ? 'Good' : auditData.technical.fcp < 3 ? 'Needs Improvement' : 'Poor'}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-[#C0C0C0]">Not measured</div>
                        )}
                      </div>

                      <div className="bg-gradient-to-br from-black/80 to-[#181818]/80 p-6 rounded-2xl border-2 border-yellow-400/20 shadow-lg hover:border-yellow-400/40 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-[#FFD700]">TTI</span>
                          {auditData.technical?.tti && auditData.technical.tti > 0 ? (
                            auditData.technical.tti < 3.8 ? (
                              <CheckCircle className="h-5 w-5 text-green-400" />
                            ) : auditData.technical.tti < 7.3 ? (
                              <AlertTriangle className="h-5 w-5 text-yellow-400" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )
                          ) : null}
                        </div>
                        {auditData.technical?.tti && auditData.technical.tti > 0 ? (
                          <>
                            <AnimatedNumber value={auditData.technical.tti} suffix="s" />
                            <div className="text-xs text-[#C0C0C0] mt-2">
                              {auditData.technical.tti < 3.8 ? 'Good' : auditData.technical.tti < 7.3 ? 'Needs Improvement' : 'Poor'}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-[#C0C0C0]">Not measured</div>
                        )}
                      </div>

                      <div className="bg-gradient-to-br from-black/80 to-[#181818]/80 p-6 rounded-2xl border-2 border-yellow-400/20 shadow-lg hover:border-yellow-400/40 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-[#FFD700]">HTTPS</span>
                          {auditData.technical?.https ? (
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <div className="text-2xl font-bold">
                          {auditData.technical?.https ? (
                            <span className="text-green-400">Enabled</span>
                          ) : (
                            <span className="text-red-500">Disabled</span>
                          )}
                        </div>
                        <div className="text-xs text-[#C0C0C0] mt-2">SSL Certificate</div>
                      </div>

                      <div className="bg-gradient-to-br from-black/80 to-[#181818]/80 p-6 rounded-2xl border-2 border-yellow-400/20 shadow-lg hover:border-yellow-400/40 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-[#FFD700]">Mobile</span>
                          {auditData.technical?.mobile ? (
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <div className="text-2xl font-bold">
                          {auditData.technical?.mobile ? (
                            <span className="text-green-400">Optimized</span>
                          ) : (
                            <span className="text-red-500">Not Optimized</span>
                          )}
                        </div>
                        <div className="text-xs text-[#C0C0C0] mt-2">Responsive Design</div>
                      </div>
                    </div>

                    {(!auditData.technical?.lcp || auditData.technical.lcp === 0) && (
                      <div className="bg-gradient-to-r from-yellow-400/20 to-[#FFD700]/20 p-6 rounded-xl border-2 border-yellow-400/40 mb-6">
                        <div className="flex items-start gap-3">
                          <Sparkles className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1" />
                          <div>
                            <h3 className="font-bold text-yellow-400 mb-2">Enable Real Performance Metrics</h3>
                            <p className="text-sm text-[#C0C0C0] mb-3">
                              Add your Google PageSpeed Insights API key to see real performance metrics (LCP, FCP, TTI). 
                            </p>
                            <a href="/GOOGLE_PAGESPEED_SETUP.md" target="_blank" className="text-yellow-400 underline font-semibold text-sm hover:text-yellow-300">
                              View Setup Instructions →
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {vitalsHistory.length > 0 && auditData.technical?.lcp && (
                      <div className="bg-black/50 p-6 rounded-xl border border-yellow-400/20">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-[#FFD700]">Core Web Vitals Trend (Last 6 Months)</h3>
                          <span className="text-xs text-[#C0C0C0]">LCP Performance</span>
                        </div>
                        <VitalsTrendGraph history={vitalsHistory} metric="lcp" />
                      </div>
                    )}
                  </section>

                  <section id="onpage" className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-10 mb-12 rounded-3xl bg-gradient-to-br from-black/90 via-[#181818]/95 to-black/90 border-2 border-yellow-400/30 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-yellow-400/20 border border-yellow-400/30">
                          <FileText className="h-7 w-7 text-yellow-400" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-extrabold hero-gradient-text">On-Page SEO</h2>
                          <p className="text-[#C0C0C0] text-sm mt-1">Meta tags, headings, and content structure</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-yellow-400">{auditData.onpage_score || 0}/100</div>
                        <div className="text-sm text-[#C0C0C0]">On-Page Score</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-gradient-to-br from-black/80 to-[#181818]/80 p-6 rounded-2xl border-2 border-yellow-400/20 shadow-lg hover:border-yellow-400/40 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-[#FFD700]">Meta Title</span>
                          {auditData.onpage?.title?.optimal ? (
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-yellow-400" />
                          )}
                        </div>
                        <div className="text-2xl font-bold text-yellow-400 mb-1">{auditData.onpage?.title?.length || 0}</div>
                        <div className="text-xs text-[#C0C0C0]">characters {auditData.onpage?.title?.optimal ? '(Optimal)' : '(Needs optimization)'}</div>
                      </div>
                      <div className="bg-gradient-to-br from-black/80 to-[#181818]/80 p-6 rounded-2xl border-2 border-yellow-400/20 shadow-lg hover:border-yellow-400/40 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-[#FFD700]">Meta Description</span>
                          {auditData.onpage?.description?.missing ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ) : auditData.onpage?.description?.tooLong ? (
                            <AlertTriangle className="h-5 w-5 text-yellow-400" />
                          ) : (
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          )}
                        </div>
                        <div className="text-2xl font-bold text-yellow-400 mb-1">
                          {auditData.onpage?.description?.missing ? 'Missing' : auditData.onpage?.description?.tooLong ? 'Too Long' : 'Good'}
                        </div>
                        <div className="text-xs text-[#C0C0C0]">120-160 chars recommended</div>
                      </div>
                      <div className="bg-gradient-to-br from-black/80 to-[#181818]/80 p-6 rounded-2xl border-2 border-yellow-400/20 shadow-lg hover:border-yellow-400/40 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-[#FFD700]">Headings</span>
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="text-sm text-yellow-400 mb-1">
                          <div>H1: <span className="font-bold">{auditData.onpage?.h1 || 0}</span></div>
                          <div>H2: <span className="font-bold">{auditData.onpage?.h2 || 0}</span></div>
                          <div>H3: <span className="font-bold">{auditData.onpage?.h3 || 0}</span></div>
                        </div>
                        <div className="text-xs text-[#C0C0C0]">Hierarchy structure</div>
                      </div>
                      <div className="bg-gradient-to-br from-black/80 to-[#181818]/80 p-6 rounded-2xl border-2 border-yellow-400/20 shadow-lg hover:border-yellow-400/40 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-[#FFD700]">Images</span>
                          {auditData.onpage?.images?.missing === 0 ? (
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-yellow-400" />
                          )}
                        </div>
                        <div className="text-2xl font-bold text-yellow-400 mb-1">
                          {auditData.onpage?.images?.valid || 0} / {auditData.onpage?.images?.missing || 0}
                        </div>
                        <div className="text-xs text-[#C0C0C0]">valid / missing alt text</div>
                      </div>
                    </div>
                  </section>

                  <section id="content" className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-10 mb-12 rounded-3xl bg-gradient-to-br from-black/90 via-[#181818]/95 to-black/90 border-2 border-yellow-400/30 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-yellow-400/20 border border-yellow-400/30">
                          <MessageCircle className="h-7 w-7 text-yellow-400" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-extrabold hero-gradient-text">Content Optimization</h2>
                          <p className="text-[#C0C0C0] text-sm mt-1">Readability, keywords, and content quality</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-yellow-400">{auditData.content_score || 0}/100</div>
                        <div className="text-sm text-[#C0C0C0]">Content Score</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-gradient-to-br from-black/80 to-[#181818]/80 p-8 rounded-2xl border-2 border-yellow-400/20 shadow-lg hover:border-yellow-400/40 transition-all">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 rounded-lg bg-yellow-400/20">
                            <FileText className="h-5 w-5 text-yellow-400" />
                          </div>
                          <span className="font-semibold text-[#FFD700] text-lg">Readability Score</span>
                        </div>
                        <div className="text-4xl font-bold text-yellow-400 mb-2">{auditData.content?.readability || 0}/100</div>
                        <div className="text-sm text-[#C0C0C0]">
                          {auditData.content?.readability >= 70 ? 'Excellent readability' : 
                           auditData.content?.readability >= 50 ? 'Good readability' : 
                           'Needs improvement'}
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-black/80 to-[#181818]/80 p-8 rounded-2xl border-2 border-yellow-400/20 shadow-lg hover:border-yellow-400/40 transition-all">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 rounded-lg bg-yellow-400/20">
                            <FileText className="h-5 w-5 text-yellow-400" />
                          </div>
                          <span className="font-semibold text-[#FFD700] text-lg">Word Count</span>
                        </div>
                        <div className="text-4xl font-bold text-yellow-400 mb-2">{auditData.content?.word_count || 0}</div>
                        <div className="text-sm text-[#C0C0C0]">words on page</div>
                      </div>
                    </div>
                    
                    {auditData.content?.keyword_density && auditData.content.keyword_density.length > 0 && (
                      <div className="mb-8 bg-black/50 p-6 rounded-2xl border border-yellow-400/20">
                        <div className="flex items-center gap-2 mb-4">
                          <Search className="h-6 w-6 text-yellow-400" />
                          <h3 className="text-xl font-bold text-[#FFD700]">Top Keywords Found</h3>
                          <span className="px-3 py-1 bg-yellow-400/20 border border-yellow-400/30 rounded-full text-xs text-yellow-400 font-semibold">
                            {auditData.content.keyword_density.length} keywords
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {auditData.content.keyword_density.map((kw: any, idx: number) => (
                            <div 
                              key={idx}
                              className="px-5 py-3 rounded-xl bg-gradient-to-r from-yellow-400/20 via-yellow-500/20 to-yellow-400/20 border-2 border-yellow-400/30 hover:border-yellow-400/50 transition-all shadow-lg"
                            >
                              <span className="font-bold text-yellow-300 text-lg">{kw.term}</span>
                              <span className="text-[#C0C0C0] text-sm ml-2 font-semibold">{kw.pct}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {auditData.content?.suggestions && auditData.content.suggestions.length > 0 && (
                      <div className="bg-black/50 p-6 rounded-2xl border border-yellow-400/20">
                        <div className="flex items-center gap-2 mb-4">
                          <MessageCircle className="h-6 w-6 text-yellow-400" />
                          <h3 className="text-xl font-bold text-[#FFD700]">Content Suggestions</h3>
                          <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs text-blue-400 font-semibold">
                            {auditData.content.suggestions.length} suggestions
                          </span>
                        </div>
                        <ul className="space-y-3">
                          {auditData.content.suggestions.map((suggestion: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-3 bg-black/50 p-4 rounded-xl border border-yellow-400/10 hover:border-yellow-400/30 transition-all">
                              <ChevronRight className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                              <span className="text-[#C0C0C0] leading-relaxed">{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(!auditData.content?.keyword_density || auditData.content.keyword_density.length === 0) && 
                     (!auditData.content?.suggestions || auditData.content.suggestions.length === 0) && (
                      <div className="text-center py-12 bg-black/50 rounded-2xl border border-yellow-400/20">
                        <FileText className="h-12 w-12 text-[#C0C0C0] mx-auto mb-4 opacity-50" />
                        <p className="text-[#C0C0C0]">No keywords or suggestions found in content analysis.</p>
                      </div>
                    )}
                  </section>

                  {currentProject && (
                    <section className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-10 mb-12 rounded-3xl bg-gradient-to-br from-black/90 via-[#181818]/95 to-black/90 border-2 border-yellow-400/30 shadow-2xl backdrop-blur-xl">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-yellow-400/20 border border-yellow-400/30">
                            <Search className="h-6 w-6 text-yellow-400" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold hero-gradient-text">Tracked Keywords</h2>
                            <p className="text-sm text-[#C0C0C0] mt-1">Manage keywords for competitor analysis</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-yellow-400">{trackedKeywords.length}</div>
                          <div className="text-sm text-[#C0C0C0]">Keywords Tracked</div>
                        </div>
                      </div>
                      <div className="text-sm text-[#C0C0C0] mb-4">
                        {trackedKeywords.length} keywords tracked
                      </div>

                      <form onSubmit={handleAddKeyword} className="mb-6">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            type="text"
                            placeholder="Enter keyword to track (e.g. seo audit tool)"
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                            className="flex-1 bg-black/50 border-yellow-400/30 text-white placeholder:text-[#C0C0C0]"
                          />
                          <Button
                            type="submit"
                            disabled={addingKeyword || !newKeyword.trim()}
                            className="bg-yellow-400 text-black hover:bg-yellow-500 font-semibold"
                          >
                            {addingKeyword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                            Add Keyword
                          </Button>
                        </div>
                      </form>

                      {trackedKeywords.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {trackedKeywords.map((kw: any) => (
                            <div key={kw.id} className="bg-black/50 p-3 rounded-lg border border-yellow-400/20 flex items-center justify-between">
                              {editingKeyword === kw.id ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <Input
                                    type="text"
                                    value={editKeywordText}
                                    onChange={(e) => setEditKeywordText(e.target.value)}
                                    className="flex-1 bg-black/70 border-yellow-400/30 text-white text-sm"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveKeywordEdit(kw.id);
                                      if (e.key === 'Escape') setEditingKeyword(null);
                                    }}
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveKeywordEdit(kw.id)}
                                    className="bg-green-500 hover:bg-green-600 text-white h-8 px-2"
                                  >
                                    ✓
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => setEditingKeyword(null)}
                                    className="bg-gray-500 hover:bg-gray-600 text-white h-8 px-2"
                                  >
                                    ×
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-yellow-400 font-medium">{kw.keyword}</span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleEditKeyword(kw)}
                                      className="text-blue-400 hover:text-blue-300 p-1"
                                      title="Edit keyword"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteKeyword(kw.id)}
                                      className="text-red-400 hover:text-red-300 p-1"
                                      title="Delete keyword"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-[#C0C0C0]">
                          No keywords tracked yet. Add keywords to enable competitor overlap analysis.
                        </div>
                      )}
                    </section>
                  )}

                  <section id="competitors" className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-10 mb-12 rounded-3xl bg-gradient-to-br from-black/90 via-[#181818]/95 to-black/90 border-2 border-yellow-400/30 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <LucideLink className="h-6 w-6 text-yellow-400" />
                        <h2 className="text-xl font-bold hero-gradient-text">Competitor Analysis</h2>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-yellow-400">{(competitorData?.competitor_score ?? auditData.competitor_score) || 0}/100</div>
                        <div className="text-sm text-[#C0C0C0]">Competitor Score</div>
                      </div>
                    </div>
                    
                    {competitorData && competitorData.competitors && competitorData.competitors.length > 0 ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          {competitorData.competitors.map((comp: any, idx: number) => {
                            const normalizeDomain = (domain: string) => 
                              domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase();
                            const compDomainNormalized = normalizeDomain(comp.domain);
                            const competitorRecord = competitors.find((c: any) => {
                              const cDomainNormalized = normalizeDomain(c.domain);
                              return cDomainNormalized === compDomainNormalized;
                            });
                            
                            if (!competitorRecord && competitors.length > 0) {
                              console.log('Competitor record not found for:', comp.domain, 'Available:', competitors.map((c: any) => c.domain));
                            }
                            
                            return (
                              <div key={idx} className="bg-black/50 p-4 rounded-xl border border-yellow-400/20">
                                {editingCompetitor === competitorRecord?.id ? (
                                  <div className="space-y-2">
                                    <Input
                                      type="text"
                                      value={editCompetitorDomain}
                                      onChange={(e) => setEditCompetitorDomain(e.target.value)}
                                      className="bg-black/70 border-yellow-400/30 text-white text-sm mb-2"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveCompetitorEdit(competitorRecord.id);
                                        if (e.key === 'Escape') setEditingCompetitor(null);
                                      }}
                                      autoFocus
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => handleSaveCompetitorEdit(competitorRecord.id)}
                                        className="bg-green-500 hover:bg-green-600 text-white flex-1"
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => setEditingCompetitor(null)}
                                        className="bg-gray-500 hover:bg-gray-600 text-white flex-1"
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="font-bold text-yellow-400 text-sm">{comp.domain}</div>
                                      <div className="flex items-center gap-1">
                                        {competitorRecord ? (
                                          <>
                                            <button
                                              onClick={() => handleEditCompetitor(competitorRecord)}
                                              className="text-blue-400 hover:text-blue-300 p-1"
                                              title="Edit competitor"
                                            >
                                              <Edit2 className="h-3 w-3" />
                                            </button>
                                            <button
                                              onClick={() => handleRemoveCompetitor(competitorRecord.id)}
                                              className="text-red-400 hover:text-red-300 p-1"
                                              title="Delete competitor"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </button>
                                          </>
                                        ) : competitors.length > 0 ? (
                                          <>
                                            <button
                                              onClick={() => {
                                                const found = competitors.find((c: any) => {
                                                  const normalize = (d: string) => d.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase();
                                                  return normalize(c.domain) === normalize(comp.domain);
                                                });
                                                if (found) handleEditCompetitor(found);
                                              }}
                                              className="text-blue-400 hover:text-blue-300 p-1"
                                              title="Edit competitor"
                                            >
                                              <Edit2 className="h-3 w-3" />
                                            </button>
                                            <button
                                              onClick={() => {
                                                const found = competitors.find((c: any) => {
                                                  const normalize = (d: string) => d.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase();
                                                  return normalize(c.domain) === normalize(comp.domain);
                                                });
                                                if (found) handleRemoveCompetitor(found.id);
                                              }}
                                              className="text-red-400 hover:text-red-300 p-1"
                                              title="Delete competitor"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </button>
                                          </>
                                        ) : null}
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-lg font-bold text-white">{comp.overlap} Overlap</span>
                                      <span className="text-sm text-red-400">{comp.missing} Missing</span>
                                    </div>
                                    {comp.missingKeywords && comp.missingKeywords.length > 0 && (
                                      <div className="mt-2">
                                        <div className="text-xs text-yellow-400 mb-1">Quick wins:</div>
                                        <div className="text-xs text-[#C0C0C0]">
                                          {comp.missingKeywords.slice(0, 3).map((kw: string, i: number) => (
                                            <span key={i}>'{kw}'{i < 2 ? ', ' : ''}</span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        {currentProject && (
                          <div className="mt-4">
                            <form onSubmit={handleAddCompetitor} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                              <Input
                                type="text"
                                placeholder="Add another competitor..."
                                value={newCompetitorDomain}
                                onChange={(e) => setNewCompetitorDomain(e.target.value)}
                                className="flex-1 bg-black/50 border-yellow-400/30 text-white placeholder:text-[#C0C0C0]"
                              />
                              <Button
                                type="submit"
                                disabled={addingCompetitor || !newCompetitorDomain.trim()}
                                className="bg-yellow-400 text-black hover:bg-yellow-500 font-semibold"
                              >
                                {addingCompetitor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                              </Button>
                            </form>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <div className="bg-black/50 p-6 rounded-xl border border-yellow-400/20">
                          <p className="text-[#C0C0C0] mb-4">
                            Competitor analysis helps you understand how your site compares to competitors in search rankings.
                          </p>
                          
                          {currentProject && (
                            <form onSubmit={handleAddCompetitor} className="mt-4">
                              <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                                <Input
                                  type="text"
                                  placeholder="Enter competitor domain (e.g. competitor.com)"
                                  value={newCompetitorDomain}
                                  onChange={(e) => setNewCompetitorDomain(e.target.value)}
                                  className="flex-1 bg-black/50 border-yellow-400/30 text-white placeholder:text-[#C0C0C0]"
                                />
                                <Button
                                  type="submit"
                                  disabled={addingCompetitor || !newCompetitorDomain.trim()}
                                  className="bg-yellow-400 text-black hover:bg-yellow-500 font-semibold"
                                >
                                  {addingCompetitor ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Competitor'}
                                </Button>
                              </div>
                            </form>
                          )}
                          
                          {competitors.length > 0 && (
                            <div className="mt-6">
                              <div className="text-sm text-[#C0C0C0] mb-2">Current Competitors:</div>
                              <div className="flex flex-wrap gap-2 justify-center">
                                {competitors.map((comp: any) => (
                                  <div key={comp.id} className="flex items-center gap-2 bg-black/70 px-3 py-1 rounded-lg border border-yellow-400/20">
                                    {editingCompetitor === comp.id ? (
                                      <div className="flex items-center gap-1">
                                        <Input
                                          type="text"
                                          value={editCompetitorDomain}
                                          onChange={(e) => setEditCompetitorDomain(e.target.value)}
                                          className="w-32 bg-black/90 border-yellow-400/30 text-white text-xs h-6"
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveCompetitorEdit(comp.id);
                                            if (e.key === 'Escape') setEditingCompetitor(null);
                                          }}
                                          autoFocus
                                        />
                                        <button
                                          onClick={() => handleSaveCompetitorEdit(comp.id)}
                                          className="text-green-400 hover:text-green-300 text-xs"
                                        >
                                          ✓
                                        </button>
                                        <button
                                          onClick={() => setEditingCompetitor(null)}
                                          className="text-gray-400 hover:text-gray-300 text-xs"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ) : (
                                      <>
                                        <span className="text-yellow-400 text-sm">{comp.domain}</span>
                                        <button
                                          onClick={() => handleEditCompetitor(comp)}
                                          className="text-blue-400 hover:text-blue-300 text-xs"
                                          title="Edit"
                                        >
                                          <Edit2 className="h-3 w-3" />
                                        </button>
                                        <button
                                          onClick={() => handleRemoveCompetitor(comp.id)}
                                          className="text-red-400 hover:text-red-300 text-xs"
                                          title="Delete"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </section>

                  {competitorData && competitorData.competitors && competitorData.competitors.length > 0 && (
                    <section className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-10 mb-12 rounded-3xl bg-gradient-to-br from-black/90 via-[#181818]/95 to-black/90 border-2 border-yellow-400/30 shadow-2xl backdrop-blur-xl">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-xl bg-yellow-400/20 border border-yellow-400/30">
                          <Award className="h-6 w-6 text-yellow-400" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold hero-gradient-text">My Site vs Competitor</h2>
                          <p className="text-sm text-[#C0C0C0] mt-1">Visual comparison of SEO metrics</p>
                        </div>
                      </div>
                      <div className="flex justify-center mb-4">
                        <RadarChart 
                          mySite={{
                            technical_score: auditData.technical_score || 0,
                            onpage_score: auditData.onpage_score || 0,
                            content_score: auditData.content_score || 0,
                            competitor_score: (competitorData?.competitor_score ?? auditData.competitor_score) || 0,
                          }}
                          competitor={competitorData.competitors[0] ? {
                            technical_score: 75,
                            onpage_score: 80,
                            content_score: 70,
                            competitor_score: competitorData.competitor_score || 65,
                          } : null}
                        />
                      </div>
                      <div className="flex justify-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-yellow-400/30 border border-yellow-400"></div>
                          <span className="text-[#C0C0C0]">My Site</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-[#C0C0C0]/30 border border-[#C0C0C0]"></div>
                          <span className="text-[#C0C0C0]">Competitor</span>
                        </div>
                      </div>
                    </section>
                  )}

                  {currentProject && (
                    <section id="backlinks" className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-10 mb-12 rounded-3xl bg-gradient-to-br from-black/90 via-[#181818]/95 to-black/90 border-2 border-yellow-400/30 shadow-2xl backdrop-blur-xl">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-yellow-400/20 border border-yellow-400/30">
                            <LucideLink className="h-6 w-6 text-yellow-400" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold hero-gradient-text">Backlink Analysis</h2>
                            <p className="text-sm text-[#C0C0C0] mt-1">Domain authority and link profile</p>
                          </div>
                        </div>
                        {backlinkData && (backlinkData.total_count > 0 || backlinkData.domain_count > 0) && (
                          <div className="text-right">
                            <div className="text-2xl font-bold text-yellow-400">{backlinkData.total_count?.toLocaleString() || 0}</div>
                            <div className="text-sm text-[#C0C0C0]">Total Backlinks</div>
                          </div>
                        )}
                      </div>
                      
                      {backlinkData && (backlinkData.total_count > 0 || backlinkData.domain_count > 0) ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                          <div className="text-center bg-black/50 p-4 rounded-xl border border-yellow-400/20">
                            <div className="font-medium text-[#FFD700] mb-2">Total Backlinks</div>
                            <div className="text-3xl font-bold text-yellow-400">{backlinkData.total_count?.toLocaleString() || 0}</div>
                            <div className="text-xs text-[#C0C0C0] mt-1">
                              {backlinkData.last_checked 
                                ? `Last checked: ${new Date(backlinkData.last_checked).toLocaleDateString()}`
                                : 'Not checked yet'}
                            </div>
                          </div>
                          <div className="text-center bg-black/50 p-4 rounded-xl border border-yellow-400/20">
                            <div className="font-medium text-[#FFD700] mb-2">Referring Domains</div>
                            <div className="text-3xl font-bold text-yellow-400">{backlinkData.domain_count?.toLocaleString() || 0}</div>
                            <div className="text-xs text-[#C0C0C0] mt-1">Unique domains linking</div>
                          </div>
                          <div className="text-center bg-black/50 p-4 rounded-xl border border-yellow-400/20">
                            <div className="font-medium text-[#FFD700] mb-2">Domain Authority</div>
                            <div className="text-3xl font-bold text-yellow-400">
                              {backlinkData.domain_count > 0 
                                ? Math.min(100, Math.round((backlinkData.domain_count / 10) * 10))
                                : 0}
                            </div>
                            <div className="text-xs text-[#C0C0C0] mt-1">Estimated score</div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-black/50 rounded-xl border border-yellow-400/20">
                          <p className="text-[#C0C0C0] mb-2">
                            {backlinkData === null 
                              ? 'Backlink data will be collected during your next audit.'
                              : 'No backlink data found. This domain may not be in the OpenLinkProfiler database.'}
                          </p>
                          <p className="text-xs text-yellow-400/70 mt-2">
                            Note: Backlink data depends on availability in OpenLinkProfiler database. Some domains may not have data available.
                          </p>
                          {audit && (
                            <button
                              onClick={() => currentProject && loadBacklinks(currentProject.id)}
                              className="mt-4 px-4 py-2 bg-yellow-400/20 border border-yellow-400/30 text-yellow-400 rounded-lg hover:bg-yellow-400/30 transition text-sm"
                            >
                              Refresh Backlinks
                            </button>
                          )}
                        </div>
                      )}

                      {backlinkHistory.length > 0 && (
                        <div className="mt-6">
                          <div className="font-medium text-[#FFD700] mb-3">Backlink History (Last 30 days)</div>
                          <div className="space-y-2">
                            {backlinkHistory.slice(0, 10).map((entry: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between bg-black/50 p-3 rounded-lg border border-yellow-400/20">
                                <div className="text-sm text-[#C0C0C0]">
                                  {new Date(entry.date).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-sm">
                                    <span className="text-yellow-400 font-semibold">{entry.total_count?.toLocaleString() || 0}</span>
                                    <span className="text-[#C0C0C0] ml-1">backlinks</span>
                                  </div>
                                  {entry.gained > 0 && (
                                    <div className="text-sm text-green-400">
                                      +{entry.gained} gained
                                    </div>
                                  )}
                                  {entry.lost > 0 && (
                                    <div className="text-sm text-red-400">
                                      -{entry.lost} lost
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </section>
                  )}

                  <section id="fixes" className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-10 mb-12 rounded-3xl bg-gradient-to-br from-black/90 via-[#181818]/95 to-black/90 border-2 border-yellow-400/30 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-yellow-400/20 border border-yellow-400/30">
                          <Award className="h-7 w-7 text-yellow-400" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-extrabold hero-gradient-text">Complete Fix List</h2>
                          <p className="text-[#C0C0C0] text-sm mt-1">All {issues.length} issues with actionable solutions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-yellow-400">{issues.length}</div>
                        <div className="text-sm text-[#C0C0C0]">Total Issues</div>
                      </div>
                    </div>

                    {issues.length > 0 ? (
                      <div className="space-y-4">
                        {issues.map((issue: any, i: number) => {
                          const severityColors = {
                            critical: { bg: 'from-red-500/10 via-red-900/5', border: 'border-red-500/40', text: 'text-red-400', icon: 'text-red-500' },
                            warning: { bg: 'from-yellow-500/10 via-yellow-900/5', border: 'border-yellow-400/40', text: 'text-yellow-400', icon: 'text-yellow-400' },
                            info: { bg: 'from-blue-500/10 via-blue-900/5', border: 'border-blue-400/40', text: 'text-blue-400', icon: 'text-blue-400' },
                            good: { bg: 'from-green-500/10 via-green-900/5', border: 'border-green-400/40', text: 'text-green-400', icon: 'text-green-400' },
                          };
                          const colors = severityColors[issue.severity as keyof typeof severityColors] || severityColors.warning;
                          
                          return (
                            <div key={i} className={`bg-gradient-to-br ${colors.bg} to-black/50 p-6 rounded-2xl border-2 ${colors.border} shadow-lg hover:shadow-xl transition-all group`}>
                              <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                  {issue.severity === "critical" && <XCircle className={`h-6 w-6 ${colors.icon}`} />}
                                  {issue.severity === "warning" && <AlertTriangle className={`h-6 w-6 ${colors.icon}`} />}
                                  {issue.severity === "info" && <CheckCircle className={`h-6 w-6 ${colors.icon}`} />}
                                  {issue.severity === "good" && <CheckCircle className={`h-6 w-6 ${colors.icon}`} />}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className={`text-lg font-bold ${colors.text} group-hover:opacity-80 transition`}>
                                      {issue.title}
                                    </h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                      issue.severity === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
                                      issue.severity === 'warning' ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50' :
                                      issue.severity === 'info' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' :
                                      'bg-green-500/20 text-green-400 border border-green-500/50'
                                    }`}>
                                      {issue.severity?.toUpperCase() || 'INFO'}
                                    </span>
                                  </div>
                                  {issue.description && (
                                    <p className="text-sm text-[#C0C0C0] mb-3 ml-9">{issue.description}</p>
                                  )}
                                  {issue.fix_suggestion && (
                                    <div className="ml-9 bg-black/70 p-4 rounded-xl border-2 border-yellow-400/30 shadow-[0_0_16px_#FFD70033] flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Sparkles className="h-4 w-4 text-yellow-400" />
                                          <span className="text-sm font-semibold text-yellow-400">Recommended Solution:</span>
                                        </div>
                                        <p className="text-sm text-[#C0C0C0] leading-relaxed">{issue.fix_suggestion}</p>
                                      </div>
                                      <button
                                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 text-black font-bold shadow-lg hover:scale-105 hover:shadow-xl active:scale-95 transition text-sm whitespace-nowrap"
                                        onClick={async (e) => {
                                          const button = e.currentTarget;
                                          const originalText = button.textContent;
                                          const textToCopy = issue.fix_suggestion;
                                          
                                          if (navigator.clipboard && navigator.clipboard.writeText) {
                                            try {
                                              await navigator.clipboard.writeText(textToCopy);
                                              button.textContent = 'Copied!';
                                              button.classList.add('bg-green-500', 'from-green-400', 'to-green-500');
                                              setTimeout(() => {
                                                button.textContent = originalText;
                                                button.classList.remove('bg-green-500', 'from-green-400', 'to-green-500');
                                              }, 2000);
                                              return;
                                            } catch (err) {
                                              console.log('Clipboard API failed, trying fallback');
                                            }
                                          }
                                          
                                          try {
                                            const textArea = document.createElement('textarea');
                                            textArea.value = textToCopy;
                                            textArea.style.position = 'fixed';
                                            textArea.style.left = '0';
                                            textArea.style.top = '0';
                                            textArea.style.width = '2em';
                                            textArea.style.height = '2em';
                                            textArea.style.opacity = '0';
                                            document.body.appendChild(textArea);
                                            textArea.select();
                                            const successful = document.execCommand('copy');
                                            document.body.removeChild(textArea);
                                            
                                            if (successful) {
                                              button.textContent = 'Copied!';
                                              button.classList.add('bg-green-500', 'from-green-400', 'to-green-500');
                                              setTimeout(() => {
                                                button.textContent = originalText;
                                                button.classList.remove('bg-green-500', 'from-green-400', 'to-green-500');
                                              }, 2000);
                                            } else {
                                              throw new Error('execCommand failed');
                                            }
                                          } catch {
                                            const modal = document.createElement('div');
                                            modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1a1a1a;padding:20px;border:2px solid #fbbf24;border-radius:8px;z-index:10000;max-width:90%;';
                                            modal.innerHTML = `
                                              <h3 style="color:#fbbf24;margin-bottom:10px;">Copy this text:</h3>
                                              <textarea readonly style="width:100%;min-height:60px;padding:10px;background:#000;color:#fff;border:1px solid #fbbf24;border-radius:4px;font-family:monospace;" onclick="this.select()">${textToCopy}</textarea>
                                              <button onclick="this.parentElement.remove()" style="margin-top:10px;padding:8px 16px;background:#fbbf24;color:#000;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">Close</button>
                                            `;
                                            document.body.appendChild(modal);
                                            const textarea = modal.querySelector('textarea');
                                            if (textarea) {
                                              textarea.select();
                                              textarea.focus();
                                            }
                                          }
                                        }}
                                      >
                                        Copy Fix
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-16 bg-black/50 rounded-2xl border-2 border-green-400/30">
                        <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-6 animate-pulse" />
                        <p className="text-2xl font-bold text-green-400 mb-3">Perfect! No Issues Found</p>
                        <p className="text-[#C0C0C0] mb-6">Your site is performing exceptionally well. Keep up the great work!</p>
                        <div className="flex justify-center gap-4">
                          <Button
                            className="bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 text-black font-bold px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition"
                            onClick={() => setShowLeadModal(true)}
                          >
                            <Download className="h-5 w-5 mr-2" /> Download Full Report
                          </Button>
                        </div>
                      </div>
                    )}
                  </section>

                  <section className="w-full max-w-7xl mx-auto px-6 md:px-8 lg:px-10 py-12 flex flex-col md:flex-row items-center gap-10 justify-between rounded-3xl bg-gradient-to-br from-black/90 via-[#181818]/95 to-black/90 border-2 border-yellow-400/50 shadow-2xl backdrop-blur-lg">
                    <div className="flex-1 text-center md:text-left">
                      <div className="text-lg font-bold hero-gradient-text mb-2">Let us fix these issues for you — our Task Force executes what others only report.</div>
                      <div className="flex flex-col sm:flex-row gap-4 mt-4">
                        <Button
                          className="bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 text-black font-bold px-8 py-4 rounded-xl shadow-lg text-lg hover:bg-yellow-500 transition flex items-center gap-2"
                          onClick={() => setShowLeadModal(true)}
                        >
                          <Download className="h-5 w-5" /> Download PDF Report
                        </Button>
                        <Button className="bg-gradient-to-r from-[#C0C0C0] via-[#FFD700] to-yellow-400 text-black font-bold px-8 py-4 rounded-xl shadow-lg text-lg hover:bg-yellow-500 transition flex items-center gap-2" asChild>
                          <a href="https://calendly.com/khamareclarke/new-meeting" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                            <Shield className="h-5 w-5" /> Book Consultation with SEO Task Force
                          </a>
                        </Button>
                      </div>
                    </div>
                  </section>
                </>
              )}
            </>
          )}
        </main>

        {showLeadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#181818] border-2 border-yellow-400/40 rounded-2xl p-8 w-full max-w-sm shadow-2xl flex flex-col items-center">
              <h3 className="text-xl font-bold hero-gradient-text mb-2">Download PDF Report</h3>
              <p className="text-[#FFD700] text-sm mb-4">Enter your details to receive the full report.</p>
              <form className="w-full flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); handleDownloadPDF(); }}>
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

        {showBookModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#181818] border-2 border-yellow-400/40 rounded-2xl p-8 w-full max-w-sm shadow-2xl flex flex-col items-center">
              <h3 className="text-xl font-bold hero-gradient-text mb-2">Book Free Strategy Call</h3>
              <p className="text-[#FFD700] text-sm mb-4">Pick a time with our SEO Task Force.</p>
              <a href="https://calendly.com/khamareclarke/new-meeting" target="_blank" rel="noopener noreferrer" className="w-full bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 text-black font-bold py-3 rounded-lg shadow hover:bg-yellow-500 transition text-center mb-4">Open Calendar</a>
              <button className="w-full bg-[#232323] border border-yellow-400/30 text-[#FFD700] font-bold py-3 rounded-lg hover:bg-yellow-900/30 transition" onClick={() => setShowBookModal(false)}>Cancel</button>
            </div>
          </div>
        )}

        <PricingModal
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
          onSubscribe={handleSubscribe}
        />
      </div>
    </div>
  );
}