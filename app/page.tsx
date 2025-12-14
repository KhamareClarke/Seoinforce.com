'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Rocket, Star, Activity, Search, Users, LineChart, Sparkles, Trophy,
  Mail, Phone, Facebook, Twitter, Instagram, Linkedin, Github, Rss,
  ChevronDown, Info, HelpCircle, ArrowRight, Globe, TrendingUp, Award,
  Wrench, Link as LucideLink, FileText, Shield, MessageCircle, Send, X
} from "lucide-react";

import React, { useEffect, useState } from "react";
import Script from 'next/script';
import NextLink from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Home() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [chatOpen, setChatOpen] = React.useState(false);
  const [chatMessages, setChatMessages] = React.useState([
    {
      id: 1,
      type: 'assistant',
      content: 'Hi! Need a free SEO audit or help planning your rankings?',
      timestamp: new Date()
    }
  ]);
  const [userInput, setUserInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const [showDataForm, setShowDataForm] = React.useState(false);
  const [formType, setFormType] = React.useState<'audit' | 'booking' | null>(null);
  const [userData, setUserData] = React.useState({
    name: '',
    email: '',
    phone: '',
    domain: ''
  });
  const [formErrors, setFormErrors] = React.useState<{[key: string]: string}>({});
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isTyping]);

  // Chat functionality
  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: userInput.trim(),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const response = generateAIResponse(userInput.trim());
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (userInput: string) => {
    const input = userInput.toLowerCase();
    
    // SEO audit related responses
    if (input.includes('audit') || input.includes('analyze') || input.includes('check')) {
      setFormType('audit');
      setShowDataForm(true);
      return "I'd be happy to help you run a free SEO audit! Please fill out the form below with your details and domain name, and I'll analyze your website's SEO performance, identify technical issues, and provide actionable recommendations to improve your rankings.";
    }
    
    // Pricing related responses
    if (input.includes('price') || input.includes('cost') || input.includes('plan')) {
      return "We offer flexible pricing plans:\n\n• Starter: £49/mo - Perfect for small sites (100 keywords)\n• Growth: £249/mo - For growing teams (1,000 keywords)\n• Empire: £499/mo - For agencies (unlimited keywords)\n\nWe also offer Done-For-You SEO services starting from £497/mo. Would you like to book a consultation to discuss which option is best for you?";
    }
    
    // Features related responses
    if (input.includes('feature') || input.includes('tool') || input.includes('capability')) {
      return "SEOInForce offers powerful features:\n\n• AI-powered SEO audits\n• Competitor analysis & battle reports\n• Keyword tracking & rank monitoring\n• White-label reports for agencies\n• Technical SEO recommendations\n• Content optimization insights\n• Link building opportunities\n\nWhich specific feature interests you most?";
    }
    
    // Support related responses
    if (input.includes('help') || input.includes('support') || input.includes('problem')) {
      return "I'm here to help! I can assist you with:\n\n• Running free SEO audits\n• Explaining our features and pricing\n• Booking consultations\n• Technical SEO questions\n• General SEO advice\n\nWhat would you like to know more about?";
    }
    
    // Consultation booking
    if (input.includes('book') || input.includes('consultation') || input.includes('meeting')) {
      setFormType('booking');
      setShowDataForm(true);
      return "Great! I can help you book a consultation with our SEO experts. Please fill out the form below with your details, and I'll redirect you to our booking calendar where you can schedule a 30-minute call where we'll:\n\n• Analyze your current SEO performance\n• Create a custom strategy for your goals\n• Answer all your SEO questions";
    }
    
    // Default responses
    if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
      return "Hello! I'm the SEOInForce Assistant. I can help you with SEO audits, competitor analysis, pricing information, and booking consultations. What can I help you with today?";
    }
    
    if (input.includes('thank') || input.includes('thanks')) {
      return "You're welcome! Is there anything else I can help you with regarding SEO or our services?";
    }
    
    // Fallback response
    return "I understand you're interested in SEO services. I can help you with:\n\n• Free SEO audits\n• Pricing information\n• Feature explanations\n• Booking consultations\n• General SEO advice\n\nWhat would you like to know more about?";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Form validation
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!userData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!userData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!userData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(userData.phone.replace(/[\s\-\(\)]/g, ''))) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    if (formType === 'audit' && !userData.domain.trim()) {
      errors.domain = 'Domain is required for SEO audit';
    } else if (formType === 'audit' && userData.domain.trim() && !/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(userData.domain.trim())) {
      errors.domain = 'Please enter a valid domain (e.g., example.com)';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleFormSubmit = async () => {
    if (!validateForm()) return;
    
    // Store user data
    const userInfo = {
      ...userData,
      formType,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer
    };
    
    // Store in localStorage for demo purposes
    const existingData = JSON.parse(localStorage.getItem('seoinforce_leads') || '[]');
    existingData.push(userInfo);
    localStorage.setItem('seoinforce_leads', JSON.stringify(existingData));
    
    // Send email notification
    try {
      const emailData = {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        domain: userData.domain,
        timestamp: userInfo.timestamp
      };

      if (formType === 'audit') {
        const response = await fetch('/api/send-audit-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailData),
        });

        if (!response.ok) {
          throw new Error('Failed to send audit email');
        }
      } else if (formType === 'booking') {
        const response = await fetch('/api/send-booking-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            timestamp: userInfo.timestamp
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send booking email');
        }
      }
    } catch (error) {
      console.error('Error sending email:', error);
      // Continue with the flow even if email fails
    }
    
    // Add confirmation message to chat
    const confirmationMessage = {
      id: Date.now(),
      type: 'assistant',
      content: `Thank you ${userData.name}! Your information has been recorded and we've been notified. ${formType === 'audit' ? 'We\'ll analyze your domain and send you the SEO audit report shortly.' : 'Redirecting you to our booking calendar...'}`,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, confirmationMessage]);
    setShowDataForm(false);
    setFormType(null);
    setUserData({ name: '', email: '', phone: '', domain: '' });
    setFormErrors({});
    
    // Redirect to Calendly
    if (formType === 'booking') {
      setTimeout(() => {
        window.open('https://calendly.com/khamareclarke/new-meeting', '_blank');
      }, 2000);
    }
  };

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const testimonials = [
    {
        quote: '"Our traffic grew 212% in 6 months thanks to SEOInForce."',
      name: 'Jane Smith',
      company: 'EcomBrand',
        face: '/client1-Photoroom.png',
        logo: '/client1-Photoroom.png',
    },
    {
        quote: '"The competitor insights gave us an instant edge."',
      name: 'David Jones',
      company: 'SaaS Startup',
        face: '/identi-logo.png',
        logo: '/identi-logo.png',
    },
    {
        quote: '"Best ROI we\'ve ever had in SEO — better than SEMrush or Ahrefs."',
      name: 'Lucy Patel',
      company: 'Agency Owner',
        face: '/myapproved-logo.png',
        logo: '/myapproved-logo.png',
    },
    {
        quote: '"SEOInForce helped us dominate rankings for our most competitive keywords."',
      name: 'Michael Lee',
      company: 'GrowthX',
        face: '/omni-logo.png',
        logo: '/omni-logo.png',
    },
    {
        quote: '"The white-label reports made us look like SEO heroes to our clients."',
      name: 'Sophie Turner',
      company: 'AgencyPro',
        face: '/6.svg',
        logo: '/6.svg',
    },
  ];
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [pricingTab, setPricingTab] = useState<'saas' | 'retainers'>('saas');
  useEffect(() => {
    const id = setInterval(() => {
      setTestimonialIndex((i) => (i + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(id);
  }, [testimonials.length]);
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-black to-[#C0C0C0]/10">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-gradient-to-b from-black via-[#0a0a0a] to-[#111]/80 backdrop-blur-xl border-b border-yellow-400/10 shadow-2xl py-4">
        <div className="max-w-[1400px] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="flex items-center justify-between" style={{ minHeight: '48px' }}>
            {/* Logo with gold ring */}
            <div className="flex items-center gap-4 sm:gap-5 md:gap-6">
              <span className="inline-flex items-center justify-center h-12 sm:h-14 md:h-16 w-12 sm:w-14 md:w-16 rounded-full ring-[3px] ring-yellow-400/80 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 overflow-hidden shadow-[0_0_15px_rgba(250,204,21,0.5)] transition-all duration-300 hover:shadow-[0_0_25px_rgba(250,204,21,0.6)] hover:scale-105">
                <img src="/logo.svg" alt="SEOInForce shield logo" className="h-10 sm:h-12 md:h-14 w-10 sm:w-12 md:w-14 rounded-full object-cover" />
              </span>
              <span className="hero-gradient-text font-extrabold text-lg sm:text-xl md:text-2xl tracking-tight drop-shadow-[0_2px_10px_rgba(250,204,21,0.3)] transition-all duration-300 hover:drop-shadow-[0_2px_15px_rgba(250,204,21,0.4)]">SEO in Force</span>
            </div>
            {/* Desktop Navigation */}
            <ul className="hidden md:flex items-center gap-4 lg:gap-6 font-medium text-sm tracking-wide">
              <li><a href="/products" className="px-4 py-2 text-[#C0C0C0] hover:text-yellow-300 transition-all duration-300 relative group focus:outline-none hover:drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]"><span className="absolute left-0 -bottom-0.5 w-full h-0.5 bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />Products</a></li>
              <li><a href="/features" className="px-4 py-2 text-[#C0C0C0] hover:text-yellow-400 transition-colors duration-200 relative group focus:outline-none"><span className="absolute left-0 -bottom-0.5 w-full h-0.5 bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />Features</a></li>
              <li><a href="/pricing" className="px-4 py-2 text-[#C0C0C0] hover:text-yellow-400 transition-colors duration-200 relative group focus:outline-none"><span className="absolute left-0 -bottom-0.5 w-full h-0.5 bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />Pricing</a></li>
              <li><a href="/blog" className="px-4 py-2 text-[#C0C0C0] hover:text-yellow-400 transition-colors duration-200 relative group focus:outline-none"><span className="absolute left-0 -bottom-0.5 w-full h-0.5 bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />Blog</a></li>
              <li><a href="/faq" className="px-4 py-2 text-[#C0C0C0] hover:text-yellow-400 transition-colors duration-200 relative group focus:outline-none"><span className="absolute left-0 -bottom-0.5 w-full h-0.5 bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />FAQ</a></li>
              <li><a href="/support" className="px-4 py-2 text-[#C0C0C0] hover:text-yellow-400 transition-colors duration-200 relative group focus:outline-none"><span className="absolute left-0 -bottom-0.5 w-full h-0.5 bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />Support</a></li>
              <li>
                <a href="/sign-in" className="ml-8 px-6 py-2.5 rounded-lg font-bold bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-black hover:shadow-[0_8px_25px_-5px_rgba(250,204,21,0.5)] hover:scale-105 shadow-[0_8px_20px_-6px_rgba(250,204,21,0.3)] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/60 focus:ring-offset-2 focus:ring-offset-black border border-yellow-400/50">
                  Sign In
                </a>
              </li>
            </ul>
            {/* Mobile Hamburger */}
            <div className="md:hidden flex items-center">
              <button
                aria-label="Open main menu"
                className="text-yellow-400 hover:text-yellow-300 focus:outline-none p-2 rounded-lg transition"
                onClick={() => setMobileOpen((open) => !open)}
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
          {/* Mobile Menu */}
          {mobileOpen && (
            <div className="md:hidden flex flex-col gap-2 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-4 z-50 animate-fade-in">
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

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[700px] flex flex-col justify-center bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.1)_0%,transparent_70%)] animate-pulse-slow before:absolute before:inset-0 before:bg-[url('/noise.svg')] before:opacity-20 before:mix-blend-soft-light before:pointer-events-none">
        {/* Particle effect container */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-yellow-400/50 animate-particle-1"></div>
          <div className="absolute top-3/4 left-2/3 w-2 h-2 rounded-full bg-yellow-400/50 animate-particle-2"></div>
          <div className="absolute top-1/2 right-1/4 w-2 h-2 rounded-full bg-yellow-400/50 animate-particle-3"></div>
        </div>
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#000_0%,rgba(0,0,0,0.8)_50%,#000_100%)] opacity-90 after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.15)_0%,transparent_50%)] after:animate-pulse-slow"></div>
        <div className="absolute w-full h-full bg-[url('/grid.svg')] opacity-20 animate-float-slow"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black via-transparent to-black opacity-60"></div>
        {/* Animated decorative glows (chrome themed) */}
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-3xl animate-pulse bg-gradient-to-br from-yellow-400/20 via-[#C0C0C0]/15 to-[#1a1a1a]/10" />
        <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full blur-3xl animate-pulse animation-delay-1000 bg-gradient-to-br from-yellow-500/15 via-[#C0C0C0]/12 to-[#0b0b0b]/10" />
        {/* Animated floating orbs */}
        <div className="absolute left-1/4 top-1/4 w-48 h-48 rounded-full blur-3xl animate-float-slow bg-gradient-to-br from-yellow-400/20 via-yellow-500/10 to-transparent" />
        <div className="absolute right-1/4 bottom-1/4 w-48 h-48 rounded-full blur-3xl animate-float-slow animation-delay-2000 bg-gradient-to-br from-yellow-400/15 via-yellow-500/10 to-transparent" />

        <div className="max-w-[1400px] mx-auto px-8 sm:px-12 lg:px-16 pt-8 pb-20 relative z-10">
          <div className="text-center mb-20">
            {/* Trust chip */}
            <div className="flex flex-col items-center gap-2 mb-4">
              <span className="inline-flex items-center px-6 py-2.5 rounded-full bg-gradient-to-r from-yellow-400/20 via-yellow-500/20 to-yellow-400/20 text-yellow-400 font-semibold text-sm tracking-wide shadow-[0_4px_20px_-3px_rgba(250,204,21,0.2)] backdrop-blur-sm animate-fade-in border border-yellow-400/20 hover:border-yellow-400/30 hover:shadow-[0_4px_25px_-3px_rgba(250,204,21,0.25)] transition-all duration-300">
                <Globe className="inline-block w-4 h-4 mr-2" aria-label="Globe icon - Trusted by 10,000+ websites" /> Trusted by 10,000+ websites
              </span>
            </div>
            {/* Hero headline (metallic gold gradient) */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-8 tracking-tight hero-gradient-text drop-shadow-[0_2px_30px_rgba(250,204,21,0.4)] text-center leading-[1.1] animate-fade-in-up">
              <span className="text-white animate-shimmer-slow">
              Dominate Search</span> <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 animate-text-glow">Command Authority.</span>
            </h1>
            {/* Subheadline with SEO keywords */}
            <p className="text-lg sm:text-xl md:text-2xl text-[#C0C0C0] mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up delay-200 text-center drop-shadow-lg font-medium">
              <span className="font-semibold">SEO Audit Tool UK</span> – AI-powered audits, <span className="font-semibold">Competitor Analysis Software</span>, <span className="font-semibold">White-Label SEO Reports for Agencies</span>, and <span className="font-semibold">Done-for-You SEO Services</span> trusted by 10,000+ businesses.
            </p>
            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-8 animate-fade-in">
              <Button className="group relative overflow-hidden bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-black px-12 py-6 text-lg font-bold rounded-2xl shadow-[0_15px_40px_-10px_rgba(250,204,21,0.4)] hover:shadow-[0_20px_50px_-12px_rgba(250,204,21,0.6)] hover:scale-[1.02] transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/60 focus-visible:ring-offset-4 focus-visible:ring-offset-black border border-yellow-400/50" asChild>
                <a href="https://calendly.com/khamareclarke/new-meeting" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-4 text-slate-900">
                  <span className="relative z-10 font-extrabold tracking-wide">Start Free Analysis</span>
                  <ArrowRight className="h-7 w-7 relative z-10 group-hover:translate-x-1 transition-transform duration-500" />
                  <span className="absolute inset-0 bg-gradient-to-br from-yellow-200 via-yellow-300 to-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                </a>
              </Button>
              <Button className="group relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 text-white border-2 border-yellow-400/60 px-12 py-6 text-lg font-bold rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] hover:shadow-[0_25px_80px_-15px_rgba(250,204,21,0.4)] hover:scale-[1.03] backdrop-blur-sm transition-all duration-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400/60 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-900" asChild>
                <a href="https://calendly.com/khamareclarke/new-meeting" target="_blank" rel="noopener noreferrer" className="relative z-10">
                  <span className="font-extrabold tracking-wide bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 bg-clip-text text-transparent group-hover:from-yellow-200 group-hover:via-yellow-300 group-hover:to-yellow-200 transition-all duration-500">Book Consultation</span>
                  <span className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                </a>
              </Button>
            </div>
            {/* Trust Carousel: 5-Star + Logos */}
            <div className="flex flex-col items-center mt-8 mb-0 animate-fade-in">
              <div className="flex items-center gap-3 mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} aria-label="star" className="h-8 w-8 text-yellow-400 drop-shadow-[0_2px_8px_rgba(250,204,21,0.4)] transition-all duration-300 hover:drop-shadow-[0_2px_12px_rgba(250,204,21,0.5)] hover:scale-110 animate-pulse-star" fill="currentColor" viewBox="0 0 20 20"><path d="M10 15.27L16.18 18l-1.64-7.03L19 7.24l-7.19-.61L10 0 8.19 6.63 1 7.24l5.46 3.73L4.82 18z"/></svg>
                ))}
              </div>
              <span className="text-xl text-white font-bold tracking-wide mb-6 drop-shadow-[0_2px_10px_rgba(250,204,21,0.3)] transition-all duration-300 hover:drop-shadow-[0_2px_15px_rgba(250,204,21,0.4)]">Rated <span className="text-[#FFD700]">5/5</span> by 10,000+ businesses</span>
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
            {/* Keep hero minimal: partner logos remain; detailed features moved below */}
          </div>
        </div>
      </section>

      {/* Proof Section (Trust Signals) */}
      <section className="max-w-[1400px] mx-auto px-8 sm:px-12 lg:px-16 py-32">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold hero-gradient-text text-center mb-24">Proof & Testimonials</h2>
        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-24">
          <div className="text-center p-12 rounded-3xl bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border-2 border-yellow-400/40 shadow-2xl">
            <p className="text-4xl md:text-5xl font-extrabold hero-gradient-text mb-5">+1M</p>
            <p className="text-[#C0C0C0] font-semibold text-xl">Audits delivered</p>
          </div>
          <div className="text-center p-12 rounded-3xl bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border-2 border-yellow-400/40 shadow-2xl">
            <p className="text-4xl md:text-5xl font-extrabold hero-gradient-text mb-5">87%</p>
            <p className="text-[#C0C0C0] font-semibold text-xl">Faster ranking improvements</p>
          </div>
          <div className="text-center p-12 rounded-3xl bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border-2 border-yellow-400/40 shadow-2xl">
            <p className="text-4xl md:text-5xl font-extrabold hero-gradient-text mb-5">20+ Countries</p>
            <p className="text-[#C0C0C0] font-semibold text-xl">Agencies trust us</p>
          </div>
          <div className="text-center p-12 rounded-3xl bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border-2 border-yellow-400/40 shadow-2xl">
            <p className="text-4xl md:text-5xl font-extrabold hero-gradient-text mb-5">£25M+</p>
            <p className="text-[#C0C0C0] font-semibold text-xl">Client revenue influenced</p>
          </div>
        </div>
        {/* Rotating testimonials */}
        <div className="max-w-5xl mx-auto">
          <div className="p-16 md:p-20 rounded-3xl border-2 border-yellow-400/60 bg-gradient-to-b from-[#191919] via-[#232323] to-[#e5e5e5]/10 shadow-2xl transition-all duration-500 flex flex-col items-center text-center" aria-label="testimonial-rotating">
            <div className="flex items-center justify-center mb-10">
              <div className="h-24 w-24 rounded-full bg-yellow-400 p-2 border-2 border-yellow-400 overflow-hidden">
                <img src={testimonials[testimonialIndex].face} alt={`${testimonials[testimonialIndex].name} profile`} className="h-full w-full rounded-full object-cover" />
              </div>
            </div>
            <p className="hero-gradient-text font-extrabold text-xl md:text-2xl mb-8 leading-relaxed">{testimonials[testimonialIndex].quote}</p>
            <p className="text-[#C0C0C0] text-lg font-semibold">{testimonials[testimonialIndex].name}, {testimonials[testimonialIndex].company}</p>
          </div>
          <div className="flex items-center justify-center gap-4 mt-10">
            {testimonials.map((_, i) => (
              <button key={i} aria-label={`Go to testimonial ${i + 1}`} onClick={() => setTestimonialIndex(i)} className={`h-2.5 w-2.5 rounded-full border border-yellow-400 ${i === testimonialIndex ? 'bg-yellow-400' : 'bg-white/10'}`} />
            ))}
          </div>
        </div>
        {/* Case studies: 3-box layout */}
        <div className="mt-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[1,2,3].map((n) => (
              <div key={n} className="rounded-3xl p-12 bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border-2 border-yellow-400/40 shadow-2xl flex flex-col items-center">
                <h3 className="text-2xl md:text-3xl font-extrabold hero-gradient-text mb-8">Case Study {n}: Before/After</h3>
                {n === 1 && (
  <div className="aspect-video rounded-xl bg-gradient-to-b from-[#0b0b0b] via-[#1a1a1a] to-[#e5e5e5]/10 border border-yellow-400/30 flex items-center justify-center text-[#C0C0C0] mb-3">
    <img src="/charts/chart1.svg" alt="SEO traffic before and after using SEOInForce – Case Study 1" className="h-full w-auto object-contain" />
  </div>
)}
{n === 2 && (
  <div className="aspect-video rounded-xl bg-gradient-to-b from-[#0b0b0b] via-[#1a1a1a] to-[#e5e5e5]/10 border border-yellow-400/30 flex items-center justify-center text-[#C0C0C0] mb-3">
    <img src="/charts/chart2.svg" alt="Conversion rate before and after using Competitor Analysis Software – Case Study 2" className="h-full w-auto object-contain" />
  </div>
)}
{n === 3 && (
  <div className="aspect-video rounded-xl bg-gradient-to-b from-[#0b0b0b] via-[#1a1a1a] to-[#e5e5e5]/10 border border-yellow-400/30 flex items-center justify-center text-[#C0C0C0] mb-3">
    <img src="/charts/chart3.svg" alt="Agency rollout results with White-Label SEO Reports for Agencies – Case Study 3" className="h-full w-auto object-contain" />
  </div>
)}
                <p className="text-[#C0C0C0] text-base text-center leading-relaxed">
                  {n === 1 && '+120% non-brand traffic in 90 days via technical fixes and content velocity.'}
                  {n === 2 && '+68% conversion rate lift after addressing intent gaps with Competitor Analysis Software.'}
                  {n === 3 && 'Agency rollout with White-Label SEO Reports for Agencies across 27 clients in 30 days.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Consultation Section */}
      <section className="max-w-[1400px] mx-auto px-8 sm:px-12 lg:px-16 py-32">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold hero-gradient-text text-center mb-24">Book a Consultation</h2>
        <Card className="p-16 md:p-20 bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border-2 border-yellow-400/40 shadow-2xl rounded-3xl">
          <div className="grid md:grid-cols-2 gap-16">
            <div className="space-y-12 flex flex-col justify-center">
              <h3 className="text-2xl md:text-3xl font-extrabold hero-gradient-text mb-6">Maximize Your SEO Performance</h3>
              <p className="text-[#C0C0C0] text-base md:text-lg font-medium mb-8 leading-relaxed">Book a consultation with our SEO experts and get personalized strategies for your website.</p>
              <div className="space-y-8">
                <div className="flex items-start gap-6">
                  <Rocket className="h-10 w-10 text-yellow-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-extrabold hero-gradient-text text-lg mb-3">Expert Analysis</h4>
                    <p className="text-base text-[#C0C0C0] leading-relaxed">Get a detailed review of your website&apos;s SEO performance and opportunities.</p>
                  </div>
                </div>
                <div className="flex items-start gap-6">
                  <Star className="h-10 w-10 text-yellow-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-extrabold hero-gradient-text text-lg mb-3">Custom Strategy</h4>
                    <p className="text-base text-[#C0C0C0] leading-relaxed">Receive a tailored SEO strategy designed for your specific goals.</p>
                  </div>
                </div>
                <div className="flex items-start gap-6">
                  <Activity className="h-10 w-10 text-yellow-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-extrabold hero-gradient-text text-lg mb-3">Performance Tracking</h4>
                    <p className="text-base text-[#C0C0C0] leading-relaxed">Learn how to monitor and improve your rankings over time.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center items-center rounded-3xl p-12 bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border-2 border-yellow-400/30 shadow-2xl">
              <h4 className="text-2xl font-extrabold hero-gradient-text mb-6">Book Your Consultation</h4>
              <p className="text-[#C0C0C0] text-lg mb-12 text-center leading-relaxed">Schedule a 30-minute consultation with our SEO experts.</p>
               <Button className="w-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-slate-900 hover:shadow-2xl hover:shadow-yellow-400/50 font-bold py-6 text-lg rounded-2xl shadow-xl hover:scale-[1.03] transition-all duration-500 border-2 border-yellow-400/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400/60 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-900" asChild>
                 <a href="https://calendly.com/khamareclarke/new-meeting" target="_blank" rel="noopener noreferrer">
                   <span className="hidden sm:inline">Schedule Now</span>
                   <span className="sm:hidden">Book Call</span>
                 </a>
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Pricing Section */}
      <section className="max-w-[1400px] mx-auto px-8 sm:px-12 lg:px-16 py-32">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold hero-gradient-text text-center mb-24">Transparent Pricing</h2>
        {/* Pricing Toggle */}
        <div className="flex flex-col items-center gap-4 mb-12">
          <span className="inline-flex items-center px-7 py-3 rounded-full bg-yellow-400/20 text-yellow-400 font-bold text-sm tracking-wider shadow animate-fade-in">
            <Sparkles className="inline-block w-5 h-5 mr-2" aria-label="Trusted by 10,000+ businesses" /> Trusted by 10,000+ businesses &bull; See real results in 60 seconds
          </span>
        </div>
        <div className="flex justify-center mb-16">
          <div className="inline-flex rounded-full bg-[#181818] border border-yellow-400/40 p-1">
            <button
              className={`px-6 py-2 rounded-full font-semibold transition text-sm ${pricingTab === 'saas' ? 'bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 text-black shadow' : 'text-[#C0C0C0] hover:text-yellow-400'}`}
              onClick={() => setPricingTab('saas')}
              aria-pressed={pricingTab === 'saas'}
            >
              SaaS Plans
            </button>
            <button
              className={`px-6 py-2 rounded-full font-semibold transition text-sm ${pricingTab === 'retainers' ? 'bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 text-black shadow' : 'text-[#C0C0C0] hover:text-yellow-400'}`}
              onClick={() => setPricingTab('retainers')}
              aria-pressed={pricingTab === 'retainers'}
            >
              Done-For-You SEO Retainers
            </button>
          </div>
        </div>
        {/* SaaS Pricing */}
        {pricingTab === 'saas' && (
          <div className="grid md:grid-cols-3 gap-12">
            {/* Starter */}
            <Card className="relative p-12 bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border-2 border-yellow-400/30 shadow-2xl rounded-3xl flex flex-col items-center">
  <h3 className="text-2xl md:text-3xl font-extrabold hero-gradient-text mb-5">Starter</h3>
  <p className="text-[#C0C0C0] mb-6 text-base md:text-lg font-semibold">Perfect for Small Sites & Freelancers</p>
  <p className="text-[#FFD700] italic mb-8 text-sm leading-relaxed">"Run monthly audits, track 100 keywords, and fix hidden SEO issues before they cost you rankings."</p>
  <p className="text-4xl font-extrabold hero-gradient-text mb-6">£49<span className="text-lg text-[#C0C0C0]">/mo</span></p>
  <Button className="w-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-slate-900 font-bold text-base py-5 rounded-2xl shadow-[0_20px_60px_-15px_rgba(250,204,21,0.5)] hover:shadow-[0_25px_80px_-15px_rgba(250,204,21,0.7)] hover:scale-[1.03] transition-all duration-500 border-2 border-yellow-400/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400/60 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-900 mt-6">Get Started Today &rarr;</Button>
  <div className="flex items-center gap-2 mt-4 text-xs text-[#FFD700] font-medium">
    <Shield className="h-4 w-4" aria-label="SSL Secure" /> SSL Secure
    <span className="mx-1">|</span>
    <Award className="h-4 w-4" aria-label="GDPR Compliant" /> GDPR Compliant
    <span className="mx-1">|</span>
    <span className="text-[#FFD700]">No credit card required</span>
  </div>
</Card>
            {/* Growth (Most Popular) */}
            <Card className="relative p-12 border-2 border-yellow-400 bg-gradient-to-b from-[#232323] via-[#1a1a1a] to-[#e5e5e5]/10 shadow-2xl rounded-3xl flex flex-col items-center scale-105 z-10">
  <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 text-base font-extrabold rounded-full bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 text-slate-900 shadow-lg">Most Popular</div>
  <h3 className="text-2xl md:text-3xl font-extrabold hero-gradient-text mb-5">Growth</h3>
  <p className="text-[#C0C0C0] mb-6 text-base md:text-lg font-semibold">For Growing Teams & Agencies</p>
  <p className="text-[#FFD700] italic mb-8 text-sm leading-relaxed">"Weekly competitor battle reports, AI-driven keyword insights, and 1,000 keywords tracked — helping you outrank rivals and grow traffic 10x faster."</p>
  <p className="text-4xl font-extrabold hero-gradient-text mb-6">£249<span className="text-lg text-[#C0C0C0]">/mo</span></p>
  <Button className="w-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-slate-900 font-bold text-base py-5 rounded-2xl shadow-[0_20px_60px_-15px_rgba(250,204,21,0.5)] hover:shadow-[0_25px_80px_-15px_rgba(250,204,21,0.7)] hover:scale-[1.03] transition-all duration-500 border-2 border-yellow-400/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400/60 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-900 mt-6">Get Started Today &rarr;</Button>
  <div className="flex items-center gap-2 mt-4 text-xs text-[#FFD700] font-medium">
    <Shield className="h-4 w-4" aria-label="SSL Secure" /> SSL Secure
    <span className="mx-1">|</span>
    <Award className="h-4 w-4" aria-label="GDPR Compliant" /> GDPR Compliant
    <span className="mx-1">|</span>
    <span className="text-[#FFD700]">No credit card required</span>
  </div>
</Card>
            {/* Empire */}
            <Card className="relative p-12 bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border-2 border-yellow-400/30 shadow-2xl rounded-3xl flex flex-col items-center">
  <h3 className="text-2xl md:text-3xl font-extrabold hero-gradient-text mb-5">Empire</h3>
  <p className="text-[#C0C0C0] mb-6 text-base md:text-lg font-semibold">For Agencies & Enterprises Ready to Dominate</p>
  <p className="text-[#FFD700] italic mb-8 text-sm leading-relaxed">"Unlimited keyword tracking, daily competitor monitoring, white-label reporting suite, and a dedicated manager so you can command entire markets with enterprise-grade SEO intelligence."</p>
  <p className="text-4xl font-extrabold hero-gradient-text mb-6">£499<span className="text-lg text-[#C0C0C0]">/mo</span></p>
  <Button className="w-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-slate-900 font-bold text-base py-5 rounded-2xl shadow-[0_20px_60px_-15px_rgba(250,204,21,0.5)] hover:shadow-[0_25px_80px_-15px_rgba(250,204,21,0.7)] hover:scale-[1.03] transition-all duration-500 border-2 border-yellow-400/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400/60 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-900 mt-6">Get Started Today &rarr;</Button>
  <div className="flex items-center gap-2 mt-4 text-xs text-[#FFD700] font-medium">
    <Shield className="h-4 w-4" aria-label="SSL Secure" /> SSL Secure
    <span className="mx-1">|</span>
    <Award className="h-4 w-4" aria-label="GDPR Compliant" /> GDPR Compliant
    <span className="mx-1">|</span>
    <span className="text-[#FFD700]">No credit card required</span>
  </div>
</Card>
          </div>
        )}
        {/* Done-For-You SEO Retainers Pricing */}
        {pricingTab === 'retainers' && (
          <div className="grid md:grid-cols-2 gap-10">
            {/* On-Page SEO */}
            <Card className="relative p-10 bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border-2 border-yellow-400/30 shadow-lg flex flex-col items-center">
  <h3 className="text-3xl font-bold hero-gradient-text mb-3">On-Page SEO</h3>
  <p className="text-[#C0C0C0] mb-4 text-lg font-semibold">From <span className="hero-gradient-text font-bold">£497/mo</span></p>
  <p className="text-[#FFD700] italic mb-6 text-base leading-relaxed">For sites needing technical clean-up & optimization. Technical fixes (schema, meta tags, site speed), content optimization (H1s, keyword density, internal linking), up to 5 pages/month fully optimized. Quick wins SEO package.</p>
  <Button className="w-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-slate-900 font-bold text-xl py-6 rounded-2xl shadow-[0_20px_60px_-15px_rgba(250,204,21,0.5)] hover:shadow-[0_25px_80px_-15px_rgba(250,204,21,0.7)] hover:scale-[1.03] transition-all duration-500 border-2 border-yellow-400/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400/60 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-900 mt-6">Get Started Today &rarr;</Button>
  <div className="flex items-center gap-2 mt-4 text-xs text-[#FFD700] font-medium">
    <Shield className="h-4 w-4" aria-label="SSL Secure" /> SSL Secure
    <span className="mx-1">|</span>
    <Award className="h-4 w-4" aria-label="GDPR Compliant" /> GDPR Compliant
    <span className="mx-1">|</span>
    <span className="text-[#FFD700]">No credit card required</span>
  </div>
</Card>
            {/* Link Building */}
            <Card className="relative p-10 bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border-2 border-yellow-400/30 shadow-lg flex flex-col items-center">
  <h3 className="text-3xl font-bold hero-gradient-text mb-3">Link Building</h3>
  <p className="text-[#C0C0C0] mb-4 text-lg font-semibold">From <span className="hero-gradient-text font-bold">£997–£1,497/mo</span></p>
  <p className="text-[#FFD700] italic mb-6 text-base leading-relaxed">For businesses needing authority growth. 5–10 high-authority backlinks/month (DA 40–70), guest posts + digital PR, white-hat outreach campaigns. Where SMEs/agencies win big—backlinks = rankings.</p>
  <Button className="w-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-slate-900 font-bold text-xl py-6 rounded-2xl shadow-[0_20px_60px_-15px_rgba(250,204,21,0.5)] hover:shadow-[0_25px_80px_-15px_rgba(250,204,21,0.7)] hover:scale-[1.03] transition-all duration-500 border-2 border-yellow-400/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400/60 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-900 mt-6">Get Started Today &rarr;</Button>
  <div className="flex items-center gap-2 mt-4 text-xs text-[#FFD700] font-medium">
    <Shield className="h-4 w-4" aria-label="SSL Secure" /> SSL Secure
    <span className="mx-1">|</span>
    <Award className="h-4 w-4" aria-label="GDPR Compliant" /> GDPR Compliant
    <span className="mx-1">|</span>
    <span className="text-[#FFD700]">No credit card required</span>
  </div>
</Card>
            {/* Content Creation & Strategy */}
            <Card className="relative p-10 bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border-2 border-yellow-400/30 shadow-lg flex flex-col items-center">
  <h3 className="text-3xl font-bold hero-gradient-text mb-3">Content Creation & Strategy</h3>
  <p className="text-[#C0C0C0] mb-4 text-lg font-semibold">From <span className="hero-gradient-text font-bold">£1,497–£2,497/mo</span></p>
  <p className="text-[#FFD700] italic mb-6 text-base leading-relaxed">For scaling traffic long-term. 4–8 SEO blog posts/month (1,000–2,000 words each), editorial calendar + keyword strategy, optimized for conversions (not just traffic). SEO content engine for growth.</p>
  <Button className="w-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-slate-900 font-bold text-xl py-6 rounded-2xl shadow-[0_20px_60px_-15px_rgba(250,204,21,0.5)] hover:shadow-[0_25px_80px_-15px_rgba(250,204,21,0.7)] hover:scale-[1.03] transition-all duration-500 border-2 border-yellow-400/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400/60 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-900 mt-6">Get Started Today &rarr;</Button>
  <div className="flex items-center gap-2 mt-4 text-xs text-[#FFD700] font-medium">
    <Shield className="h-4 w-4" aria-label="SSL Secure" /> SSL Secure
    <span className="mx-1">|</span>
    <Award className="h-4 w-4" aria-label="GDPR Compliant" /> GDPR Compliant
    <span className="mx-1">|</span>
    <span className="text-[#FFD700]">No credit card required</span>
  </div>
</Card>
            {/* Full-Service SEO Retainer (Empire+) */}
            <Card className="relative p-10 bg-gradient-to-b from-[#232323] via-[#181818] to-[#e5e5e5]/10 border-2 border-yellow-400/40 shadow-2xl flex flex-col items-center scale-105 z-10">
  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 text-xs font-bold rounded-full bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 text-slate-900 shadow">Empire+</div>
  <h3 className="text-3xl font-bold hero-gradient-text mb-3">Full-Service SEO Retainer</h3>
  <p className="text-[#C0C0C0] mb-4 text-lg font-semibold">£2,997–£4,997/mo</p>
  <p className="text-[#FFD700] italic mb-6 text-base leading-relaxed">For enterprises & brands who want it all. On-page + off-page + content combined, competitor tracking + quarterly strategy calls, monthly reporting dashboard + white-label reports, dedicated SEO strategist. Look like an agency powerhouse.</p>
  <Button className="w-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-slate-900 font-bold text-xl py-6 rounded-2xl shadow-[0_20px_60px_-15px_rgba(250,204,21,0.5)] hover:shadow-[0_25px_80px_-15px_rgba(250,204,21,0.7)] hover:scale-[1.03] transition-all duration-500 border-2 border-yellow-400/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400/60 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-900 mt-6">Get Started Today &rarr;</Button>
  <div className="flex items-center gap-2 mt-4 text-xs text-[#FFD700] font-medium">
    <Shield className="h-4 w-4" aria-label="SSL Secure" /> SSL Secure
    <span className="mx-1">|</span>
    <Award className="h-4 w-4" aria-label="GDPR Compliant" /> GDPR Compliant
    <span className="mx-1">|</span>
    <span className="text-[#FFD700]">No credit card required</span>
  </div>
</Card>
          </div>
        )}
      
        {/* Pricing Comparison Table */}
        <div className="mt-20 max-w-5xl mx-auto">
          <div className="rounded-2xl overflow-x-auto bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border-2 border-yellow-400/30 shadow-lg">
            <table className="min-w-full text-base text-left text-[#C0C0C0]">
              <thead className="bg-[#232323]">
                <tr>
                  <th className="py-5 px-8 font-bold text-xl hero-gradient-text">Features</th>
                  <th className="py-5 px-8 font-bold text-xl hero-gradient-text">Starter</th>
                  <th className="py-5 px-8 font-bold text-xl hero-gradient-text">Growth</th>
                  <th className="py-5 px-8 font-bold text-xl hero-gradient-text">Empire</th>
                  <th className="py-5 px-8 font-bold text-xl hero-gradient-text">Retainers</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-yellow-400/20">
                  <td className="py-4 px-8">Keyword Tracking</td>
                  <td className="py-4 px-8">100</td>
                  <td className="py-4 px-8">1,000</td>
                  <td className="py-4 px-8">Unlimited</td>
                  <td className="py-4 px-8">Custom</td>
                </tr>
                <tr className="border-t border-yellow-400/20">
                  <td className="py-4 px-8">Competitor Analysis</td>
                  <td className="py-4 px-8">Basic</td>
                  <td className="py-4 px-8">Weekly Battle Reports</td>
                  <td className="py-4 px-8">Daily Monitoring</td>
                  <td className="py-4 px-8">Quarterly Strategy Calls</td>
                </tr>
                <tr className="border-t border-yellow-400/20">
                  <td className="py-4 px-8">Content/SEO Execution</td>
                  <td className="py-4 px-8">Audit Only</td>
                  <td className="py-4 px-8">AI Insights</td>
                  <td className="py-4 px-8">White-label Reports</td>
                  <td className="py-4 px-8">Done-For-You (On-Page, Links, Content)</td>
                </tr>
                <tr className="border-t border-yellow-400/20">
                  <td className="py-4 px-8">Support</td>
                  <td className="py-4 px-8">Email</td>
                  <td className="py-4 px-8">Priority Onboarding</td>
                  <td className="py-4 px-8">VIP Support</td>
                  <td className="py-4 px-8">Dedicated Strategist</td>
                </tr>
                <tr className="border-t border-yellow-400/20">
                  <td className="py-4 px-8">Guarantee</td>
                  <td className="py-4 px-8" colSpan={4}><span className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-400/10 text-yellow-400 font-bold text-sm"><Award className="h-5 w-5 mr-2" aria-label="Money-back guarantee" /> 30-day money-back guarantee</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Done-for-You Services Section */}
      <section className="max-w-[1400px] mx-auto px-8 sm:px-12 lg:px-16 py-32">
        <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold hero-gradient-text text-center mb-12">Done-For-You SEO Services</h2>
        <p className="text-[#C0C0C0] text-center mb-20 text-xl md:text-2xl font-medium leading-relaxed max-w-4xl mx-auto">Hire the same Task Force behind the tools to execute your <em>done-for-you SEO services</em> strategy.</p>
        <div className="grid md:grid-cols-3 gap-10">
          <Card className="p-12 bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border-2 border-yellow-400/30 shadow-2xl flex flex-col items-center text-center">
            <Wrench className="h-14 w-14 text-yellow-500 mb-8" />
            <h3 className="text-3xl md:text-4xl font-extrabold hero-gradient-text mb-6">On-Page SEO – SEO Audit Tool UK</h3>
            <p className="text-[#C0C0C0] text-lg md:text-xl mb-8 leading-relaxed">Technical fixes, structure, and metadata that move the needle.</p>
             <Button className="w-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-slate-900 font-bold text-xl py-6 rounded-2xl shadow-[0_20px_60px_-15px_rgba(250,204,21,0.5)] hover:shadow-[0_25px_80px_-15px_rgba(250,204,21,0.7)] hover:scale-[1.03] transition-all duration-500 border-2 border-yellow-400/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400/60 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-900" asChild>
               <a href="https://calendly.com/khamareclarke/new-meeting" target="_blank" rel="noopener noreferrer">
                 <span className="hidden sm:inline">Book Consultation</span>
                 <span className="sm:hidden">Book Call</span>
               </a>
             </Button>
          </Card>
          <Card className="p-12 bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border-2 border-yellow-400/30 shadow-2xl flex flex-col items-center text-center">
            <LucideLink className="h-14 w-14 text-yellow-500 mb-8" />
            <h3 className="text-3xl md:text-4xl font-extrabold hero-gradient-text mb-6">Link Building – Competitor Analysis Software</h3>
            <p className="text-[#C0C0C0] text-lg md:text-xl mb-8 leading-relaxed">Authority-driven outreach and white-hat link acquisition.</p>
             <Button className="w-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-slate-900 font-bold text-xl py-6 rounded-2xl shadow-[0_20px_60px_-15px_rgba(250,204,21,0.5)] hover:shadow-[0_25px_80px_-15px_rgba(250,204,21,0.7)] hover:scale-[1.03] transition-all duration-500 border-2 border-yellow-400/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400/60 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-900" asChild>
               <a href="https://calendly.com/khamareclarke/new-meeting" target="_blank" rel="noopener noreferrer">
                 <span className="hidden sm:inline">Book Consultation</span>
                 <span className="sm:hidden">Book Call</span>
               </a>
             </Button>
          </Card>
          <Card className="p-12 bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border-2 border-yellow-400/30 shadow-2xl flex flex-col items-center text-center">
            <FileText className="h-14 w-14 text-yellow-500 mb-8" />
            <h3 className="text-3xl md:text-4xl font-extrabold hero-gradient-text mb-6">Content Creation – White-Label SEO Reports for Agencies</h3>
            <p className="text-[#C0C0C0] text-lg md:text-xl mb-8 leading-relaxed">Conversion-focused content aligned to search intent.</p>
             <Button className="w-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-slate-900 font-bold text-xl py-6 rounded-2xl shadow-[0_20px_60px_-15px_rgba(250,204,21,0.5)] hover:shadow-[0_25px_80px_-15px_rgba(250,204,21,0.7)] hover:scale-[1.03] transition-all duration-500 border-2 border-yellow-400/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400/60 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-900" asChild>
               <a href="https://calendly.com/khamareclarke/new-meeting" target="_blank" rel="noopener noreferrer">
                 <span className="hidden sm:inline">Book Consultation</span>
                 <span className="sm:hidden">Book Call</span>
               </a>
             </Button>
          </Card>
        </div>
      </section>

      {/* Demo + Lead Capture Section */}
      <section className="max-w-[1400px] mx-auto px-8 sm:px-12 lg:px-16 py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="aspect-video rounded-2xl overflow-hidden bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border-2 border-yellow-400/40 shadow-lg">
            <iframe className="w-full h-full" src="https://www.youtube.com/embed/VIDEO_ID" title="SEOInForce Demo – Instant Audits, Real Results" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
          </div>
          <div className="p-12 bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border-2 border-yellow-400/40 shadow-2xl rounded-3xl flex flex-col items-center">
            <h3 className="text-4xl md:text-5xl font-extrabold hero-gradient-text mb-8 text-center leading-tight">See SEOInForce in action – instant audits, real results.</h3>
            <p className="text-[#C0C0C0] mb-10 text-center text-xl md:text-2xl font-medium leading-relaxed">Enter your domain and get a free instant SEO audit report in under 60 seconds.</p>
            <div className="flex gap-3 w-full max-w-lg mx-auto mb-4">
              <Input 
                placeholder="Enter your domain (e.g., example.com)" 
                className="flex-1 text-white border-[#d9d9d9]/30 bg-gradient-to-b from-[#0b0b0b] via-[#1a1a1a] to-[#e5e5e5]/10 placeholder:text-[#C0C0C0] px-5 py-4 rounded-lg text-base"
              />
              <Button className="bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-slate-900 font-bold text-xl px-14 py-6 rounded-2xl shadow-2xl hover:shadow-yellow-400/50 hover:scale-[1.03] transition-all duration-500 border-2 border-yellow-400/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400/60 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-900">
                Analyze My Site
              </Button>
            </div>
            <div className="text-sm text-[#FFD700] font-medium text-center">No credit card required.</div>
          </div>
        </div>
      </section>

      {/* Why Choose SEOInForce */}
      <div className="max-w-[1400px] mx-auto px-8 sm:px-12 lg:px-16 py-32">
        <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold hero-gradient-text text-center mb-20">Why Choose SEOInForce – SEO Audit Tool UK</h2>
        <div className="grid md:grid-cols-4 gap-10">
          <Card className="p-12 bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border-2 border-yellow-400/30 shadow-2xl flex flex-col items-center text-center">
            <Sparkles className="h-16 w-16 text-yellow-400 mb-8" />
            <h3 className="text-3xl md:text-4xl font-extrabold hero-gradient-text mb-6">AI-Powered Insights</h3>
            <p className="text-[#C0C0C0] font-semibold text-lg md:text-xl leading-relaxed">Recommendations tailored to your site with our <span className='font-bold'>SEO Audit Tool UK</span>.</p>
          </Card>
          <Card className="p-12 bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border-2 border-yellow-400/30 shadow-2xl flex flex-col items-center text-center">
            <Trophy className="h-16 w-16 text-yellow-400 mb-8" />
            <h3 className="text-3xl md:text-4xl font-extrabold hero-gradient-text mb-6">Proven Performance</h3>
            <p className="text-[#C0C0C0] font-semibold text-lg md:text-xl leading-relaxed">Trusted by <span className='font-bold'>10,000+ websites globally</span>.</p>
          </Card>
          <Card className="p-12 bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border-2 border-yellow-400/30 shadow-2xl flex flex-col items-center text-center">
            <Shield className="h-16 w-16 text-yellow-400 mb-8" />
            <h3 className="text-3xl md:text-4xl font-extrabold hero-gradient-text mb-6">Agency-Ready</h3>
            <p className="text-[#C0C0C0] font-semibold text-lg md:text-xl leading-relaxed">White-label SEO reports and <span className='font-bold'>API access</span>.</p>
          </Card>
          <Card className="p-12 bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border-2 border-yellow-400/30 shadow-2xl flex flex-col items-center text-center">
            <Star className="h-16 w-16 text-yellow-400 mb-8" />
            <h3 className="text-3xl md:text-4xl font-extrabold hero-gradient-text mb-6">Elite Support</h3>
            <p className="text-[#C0C0C0] font-semibold text-lg md:text-xl leading-relaxed">Priority access to <span className='font-bold'>SEO strategists</span>.</p>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <section id="faq" className="max-w-[1400px] mx-auto px-8 sm:px-12 lg:px-16 py-32">
        <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold hero-gradient-text text-center mb-12">Frequently Asked Questions</h2>
        <p className="text-center text-[#C0C0C0] mb-16 text-xl md:text-2xl font-medium leading-relaxed max-w-4xl mx-auto">Everything you need to know about our SEO Audit Tool UK, White-Label SEO Reports for Agencies, and Competitor Analysis Software.</p>
        <div className="bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 border-2 border-yellow-400/30 shadow-lg rounded-2xl p-8 md:p-10">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="font-semibold hero-gradient-text text-xl py-5">What is included in the free SEO analysis?</AccordionTrigger>
              <AccordionContent className="text-[#C0C0C0] text-base leading-relaxed pt-2 pb-4">A lightweight technical audit, top issues, and quick wins to improve rankings. You'll also see opportunities surfaced by our Competitor Analysis Software.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="font-semibold hero-gradient-text text-xl py-5">Do you support white-label SEO reports for agencies?</AccordionTrigger>
              <AccordionContent className="text-[#C0C0C0] text-base leading-relaxed pt-2 pb-4">Yes. Our White-Label SEO Reports for Agencies include your branding, scheduled delivery, and export to PDF/CSV.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="font-semibold hero-gradient-text text-xl py-5">How accurate is the rank tracking?</AccordionTrigger>
              <AccordionContent className="text-[#C0C0C0] text-base leading-relaxed pt-2 pb-4">We track daily with location targeting options. The Growth and Empire plans expand keyword and location coverage.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger className="font-semibold hero-gradient-text text-xl py-5">Can I switch plans or cancel anytime?</AccordionTrigger>
              <AccordionContent className="text-[#C0C0C0] text-base leading-relaxed pt-2 pb-4">Absolutely. You can upgrade, downgrade, or cancel at any time from your dashboard.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger className="font-semibold hero-gradient-text text-xl py-5">Do you offer done-for-you SEO services?</AccordionTrigger>
              <AccordionContent className="text-[#C0C0C0] text-base leading-relaxed pt-2 pb-4">Yes. Our Task Force can execute technical fixes, content, and outreach — backed by our platform for measurable results.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6">
              <AccordionTrigger className="font-semibold hero-gradient-text text-xl py-5">Do you provide white-label access and API?</AccordionTrigger>
              <AccordionContent className="text-[#C0C0C0] text-base leading-relaxed pt-2 pb-4">Empire includes white-label SEO reports and API access so agencies can integrate SEOInForce into their client workflows.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-7">
              <AccordionTrigger className="font-semibold hero-gradient-text text-xl py-5">Is onboarding or migration support available?</AccordionTrigger>
              <AccordionContent className="text-[#C0C0C0] text-base leading-relaxed pt-2 pb-4">Yes. Our team will help migrate keywords, sites, and reports from tools like Ahrefs or SEMrush with minimal downtime.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        {/* FAQPage Schema */}
        <Script id="ld-faq" type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'What is included in the free SEO analysis?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'A lightweight technical audit, top issues, and quick wins to improve rankings, plus competitor insights.',
                },
              },
              {
                '@type': 'Question',
                name: 'Do you support white-label SEO reports for agencies?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. Our white-label SEO reports include your branding, scheduling, and export options (PDF/CSV).',
                },
              },
              {
                '@type': 'Question',
                name: 'How accurate is the rank tracking?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Daily tracking with location targeting. Higher plans offer expanded keyword and location coverage.',
                },
              },
              {
                '@type': 'Question',
                name: 'Can I switch plans or cancel anytime?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes, upgrade, downgrade, or cancel anytime from your dashboard.',
                },
              },
              {
                '@type': 'Question',
                name: 'Do you offer done-for-you SEO services?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. Our in-house Task Force executes technical fixes, content, and outreach using our platform.',
                },
              },
              {
                '@type': 'Question',
                name: 'Do you provide white-label access and API?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Empire includes white-label SEO reports and API access for agency workflows.',
                },
              },
              {
                '@type': 'Question',
                name: 'Is onboarding or migration support available?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. We help migrate from tools like Ahrefs or SEMrush with minimal downtime.',
                },
              },
            ],
          })}
        </Script>

        {/* Product/Service Schema with Offers */}
        <Script id="ld-product" type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: 'SEOInForce - SEO Audit Tool UK',
            description: 'Professional SEO audit tool, competitor analysis software, and white-label SEO reports for agencies. AI-powered insights trusted by 10,000+ businesses.',
            brand: {
              '@type': 'Brand',
              name: 'SEOInForce'
            },
            offers: [
              {
                '@type': 'Offer',
                name: 'Starter Plan',
                price: '49',
                priceCurrency: 'GBP',
                availability: 'https://schema.org/InStock',
                url: 'https://seoinforce.com#pricing',
                priceValidUntil: '2025-12-31',
                description: 'Perfect for small sites and freelancers. Track 100 keywords with monthly audits.'
              },
              {
                '@type': 'Offer',
                name: 'Growth Plan',
                price: '249',
                priceCurrency: 'GBP',
                availability: 'https://schema.org/InStock',
                url: 'https://seoinforce.com#pricing',
                priceValidUntil: '2025-12-31',
                description: 'For growing teams and agencies. Track 1,000 keywords with weekly competitor reports.'
              },
              {
                '@type': 'Offer',
                name: 'Empire Plan',
                price: '499',
                priceCurrency: 'GBP',
                availability: 'https://schema.org/InStock',
                url: 'https://seoinforce.com#pricing',
                priceValidUntil: '2025-12-31',
                description: 'For agencies and enterprises. Unlimited keyword tracking with white-label reports.'
              }
            ],
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '5',
              reviewCount: '10000',
              bestRating: '5',
              worstRating: '1'
            },
            review: [
              {
                '@type': 'Review',
                author: {
                  '@type': 'Person',
                  name: 'Jane Smith'
                },
                reviewRating: {
                  '@type': 'Rating',
                  ratingValue: '5',
                  bestRating: '5'
                },
                reviewBody: 'Our traffic grew 212% in 6 months thanks to SEOInForce.',
                datePublished: '2024-01-15'
              },
              {
                '@type': 'Review',
                author: {
                  '@type': 'Person',
                  name: 'David Jones'
                },
                reviewRating: {
                  '@type': 'Rating',
                  ratingValue: '5',
                  bestRating: '5'
                },
                reviewBody: 'The competitor insights gave us an instant edge.',
                datePublished: '2024-02-20'
              },
              {
                '@type': 'Review',
                author: {
                  '@type': 'Person',
                  name: 'Lucy Patel'
                },
                reviewRating: {
                  '@type': 'Rating',
                  ratingValue: '5',
                  bestRating: '5'
                },
                reviewBody: 'Best ROI we\'ve ever had in SEO — better than SEMrush or Ahrefs.',
                datePublished: '2024-03-10'
              }
            ]
          })}
        </Script>

        {/* Breadcrumb Schema */}
        <Script id="ld-breadcrumb" type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://seoinforce.com'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'SEO Tools',
                item: 'https://seoinforce.com#features'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: 'Pricing',
                item: 'https://seoinforce.com#pricing'
              }
            ]
          })}
        </Script>

        {/* Video Schema */}
        <Script id="ld-video" type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'VideoObject',
            name: 'SEOInForce Demo - Instant SEO Audits and Real Results',
            description: 'Watch how SEOInForce delivers instant SEO audits, competitor analysis, and actionable insights in under 60 seconds.',
            thumbnailUrl: 'https://seoinforce.com/logo.svg',
            uploadDate: '2024-01-01',
            contentUrl: 'https://www.youtube.com/embed/VIDEO_ID',
            embedUrl: 'https://www.youtube.com/embed/VIDEO_ID',
            duration: 'PT3M',
            publisher: {
              '@type': 'Organization',
              name: 'SEOInForce',
              logo: {
                '@type': 'ImageObject',
                url: 'https://seoinforce.com/logo.svg'
              }
            }
          })}
        </Script>

        {/* Service Schema for Done-For-You SEO */}
        <Script id="ld-service" type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            serviceType: 'SEO Services',
            provider: {
              '@type': 'Organization',
              name: 'SEOInForce'
            },
            areaServed: {
              '@type': 'Country',
              name: 'United Kingdom'
            },
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: 'Done-For-You SEO Services',
              itemListElement: [
                {
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Service',
                    name: 'On-Page SEO',
                    description: 'Technical fixes, structure optimization, and metadata improvements'
                  },
                  priceSpecification: {
                    '@type': 'PriceSpecification',
                    price: '497',
                    priceCurrency: 'GBP',
                    unitText: 'MONTH'
                  }
                },
                {
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Service',
                    name: 'Link Building',
                    description: 'Authority-driven outreach and white-hat link acquisition'
                  },
                  priceSpecification: {
                    '@type': 'PriceSpecification',
                    minPrice: '997',
                    maxPrice: '1497',
                    priceCurrency: 'GBP',
                    unitText: 'MONTH'
                  }
                },
                {
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Service',
                    name: 'Content Creation',
                    description: 'SEO-optimized content creation and strategy'
                  },
                  priceSpecification: {
                    '@type': 'PriceSpecification',
                    minPrice: '1497',
                    maxPrice: '2497',
                    priceCurrency: 'GBP',
                    unitText: 'MONTH'
                  }
                }
              ]
            }
          })}
        </Script>
      </section>

      {/* Final CTA Sticky Footer Banner */}
      <div className="fixed bottom-0 inset-x-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  </div>
      </div>

      {/* Footer */}
      <footer className="mt-24 border-t border-yellow-400/20 bg-gradient-to-b from-[#0b0b0b] via-[#181818] to-[#e5e5e5]/12">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
          <div className="grid md:grid-cols-5 gap-12">
            {/* Brand/Contact */}
            <div className="md:col-span-2 flex flex-col gap-6">
              <div className="flex items-center gap-3 sm:gap-4 mb-3">
                <span className="inline-flex items-center justify-center h-16 sm:h-20 md:h-24 w-16 sm:w-20 md:w-24 rounded-full ring-2 ring-yellow-400 bg-yellow-400 overflow-hidden">
                  <img src="/logo.svg" alt="SEOInForce shield logo" className="h-14 sm:h-18 md:h-22 w-14 sm:w-18 md:w-22 rounded-full object-cover" />
                </span>
                <span className="hero-gradient-text font-extrabold text-xl sm:text-2xl tracking-tight drop-shadow">SEO in Force</span>
              </div>
              <p className="text-[#C0C0C0] text-base leading-relaxed mb-2">Professional SEO tools and analytics to boost your website&apos;s visibility and performance.</p>
              <div className="flex flex-col gap-2 mt-3">
                <div className="flex items-center gap-3 text-[#FFD700] font-medium">
                  <Mail className="h-5 w-5" />
                  <span>contact@seoforce.com</span>
                </div>
                <div className="flex items-center gap-3 text-[#FFD700] font-medium">
                  <Phone className="h-5 w-5" />
                  <span>+1 (234) 567-890</span>
                </div>
              </div>
            </div>
            {/* Quick Links */}
            <div>
              <h4 className="text-xl font-bold hero-gradient-text mb-6">Quick Links</h4>
              <ul className="space-y-3 text-[#C0C0C0]">
                <li><a href="#" className="hover:text-[#FFD700] font-medium">Features</a></li>
                <li><a href="#" className="hover:text-[#FFD700] font-medium">Pricing</a></li>
                <li><a href="#" className="hover:text-[#FFD700] font-medium">Blog</a></li>
                <li><a href="#" className="hover:text-[#FFD700] font-medium">About</a></li>
                <li><a href="#" className="hover:text-[#FFD700] font-medium">Contact</a></li>
                <li><a href="#faq" className="hover:text-[#FFD700] font-medium">FAQ</a></li>
              </ul>
            </div>
            {/* Resources */}
            <div>
              <h4 className="text-xl font-bold hero-gradient-text mb-6">Resources</h4>
              <ul className="space-y-3 text-[#C0C0C0]">
                <li><a href="#" className="hover:text-[#FFD700] font-medium">Documentation</a></li>
                <li><a href="#" className="hover:text-[#FFD700] font-medium">API Reference</a></li>
                <li><a href="#" className="hover:text-[#FFD700] font-medium">Status Page</a></li>
                <li><a href="#" className="hover:text-[#FFD700] font-medium">Support Center</a></li>
                <li><a href="#" className="hover:text-[#FFD700] font-medium">Release Notes</a></li>
              </ul>
            </div>
            {/* Legal */}
            <div>
              <h4 className="text-xl font-bold hero-gradient-text mb-6">Legal</h4>
              <ul className="space-y-3 text-[#C0C0C0]">
                <li><a href="#" className="hover:text-[#FFD700] font-medium">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#FFD700] font-medium">Terms of Service</a></li>
                <li><a href="#" className="hover:text-[#FFD700] font-medium">GDPR</a></li>
                <li><a href="/admin/leads" className="hover:text-[#FFD700] font-medium">Admin Dashboard</a></li>
              </ul>
            </div>
            {/* Stay Updated */}
            <div>
              <h4 className="text-xl font-bold hero-gradient-text mb-6">Stay Updated</h4>
              <form className="space-y-5">
                <Input 
                  placeholder="Enter your email" 
                  className="text-white border-[#FFD700]/40 bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10 placeholder:text-[#FFD700] rounded-lg px-5 py-4 text-base"
                />
                <NextLink href="/audit/dashboard">
                  <Button className="w-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-slate-900 font-bold py-6 rounded-2xl shadow-[0_20px_60px_-15px_rgba(250,204,21,0.5)] text-xl hover:shadow-[0_25px_80px_-15px_rgba(250,204,21,0.7)] hover:scale-[1.03] transition-all duration-500 border-2 border-yellow-400/50">Analyze My Site</Button>
                </NextLink>
              </form>
              <div className="flex space-x-5 mt-8 justify-center">
                <Facebook className="h-5 w-5 text-[#FFD700] hover:text-white cursor-pointer" />
                <Twitter className="h-5 w-5 text-[#FFD700] hover:text-white cursor-pointer" />
                <Instagram className="h-5 w-5 text-[#FFD700] hover:text-white cursor-pointer" />
                <Linkedin className="h-5 w-5 text-[#FFD700] hover:text-white cursor-pointer" />
                <Github className="h-5 w-5 text-[#FFD700] hover:text-white cursor-pointer" />
                <Rss className="h-5 w-5 text-[#FFD700] hover:text-white cursor-pointer" />
              </div>
            </div>
          </div>
          <div className="mt-12 pt-10 border-t border-yellow-400/20 text-center text-[#C0C0C0]">
            <p className="text-base">© 2025 <span className="hero-gradient-text font-bold">SEO in Force</span>. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Floating Chatbot Launcher */}
      <button
        aria-label="Open chat assistant"
        onClick={() => setChatOpen((o) => !o)}
          className="fixed z-[80] bottom-4 sm:bottom-6 right-4 sm:right-6 h-12 sm:h-14 md:h-16 w-12 sm:w-14 md:w-16 rounded-full ring-2 ring-yellow-400 bg-yellow-400 shadow-xl flex items-center justify-center hover:shadow-2xl transition group overflow-hidden"
      >
          <img src="/logo.svg" alt="SEOInForce chat" className="h-10 sm:h-12 md:h-14 w-10 sm:w-12 md:w-14 rounded-full object-cover" />
      </button>

      {/* Chat Panel */}
      {chatOpen && (
        <div className="fixed z-[90] bottom-6 right-6 w-[340px] sm:w-[380px] rounded-2xl border-2 border-yellow-400/40 bg-[#181818] shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-yellow-400 bg-[#181818]">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center h-10 sm:h-12 md:h-14 w-10 sm:w-12 md:w-14 rounded-full ring-2 ring-yellow-400 bg-yellow-400 overflow-hidden">
                <img src="/logo.svg" alt="SEOInForce shield" className="h-8 sm:h-10 md:h-12 w-8 sm:w-10 md:w-12 rounded-full object-cover" />
              </span>
              <span className="font-extrabold text-sm sm:text-base md:text-lg tracking-tight text-white">SEOInForce Assistant</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                aria-label="Clear chat" 
                onClick={() => setChatMessages([{
                  id: 1,
                  type: 'assistant',
                  content: 'Hi! Need a free SEO audit or help planning your rankings?',
                  timestamp: new Date()
                }])}
                className="text-[#C0C0C0] hover:text-white text-xs px-2 py-1 rounded"
                title="Clear conversation"
              >
                Clear
              </button>
              <button aria-label="Close chat" onClick={() => setChatOpen(false)} className="text-[#FFD700] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="max-h-72 overflow-auto p-4 space-y-3">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`text-base rounded-xl p-4 w-fit max-w-[85%] ${
                  message.type === 'assistant'
                    ? 'font-medium hero-gradient-text bg-black/90 border-2 border-yellow-400/20 shadow'
                    : 'text-[#FFD700] bg-[#232323] border border-yellow-400/20 ml-auto font-semibold'
                }`}
              >
                <div className="whitespace-pre-line">{message.content}</div>
                <div className="text-xs text-[#C0C0C0] mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="text-base font-medium hero-gradient-text bg-black/90 border-2 border-yellow-400/20 rounded-xl p-4 w-fit max-w-[85%] shadow">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span>Assistant is typing...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          
          {/* Data Collection Form */}
          {showDataForm && (
            <div className="p-4 border-t border-[#d9d9d9]/30 bg-gradient-to-b from-[#181818] via-[#232323] to-[#e5e5e5]/10">
              <div className="mb-3">
                <h4 className="text-sm font-bold hero-gradient-text mb-2">
                  {formType === 'audit' ? 'Free SEO Audit Request' : 'Book Your Consultation'}
                </h4>
                <p className="text-xs text-[#C0C0C0]">
                  {formType === 'audit' 
                    ? 'Please provide your details to receive your free SEO audit report.'
                    : 'Please provide your details to access our booking calendar.'
                  }
                </p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={userData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full bg-gradient-to-b from-[#0b0b0b] via-[#1a1a1a] to-[#e5e5e5]/10 border border-[#d9d9d9]/30 text-white placeholder:text-[#C0C0C0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                  />
                  {formErrors.name && <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>}
                </div>
                
                <div>
                  <input
                    type="email"
                    placeholder="Email Address *"
                    value={userData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full bg-gradient-to-b from-[#0b0b0b] via-[#1a1a1a] to-[#e5e5e5]/10 border border-[#d9d9d9]/30 text-white placeholder:text-[#C0C0C0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                  />
                  {formErrors.email && <p className="text-xs text-red-400 mt-1">{formErrors.email}</p>}
                </div>
                
                <div>
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    value={userData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full bg-gradient-to-b from-[#0b0b0b] via-[#1a1a1a] to-[#e5e5e5]/10 border border-[#d9d9d9]/30 text-white placeholder:text-[#C0C0C0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                  />
                  {formErrors.phone && <p className="text-xs text-red-400 mt-1">{formErrors.phone}</p>}
                </div>
                
                {formType === 'audit' && (
                  <div>
                    <input
                      type="text"
                      placeholder="Website Domain (e.g., example.com) *"
                      value={userData.domain}
                      onChange={(e) => handleInputChange('domain', e.target.value)}
                      className="w-full bg-gradient-to-b from-[#0b0b0b] via-[#1a1a1a] to-[#e5e5e5]/10 border border-[#d9d9d9]/30 text-white placeholder:text-[#C0C0C0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                    />
                    {formErrors.domain && <p className="text-xs text-red-400 mt-1">{formErrors.domain}</p>}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button
                    onClick={handleFormSubmit}
                    className="flex-1 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-slate-900 font-bold py-4 px-6 rounded-2xl text-lg shadow-[0_20px_60px_-15px_rgba(250,204,21,0.5)] hover:shadow-[0_25px_80px_-15px_rgba(250,204,21,0.7)] hover:scale-[1.03] transition-all duration-500 border-2 border-yellow-400/50"
                  >
                    {formType === 'audit' ? 'Get Free Audit' : 'Book Consultation'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDataForm(false);
                      setFormType(null);
                      setUserData({ name: '', email: '', phone: '', domain: '' });
                      setFormErrors({});
                    }}
                    className="px-5 py-3 bg-[#232323] text-[#C0C0C0] rounded-xl text-base border border-[#C0C0C0]/30 hover:bg-[#2a2a2a] hover:border-[#C0C0C0]/50 transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="p-3 border-t border-[#d9d9d9]/30 bg-black/20">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isTyping}
                className="flex-1 bg-gradient-to-b from-[#0b0b0b] via-[#1a1a1a] to-[#e5e5e5]/10 border border-[#d9d9d9]/30 text-white placeholder:text-[#C0C0C0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 disabled:opacity-50"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!userInput.trim() || isTyping}
                className="px-5 py-4 rounded-2xl bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-slate-900 hover:shadow-[0_20px_40px_-15px_rgba(250,204,21,0.6)] hover:scale-[1.03] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 shadow-lg border-2 border-yellow-400/50"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                onClick={() => {
                  setFormType('audit');
                  setShowDataForm(true);
                  const auditMessage = {
                    id: Date.now(),
                    type: 'user',
                    content: 'Run a free SEO audit',
                    timestamp: new Date()
                  };
                  setChatMessages(prev => [...prev, auditMessage]);
                }}
                className="text-xs px-3 py-2 bg-yellow-400/20 text-yellow-400 rounded-full hover:bg-yellow-400/30 hover:scale-105 transition-all duration-300 font-medium shadow-sm"
              >
                Free Audit
              </button>
              <button
                onClick={() => setUserInput("What are your pricing plans?")}
                className="text-xs px-3 py-2 bg-yellow-400/20 text-yellow-400 rounded-full hover:bg-yellow-400/30 hover:scale-105 transition-all duration-300 font-medium shadow-sm"
              >
                Pricing
              </button>
              <button
                onClick={() => setUserInput("What features do you offer?")}
                className="text-xs px-3 py-2 bg-yellow-400/20 text-yellow-400 rounded-full hover:bg-yellow-400/30 hover:scale-105 transition-all duration-300 font-medium shadow-sm"
              >
                Features
              </button>
              <button
                onClick={() => {
                  setFormType('booking');
                  setShowDataForm(true);
                  const bookingMessage = {
                    id: Date.now(),
                    type: 'user',
                    content: 'Book a consultation',
                    timestamp: new Date()
                  };
                  setChatMessages(prev => [...prev, bookingMessage]);
                }}
                className="text-xs px-3 py-2 bg-yellow-400/20 text-yellow-400 rounded-full hover:bg-yellow-400/30 hover:scale-105 transition-all duration-300 font-medium shadow-sm"
              >
                Book Call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}