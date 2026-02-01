// AUTHORITY SYSTEM ENFORCEMENT - COMPLETE PAGE REFACTOR
// All sections inherit from hero design system
// Single source of truth: hero section

'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowRight, Globe, Shield, Award, Star, Trophy, Sparkles, Activity, Rocket, Wrench, FileText, Mail, Phone, Facebook, Twitter, Instagram, Linkedin, Github, Rss, Send, X } from 'lucide-react';
import { Link as LucideLink } from 'lucide-react';
import NextLink from 'next/link';
import Script from 'next/script';

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, type: 'assistant', content: 'Hi! Need a free SEO audit or help planning your rankings?', timestamp: new Date() }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showDataForm, setShowDataForm] = useState(false);
  const [formType, setFormType] = useState(null);
  const [userData, setUserData] = useState({ name: '', email: '', phone: '', domain: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const chatEndRef = useRef(null);

  const testimonials = [
    { quote: 'Our traffic grew 212% in 6 months thanks to SEOInForce.', name: 'Jane Smith', company: 'TechCorp', face: '/client1-Photoroom.png', logo: '/client1-Photoroom.png' },
    { quote: 'The competitor insights gave us an instant edge.', name: 'David Jones', company: 'MarketLeaders', face: '/identi-logo.png', logo: '/identi-logo.png' },
    { quote: 'Best ROI we\'ve ever had in SEO — better than SEMrush or Ahrefs.', name: 'Lucy Patel', company: 'AgencyPro', face: '/6.svg', logo: '/6.svg' },
  ];
  
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [pricingTab, setPricingTab] = useState('saas');
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditUrl, setAuditUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setTestimonialIndex((i) => (i + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(id);
  }, [testimonials.length]);

  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    const newMessage = { id: Date.now(), type: 'user', content: userInput, timestamp: new Date() };
    setChatMessages(prev => [...prev, newMessage]);
    setUserInput('');
    setIsTyping(true);
    setTimeout(() => {
      const response = { id: Date.now() + 1, type: 'assistant', content: 'I can help with that. Would you like to run a free audit or book a consultation?', timestamp: new Date() };
      setChatMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isTyping) handleSendMessage();
  };

  const handleInputChange = (field: string, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleFormSubmit = () => {
    const errors: Record<string, string> = {};
    if (!userData.name.trim()) errors.name = 'Name is required';
    if (!userData.email.trim()) errors.email = 'Email is required';
    if (!userData.phone.trim()) errors.phone = 'Phone is required';
    if (formType === 'audit' && !userData.domain.trim()) errors.domain = 'Domain is required';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setShowDataForm(false);
    const successMessage = {
      id: Date.now(),
      type: 'assistant',
      content: formType === 'audit' 
        ? 'Perfect! Your free SEO audit is being generated. Check your email in 2 minutes.'
        : 'Great! Here\'s your booking link: https://calendly.com/khamareclarke/new-meeting',
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, successMessage]);
    setUserData({ name: '', email: '', phone: '', domain: '' });
    setFormType(null);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const handleAnalyzeWebsite = async () => {
    if (!auditUrl.trim()) {
      return;
    }

    setIsAnalyzing(true);
    setAuditResult(null);

    try {
      const response = await fetch('/api/audit/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: auditUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze website');
      }

      const data = await response.json();
      console.log('Audit response:', data);
      
      // Ensure we have the scores
      if (data.success && data.overall_score !== undefined) {
        setAuditResult(data);
      } else {
        throw new Error('Invalid audit response format');
      }
      setIsAnalyzing(false);
    } catch (error: any) {
      console.error('Audit error:', error);
      alert(error.message || 'Failed to analyze website. Please try again.');
      setIsAnalyzing(false);
    }
  };

  const handleDownloadReport = () => {
    // Redirect to sign-in page instead of downloading
    window.location.href = '/sign-in';
  };

  return (
    <div className="min-h-screen bg-black">
      {/* NAVIGATION - HERO SYSTEM */}
      <nav className="sticky top-0 z-50 bg-gradient-to-b from-black via-[#0a0a0a] to-[#111]/80 backdrop-blur-xl border-b border-yellow-400/10 shadow-2xl py-4">
        <div className="max-w-[1400px] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="flex items-center justify-between" style={{ minHeight: '48px' }}>
            <div className="flex items-center gap-4 sm:gap-5 md:gap-6">
              <span className="inline-flex items-center justify-center h-12 sm:h-14 md:h-16 w-12 sm:w-14 md:w-16 rounded-full ring-[3px] ring-yellow-400/80 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 overflow-hidden shadow-[0_0_15px_rgba(250,204,21,0.5)] transition-all duration-300 hover:shadow-[0_0_25px_rgba(250,204,21,0.6)] hover:scale-105">
                <img src="/logo.svg" alt="SEOInForce shield logo" className="h-10 sm:h-12 md:h-14 w-10 sm:w-12 md:w-14 rounded-full object-cover" />
              </span>
              <span className="hero-gradient-text font-extrabold text-lg sm:text-xl md:text-2xl tracking-tight drop-shadow-[0_2px_10px_rgba(250,204,21,0.3)] transition-all duration-300 hover:drop-shadow-[0_2px_15px_rgba(250,204,21,0.4)]">SEO in Force</span>
            </div>
            <ul className="hidden md:flex items-center gap-4 lg:gap-6 font-medium text-sm tracking-wide">
              <li><a href="/products" className="px-4 py-2 text-[#C0C0C0] hover:text-yellow-300 transition-all duration-300 relative group focus:outline-none hover:drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]"><span className="absolute left-0 -bottom-0.5 w-full h-0.5 bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />Products</a></li>
              <li><a href="/features" className="px-4 py-2 text-[#C0C0C0] hover:text-yellow-300 transition-all duration-300 relative group focus:outline-none hover:drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]"><span className="absolute left-0 -bottom-0.5 w-full h-0.5 bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />Features</a></li>
              <li><a href="/pricing" className="px-4 py-2 text-[#C0C0C0] hover:text-yellow-300 transition-all duration-300 relative group focus:outline-none hover:drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]"><span className="absolute left-0 -bottom-0.5 w-full h-0.5 bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />Pricing</a></li>
              <li><a href="/blog" className="px-4 py-2 text-[#C0C0C0] hover:text-yellow-300 transition-all duration-300 relative group focus:outline-none hover:drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]"><span className="absolute left-0 -bottom-0.5 w-full h-0.5 bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />Blog</a></li>
              <li><a href="/faq" className="px-4 py-2 text-[#C0C0C0] hover:text-yellow-300 transition-all duration-300 relative group focus:outline-none hover:drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]"><span className="absolute left-0 -bottom-0.5 w-full h-0.5 bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />FAQ</a></li>
              <li><a href="/support" className="px-4 py-2 text-[#C0C0C0] hover:text-yellow-300 transition-all duration-300 relative group focus:outline-none hover:drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]"><span className="absolute left-0 -bottom-0.5 w-full h-0.5 bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />Support</a></li>
              <li>
                <a href="/sign-in" className="ml-8 px-6 py-2.5 rounded-lg font-bold bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-black hover:shadow-[0_8px_25px_-5px_rgba(250,204,21,0.5)] hover:scale-105 shadow-[0_8px_20px_-6px_rgba(250,204,21,0.3)] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/60 focus:ring-offset-2 focus:ring-offset-black border border-yellow-400/50">
                  Sign In
                </a>
              </li>
            </ul>
            <div className="md:hidden flex items-center">
              <button aria-label="Open main menu" className="text-yellow-400 hover:text-yellow-300 focus:outline-none p-2 rounded-lg transition" onClick={() => setMobileOpen((open) => !open)}>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            </div>
          </div>
          {mobileOpen && (
            <div className="md:hidden mt-4 py-4 border-t border-yellow-400/20 space-y-2">
              <a href="#" className="block py-2 px-3 text-[#C0C0C0] hover:text-yellow-400 transition">Products</a>
              <a href="#" className="block py-2 px-3 text-[#C0C0C0] hover:text-yellow-400 transition">Features</a>
              <a href="#" className="block py-2 px-3 text-[#C0C0C0] hover:text-yellow-400 transition">Pricing</a>
              <a href="#" className="block py-2 px-3 text-[#C0C0C0] hover:text-yellow-400 transition">Blog</a>
              <a href="#" className="block py-2 px-3 text-[#C0C0C0] hover:text-yellow-400 transition">Support</a>
              <a href="#faq" className="block py-2 px-3 text-[#C0C0C0] hover:text-yellow-400 transition">FAQ</a>
              <a href="#" className="block py-2 px-3 text-yellow-400 font-bold bg-yellow-500/10 rounded transition">Sign In</a>
            </div>
          )}
        </div>
      </nav>

      {/* HERO SECTION - SOURCE OF TRUTH */}
      <section className="relative overflow-hidden min-h-[700px] flex flex-col justify-center bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.1)_0%,transparent_70%)] animate-pulse-slow before:absolute before:inset-0 before:bg-[url('/noise.svg')] before:opacity-20 before:mix-blend-soft-light before:pointer-events-none">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-yellow-400/50 animate-particle-1"></div>
          <div className="absolute top-3/4 left-2/3 w-2 h-2 rounded-full bg-yellow-400/50 animate-particle-2"></div>
          <div className="absolute top-1/2 right-1/4 w-2 h-2 rounded-full bg-yellow-400/50 animate-particle-3"></div>
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#000_0%,rgba(0,0,0,0.8)_50%,#000_100%)] opacity-90 after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.15)_0%,transparent_50%)] after:animate-pulse-slow"></div>
        <div className="absolute w-full h-full bg-[url('/grid.svg')] opacity-20 animate-float-slow"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black via-transparent to-black opacity-60"></div>
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-3xl animate-pulse bg-gradient-to-br from-yellow-400/20 via-[#C0C0C0]/15 to-[#1a1a1a]/10" />
        <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full blur-3xl animate-pulse animation-delay-1000 bg-gradient-to-br from-yellow-500/15 via-[#C0C0C0]/12 to-[#0b0b0b]/10" />
        <div className="absolute left-1/4 top-1/4 w-48 h-48 rounded-full blur-3xl animate-float-slow bg-gradient-to-br from-yellow-400/20 via-yellow-500/10 to-transparent" />
        <div className="absolute right-1/4 bottom-1/4 w-48 h-48 rounded-full blur-3xl animate-float-slow animation-delay-2000 bg-gradient-to-br from-yellow-400/15 via-yellow-500/10 to-transparent" />

        <div className="max-w-[1400px] mx-auto px-8 sm:px-12 lg:px-16 pt-8 pb-20 relative z-10">
          <div className="text-center mb-20">
            <div className="flex flex-col items-center gap-2 mb-4">
              <span className="inline-flex items-center px-6 py-2.5 rounded-full bg-gradient-to-r from-yellow-400/20 via-yellow-500/20 to-yellow-400/20 text-yellow-400 font-semibold text-sm tracking-wide shadow-[0_4px_20px_-3px_rgba(250,204,21,0.2)] backdrop-blur-sm animate-fade-in border border-yellow-400/20 hover:border-yellow-400/30 hover:shadow-[0_4px_25px_-3px_rgba(250,204,21,0.25)] transition-all duration-300">
                <Globe className="inline-block w-4 h-4 mr-2" aria-label="Globe icon - Trusted by 10,000+ websites" /> Trusted by 10,000+ websites
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-8 tracking-tight hero-gradient-text drop-shadow-[0_2px_30px_rgba(250,204,21,0.4)] text-center leading-[1.1] animate-fade-in-up">
              <span className="text-white animate-shimmer-slow">
              Dominate Search</span> <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 animate-text-glow">Command Authority.</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-[#C0C0C0] mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up delay-200 text-center drop-shadow-lg font-medium">
              <span className="font-semibold">SEO Audit Tool UK</span> – AI-powered audits, <span className="font-semibold">Competitor Analysis Software</span>, <span className="font-semibold">White-Label SEO Reports for Agencies</span>, and <span className="font-semibold">Done-for-You SEO Services</span> trusted by 10,000+ businesses.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-8 animate-fade-in">
              <Button
                onClick={() => setShowAuditModal(true)}
                className="group relative overflow-hidden bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-black px-12 py-6 text-lg font-extrabold rounded-2xl shadow-[0_15px_40px_-10px_rgba(250,204,21,0.4)] hover:shadow-[0_20px_50px_-12px_rgba(250,204,21,0.6)] hover:scale-[1.03] hover:-translate-y-1 transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/60 focus-visible:ring-offset-4 focus-visible:ring-offset-black border-2 border-yellow-400/50"
              >
                <span className="relative z-10 font-extrabold tracking-wide text-xl">Analyze My Website</span>
                <ArrowRight className="h-7 w-7 relative z-10 ml-2 group-hover:translate-x-1 transition-transform duration-500" />
                <span className="absolute inset-0 bg-gradient-to-br from-yellow-200 via-yellow-300 to-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
              </Button>
              <Button className="group relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 text-white border-2 border-yellow-400/60 px-12 py-6 text-lg font-extrabold rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] hover:shadow-[0_25px_80px_-15px_rgba(250,204,21,0.4)] hover:scale-[1.03] hover:-translate-y-1 backdrop-blur-sm transition-all duration-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400/60 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-900" asChild>
                <a href="https://calendly.com/khamareclarke/new-meeting" target="_blank" rel="noopener noreferrer" className="relative z-10">
                  <span className="font-extrabold tracking-wide text-xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 bg-clip-text text-transparent group-hover:from-yellow-200 group-hover:via-yellow-300 group-hover:to-yellow-200 transition-all duration-500">Book Consultation</span>
                  <span className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                </a>
              </Button>
            </div>
            <div className="flex flex-col items-center mt-8 mb-0 animate-fade-in">
              <div className="flex items-center gap-3 mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} aria-label="star" className="h-8 w-8 text-yellow-400 drop-shadow-[0_2px_8px_rgba(250,204,21,0.4)] transition-all duration-300 hover:drop-shadow-[0_2px_12px_rgba(250,204,21,0.5)] hover:scale-110 animate-pulse-star" fill="currentColor" viewBox="0 0 20 20"><path d="M10 15.27L16.18 18l-1.64-7.03L19 7.24l-7.19-.61L10 0 8.19 6.63 1 7.24l5.46 3.73L4.82 18z"/></svg>
                ))}
              </div>
              <span className="text-xl text-white font-bold tracking-wide mb-6 drop-shadow-[0_2px_10px_rgba(250,204,21,0.3)] transition-all duration-300 hover:drop-shadow-[0_2px_15px_rgba(250,204,21,0.4)]">Rated <span className="text-[#FFD700]">5/5</span> by <span className="text-[#FFD700]">10,000+</span> businesses</span>
              <div className="w-full flex justify-center">
                <div className="flex items-center justify-center gap-12 sm:gap-16 md:gap-20 lg:gap-24 px-6 sm:px-8 md:px-10 py-8 sm:py-10 md:py-12 flex-wrap bg-gradient-to-b from-black/50 via-black/30 to-transparent rounded-3xl backdrop-blur-sm border border-yellow-400/10 shadow-[0_10px_40px_-5px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_45px_-5px_rgba(250,204,21,0.25)] hover:border-yellow-400/20 transition-all duration-500 before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-r before:from-transparent before:via-yellow-400/5 before:to-transparent before:animate-pulse-border">
                  <img src="/client1-Photoroom.png" alt="Client Partner" className="h-14 sm:h-16 md:h-20 lg:h-24 w-auto opacity-80 hover:opacity-100 transition-all duration-300 hover:scale-105 drop-shadow-[0_5px_15px_rgba(250,204,21,0.15)] hover:drop-shadow-[0_8px_25px_rgba(250,204,21,0.2)]" />
                  <img src="/identi-logo.png" alt="Identi - Trusted partner" className="h-14 sm:h-16 md:h-20 lg:h-24 w-auto opacity-80 hover:opacity-100 transition-all duration-300 hover:scale-105 drop-shadow-[0_5px_15px_rgba(250,204,21,0.15)] hover:drop-shadow-[0_8px_25px_rgba(250,204,21,0.2)]" />
                  <img src="/myapproved-logo.png" alt="MyApproved - Trusted partner" className="h-14 sm:h-16 md:h-20 lg:h-24 w-auto opacity-80 hover:opacity-100 transition-all duration-300 hover:scale-105 drop-shadow-[0_5px_15px_rgba(250,204,21,0.15)] hover:drop-shadow-[0_8px_25px_rgba(250,204,21,0.2)]" />
                  <img src="/omni-logo.png" alt="Omni - Trusted partner" className="h-14 sm:h-16 md:h-20 lg:h-24 w-auto opacity-80 hover:opacity-100 transition-all duration-300 hover:scale-105 drop-shadow-[0_5px_15px_rgba(250,204,21,0.15)] hover:drop-shadow-[0_8px_25px_rgba(250,204,21,0.2)]" />
                  <img src="/6.svg" alt="Partner 6 - Trusted partner" className="h-14 sm:h-16 md:h-20 lg:h-24 w-auto opacity-80 hover:opacity-100 transition-all duration-300 hover:scale-105 drop-shadow-[0_5px_15px_rgba(250,204,21,0.15)] hover:drop-shadow-[0_8px_25px_rgba(250,204,21,0.2)]" />
                  <img src="/9.svg" alt="Partner 9 - Trusted partner" className="h-14 sm:h-16 md:h-20 lg:h-24 w-auto opacity-80 hover:opacity-100 transition-all duration-300 hover:scale-105 drop-shadow-[0_5px_15px_rgba(250,204,21,0.15)] hover:drop-shadow-[0_8px_25px_rgba(250,204,21,0.2)]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROOF SECTION - HERO SYSTEM ENFORCED */}
      <section className="max-w-[1400px] mx-auto px-8 sm:px-12 lg:px-16 py-32 bg-gradient-to-b from-transparent via-black/50 to-transparent">
        <div className="text-center mb-16">
          <span className="inline-block uppercase text-yellow-400 text-sm font-bold tracking-[0.2em] mb-4">PROVEN RESULTS</span>
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-black text-white mb-6 tracking-tight leading-[1.1]">Authority in Numbers</h2>
          <p className="text-[#C0C0C0] text-lg max-w-2xl mx-auto">Measurable impact. Verified performance.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-24">
          {[
            { metric: '+1M', label: 'Audits delivered' },
            { metric: '87%', label: 'Faster ranking improvements' },
            { metric: '20+', label: 'Countries' },
            { metric: '£25M+', label: 'Client revenue influenced' }
          ].map((stat, i) => (
            <div key={i} className="text-center p-8 rounded-2xl bg-gradient-to-b from-black/50 via-black/30 to-transparent border border-yellow-400/10 shadow-[0_10px_40px_-5px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_45px_-5px_rgba(250,204,21,0.25)] hover:border-yellow-400/20 transition-all duration-500">
              <p className="text-5xl font-black text-[#FFD700] mb-4">{stat.metric}</p>
              <p className="text-[#C0C0C0] font-medium text-base">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="p-12 rounded-2xl border border-yellow-400/10 bg-gradient-to-b from-black/50 via-black/30 to-transparent shadow-[0_10px_40px_-5px_rgba(0,0,0,0.3)] transition-all duration-500">
            <div className="flex items-center justify-center mb-8">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 p-1 border border-yellow-400/50 overflow-hidden shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                <img src={testimonials[testimonialIndex].face} alt={`${testimonials[testimonialIndex].name} profile`} className="h-full w-full rounded-full object-cover" />
              </div>
            </div>
            <p className="text-white font-bold text-2xl mb-6 leading-relaxed text-center">{testimonials[testimonialIndex].quote}</p>
            <p className="text-[#C0C0C0] text-lg font-medium text-center">{testimonials[testimonialIndex].name}, {testimonials[testimonialIndex].company}</p>
          </div>
          <div className="flex items-center justify-center gap-3 mt-8">
            {testimonials.map((_, i) => (
              <button key={i} aria-label={`Go to testimonial ${i + 1}`} onClick={() => setTestimonialIndex(i)} className={`h-2 w-2 rounded-full border border-yellow-400 transition-all ${i === testimonialIndex ? 'bg-yellow-400 scale-125' : 'bg-white/10'}`} />
            ))}
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1,2,3].map((n) => (
            <div key={n} className="rounded-2xl p-8 bg-gradient-to-b from-black/50 via-black/30 to-transparent border border-yellow-400/10 shadow-[0_10px_40px_-5px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_45px_-5px_rgba(250,204,21,0.25)] hover:border-yellow-400/20 transition-all duration-500">
              <h3 className="text-2xl font-black text-white mb-6">Case Study {n}</h3>
              <div className="aspect-video rounded-xl bg-black/80 border border-yellow-400/10 flex items-center justify-center mb-4">
                <img src={`/charts/chart${n}.svg`} alt={`Case Study ${n}`} className="h-full w-auto object-contain" />
              </div>
              <p className="text-[#C0C0C0] text-base leading-relaxed">
                {n === 1 && '+120% non-brand traffic in 90 days via technical fixes and content velocity.'}
                {n === 2 && '+68% conversion rate lift after addressing intent gaps with Competitor Analysis Software.'}
                {n === 3 && 'Agency rollout with White-Label SEO Reports for Agencies across 27 clients in 30 days.'}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING SECTION - HERO SYSTEM ENFORCED */}
      <section className="max-w-[1400px] mx-auto px-8 sm:px-12 lg:px-16 py-32 bg-gradient-to-b from-transparent via-black/50 to-transparent">
        <div className="text-center mb-16">
          <span className="inline-block uppercase text-yellow-400 text-sm font-bold tracking-[0.2em] mb-4">TRANSPARENT PRICING</span>
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-black text-white mb-6 tracking-tight leading-[1.1]">Command Your Market</h2>
          <p className="text-[#C0C0C0] text-lg max-w-2xl mx-auto">Authority-grade tools. Enterprise execution.</p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-full bg-black/80 border border-yellow-400/20 p-1">
            <button
              className={`px-6 py-3 rounded-full font-bold transition text-sm ${pricingTab === 'saas' ? 'bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 text-black shadow-[0_4px_15px_rgba(250,204,21,0.3)]' : 'text-[#C0C0C0] hover:text-yellow-400'}`}
              onClick={() => setPricingTab('saas')}
            >
              SaaS Plans
            </button>
            <button
              className={`px-6 py-3 rounded-full font-bold transition text-sm ${pricingTab === 'retainers' ? 'bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 text-black shadow-[0_4px_15px_rgba(250,204,21,0.3)]' : 'text-[#C0C0C0] hover:text-yellow-400'}`}
              onClick={() => setPricingTab('retainers')}
            >
              Done-For-You SEO
            </button>
          </div>
        </div>

        {pricingTab === 'saas' && (
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Starter', price: '£49', desc: 'Small Sites & Freelancers', features: 'Track 100 keywords with monthly audits' },
              { name: 'Growth', price: '£249', desc: 'Growing Teams & Agencies', features: 'Track 1,000 keywords with weekly competitor reports', featured: true },
              { name: 'Empire', price: '£499', desc: 'Agencies & Enterprises', features: 'Unlimited keyword tracking with white-label reports' }
            ].map((plan, i) => (
              <div key={i} className={`relative p-8 rounded-2xl bg-gradient-to-b from-black/50 via-black/30 to-transparent border ${plan.featured ? 'border-yellow-400 scale-105 shadow-[0_15px_45px_-5px_rgba(250,204,21,0.3)]' : 'border-yellow-400/10'} transition-all duration-500 hover:shadow-[0_15px_45px_-5px_rgba(250,204,21,0.25)] hover:border-yellow-400/20`}>
                {plan.featured && <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 text-sm font-black rounded-full bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 text-black shadow-lg">RECOMMENDED</div>}
                <h3 className="text-3xl font-black text-white mb-3">{plan.name}</h3>
                <p className="text-[#C0C0C0] mb-4 text-base font-medium">{plan.desc}</p>
                <p className="text-5xl font-black text-[#FFD700] mb-6">{plan.price}<span className="text-lg text-[#C0C0C0]">/mo</span></p>
                <p className="text-[#C0C0C0] text-sm mb-6 leading-relaxed">{plan.features}</p>
                <Button className="w-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-black font-extrabold text-lg py-6 rounded-2xl shadow-[0_15px_40px_-10px_rgba(250,204,21,0.4)] hover:shadow-[0_20px_50px_-12px_rgba(250,204,21,0.6)] hover:scale-[1.03] hover:-translate-y-1 transition-all duration-500 border-2 border-yellow-400/50" asChild>
                  <NextLink href="/sign-up">Get Started</NextLink>
                </Button>
              </div>
            ))}
          </div>
        )}

        {pricingTab === 'retainers' && (
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { name: 'On-Page SEO', price: 'From £497/mo', desc: 'Technical fixes, structure optimization, and metadata improvements' },
              { name: 'Link Building', price: 'From £997/mo', desc: 'Authority-driven outreach and white-hat link acquisition' },
              { name: 'Content Creation', price: 'From £1,497/mo', desc: 'SEO-optimized content creation and strategy' },
              { name: 'Full-Service SEO', price: '£2,997–£4,997/mo', desc: 'Complete SEO execution with dedicated strategist', featured: true }
            ].map((service, i) => (
              <div key={i} className={`relative p-8 rounded-2xl bg-gradient-to-b from-black/50 via-black/30 to-transparent border ${service.featured ? 'border-yellow-400 scale-105 shadow-[0_15px_45px_-5px_rgba(250,204,21,0.3)]' : 'border-yellow-400/10'} transition-all duration-500 hover:shadow-[0_15px_45px_-5px_rgba(250,204,21,0.25)] hover:border-yellow-400/20`}>
                {service.featured && <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 text-sm font-black rounded-full bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 text-black shadow-lg">EMPIRE+</div>}
                <h3 className="text-3xl font-black text-white mb-3">{service.name}</h3>
                <p className="text-[#FFD700] text-xl font-bold mb-4">{service.price}</p>
                <p className="text-[#C0C0C0] text-base mb-6 leading-relaxed">{service.desc}</p>
                <Button className="w-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-black font-extrabold text-lg py-6 rounded-2xl shadow-[0_15px_40px_-10px_rgba(250,204,21,0.4)] hover:shadow-[0_20px_50px_-12px_rgba(250,204,21,0.6)] hover:scale-[1.03] hover:-translate-y-1 transition-all duration-500 border-2 border-yellow-400/50" asChild>
                  <NextLink href="/sign-up">Get Started</NextLink>
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FAQ SECTION - HERO SYSTEM ENFORCED */}
      <section id="faq" className="max-w-[1400px] mx-auto px-8 sm:px-12 lg:px-16 py-32 bg-gradient-to-b from-transparent via-black/50 to-transparent">
        <div className="text-center mb-16">
          <span className="inline-block uppercase text-yellow-400 text-sm font-bold tracking-[0.2em] mb-4">FREQUENTLY ASKED</span>
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-black text-white mb-6 tracking-tight leading-[1.1]">Questions Answered</h2>
          <p className="text-[#C0C0C0] text-lg max-w-2xl mx-auto">Clear answers. No ambiguity.</p>
        </div>
        
        <div className="max-w-3xl mx-auto bg-gradient-to-b from-black/50 via-black/30 to-transparent border border-yellow-400/10 rounded-2xl p-8 shadow-[0_10px_40px_-5px_rgba(0,0,0,0.3)]">
          <Accordion type="single" collapsible className="w-full">
            {[
              { q: 'What is included in the free SEO analysis?', a: 'A lightweight technical audit, top issues, and quick wins to improve rankings. You\'ll also see opportunities surfaced by our Competitor Analysis Software.' },
              { q: 'Do you support white-label SEO reports for agencies?', a: 'Yes. Our White-Label SEO Reports for Agencies include your branding, scheduled delivery, and export to PDF/CSV.' },
              { q: 'How accurate is the rank tracking?', a: 'We track daily with location targeting options. The Growth and Empire plans expand keyword and location coverage.' },
              { q: 'Can I switch plans or cancel anytime?', a: 'Absolutely. You can upgrade, downgrade, or cancel at any time from your dashboard.' },
              { q: 'Do you offer done-for-you SEO services?', a: 'Yes. Our Task Force can execute technical fixes, content, and outreach — backed by our platform for measurable results.' },
              { q: 'Do you provide white-label access and API?', a: 'Empire includes white-label SEO reports and API access so agencies can integrate SEOInForce into their client workflows.' }
            ].map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-b border-yellow-400/10">
                <AccordionTrigger className="font-bold text-white text-lg py-5 hover:text-yellow-400 transition-colors">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-[#C0C0C0] text-base leading-relaxed pt-2 pb-4">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* FOOTER - HERO SHADOW */}
      <footer className="border-t border-yellow-400/10 bg-gradient-to-b from-black via-[#0a0a0a] to-black">
        <div className="max-w-[1400px] mx-auto px-8 sm:px-12 lg:px-16 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center justify-center h-12 w-12 rounded-full ring-2 ring-yellow-400/80 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 overflow-hidden shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                  <img src="/logo.svg" alt="SEOInForce" className="h-10 w-10 rounded-full object-cover" />
                </span>
                <span className="text-white font-black text-xl tracking-tight">SEO in Force</span>
              </div>
              <p className="text-[#C0C0C0] text-sm leading-relaxed">Command authority. Dominate search.</p>
            </div>
            
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Platform</h4>
              <ul className="space-y-2 text-[#C0C0C0] text-sm">
                <li><a href="#" className="hover:text-yellow-400 transition">Features</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition">Pricing</a></li>
                <li><a href="#faq" className="hover:text-yellow-400 transition">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Resources</h4>
              <ul className="space-y-2 text-[#C0C0C0] text-sm">
                <li><a href="#" className="hover:text-yellow-400 transition">Documentation</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition">API Reference</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-2 text-[#C0C0C0] text-sm">
                <li><a href="#" className="hover:text-yellow-400 transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition">GDPR</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-yellow-400/10 text-center">
            <p className="text-[#C0C0C0] text-sm">© 2025 <span className="text-yellow-400 font-bold">SEO in Force</span>. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* FLOATING CHAT - HERO SYSTEM */}
      <button
        aria-label="Open chat assistant"
        onClick={() => setChatOpen((o) => !o)}
        className="fixed z-[80] bottom-6 right-6 h-16 w-16 rounded-full ring-2 ring-yellow-400/80 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.5)] hover:shadow-[0_0_25px_rgba(250,204,21,0.6)] hover:scale-105 flex items-center justify-center transition-all duration-300 overflow-hidden"
      >
        <img src="/logo.svg" alt="SEOInForce chat" className="h-14 w-14 rounded-full object-cover" />
      </button>

      {chatOpen && (
        <div className="fixed z-[90] bottom-24 right-6 w-[380px] rounded-2xl border border-yellow-400/20 bg-gradient-to-b from-[#0a0a0a] via-black to-[#0a0a0a] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-yellow-400/20 bg-black/80">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center h-10 w-10 rounded-full ring-2 ring-yellow-400/80 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 overflow-hidden shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                <img src="/logo.svg" alt="SEOInForce" className="h-8 w-8 rounded-full object-cover" />
              </span>
              <span className="font-black text-sm text-white tracking-tight">SEOInForce Assistant</span>
            </div>
            <button aria-label="Close chat" onClick={() => setChatOpen(false)} className="text-yellow-400 hover:text-white transition">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="max-h-72 overflow-auto p-4 space-y-3 bg-black/40">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`text-sm rounded-xl p-3 w-fit max-w-[85%] ${
                  message.type === 'assistant'
                    ? 'font-medium text-white bg-gradient-to-b from-black/80 via-black/60 to-black/80 border border-yellow-400/20'
                    : 'text-yellow-400 bg-black/80 border border-yellow-400/20 ml-auto font-semibold'
                }`}
              >
                <div className="whitespace-pre-line">{message.content}</div>
              </div>
            ))}
            {isTyping && (
              <div className="text-sm font-medium text-white bg-gradient-to-b from-black/80 via-black/60 to-black/80 border border-yellow-400/20 rounded-xl p-3 w-fit max-w-[85%]">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span>Typing...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          
          <div className="p-3 border-t border-yellow-400/20 bg-black/60">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isTyping}
                className="flex-1 bg-black/80 border border-yellow-400/20 text-white placeholder:text-[#C0C0C0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 disabled:opacity-50"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!userInput.trim() || isTyping}
                className="px-4 py-2 rounded-lg bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-black hover:shadow-[0_8px_20px_-6px_rgba(250,204,21,0.5)] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-yellow-400/50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Audit Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6">
          <div className="bg-gradient-to-b from-black/90 via-black/80 to-black/90 border-2 border-yellow-400/40 rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            {!auditResult && !isAnalyzing && (
              <>
                <h3 className="text-2xl font-bold hero-gradient-text mb-4 text-center">Analyze My Website</h3>
                <p className="text-[#C0C0C0] text-sm mb-6 text-center">Enter your website URL to get a free SEO audit</p>
                <div className="space-y-4">
                  <Input
                    type="text"
                    placeholder="example.com"
                    value={auditUrl}
                    onChange={(e) => setAuditUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAnalyzeWebsite()}
                    className="bg-black/50 border-yellow-400/30 text-white placeholder:text-[#C0C0C0] focus:border-yellow-400"
                  />
                  <div className="flex gap-3">
                    <Button
                      onClick={handleAnalyzeWebsite}
                      disabled={!auditUrl.trim()}
                      className="flex-1 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-black font-extrabold py-3 rounded-xl"
                    >
                      Analyze
                    </Button>
                    <Button
                      onClick={() => {
                        setShowAuditModal(false);
                        setAuditUrl('');
                        setAuditResult(null);
                      }}
                      className="flex-1 bg-[#232323] border border-yellow-400/30 text-[#FFD700] font-bold py-3 rounded-xl"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </>
            )}

            {isAnalyzing && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent mb-4"></div>
                <h3 className="text-2xl font-bold text-white mb-2">Analyzing...</h3>
                <p className="text-[#C0C0C0]">This may take up to 60 seconds</p>
              </div>
            )}

            {auditResult && !isAnalyzing && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-2xl font-bold hero-gradient-text mb-2">Analysis Complete!</h3>
                  <p className="text-[#C0C0C0] text-sm mb-4">Your SEO audit is ready</p>
                  <div className="bg-gradient-to-b from-black/50 via-black/30 to-transparent border border-yellow-400/20 rounded-xl p-6 mb-4">
                    <div className="text-4xl font-black text-[#FFD700] mb-2">{auditResult.overall_score}</div>
                    <div className="text-[#C0C0C0] text-sm">Overall SEO Score</div>
                  </div>
                </div>
                <Button
                  onClick={handleDownloadReport}
                  className="w-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-black font-extrabold py-3 rounded-xl"
                >
                  Download Report
                </Button>
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      // Reset to allow analyzing another website
                      setAuditUrl('');
                      setAuditResult(null);
                    }}
                    className="flex-1 bg-[#232323] border border-yellow-400/30 text-[#FFD700] font-bold py-3 rounded-xl"
                  >
                    Analyze Another Website
                  </Button>
                  <Button
                    onClick={() => {
                      setShowAuditModal(false);
                      setAuditUrl('');
                      setAuditResult(null);
                    }}
                    className="flex-1 bg-[#232323] border border-yellow-400/30 text-[#FFD700] font-bold py-3 rounded-xl"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
