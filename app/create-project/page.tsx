'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createSupabaseClient } from '@/lib/supabase/client';
import { getCurrentUserClient } from '@/lib/auth/client';
import { Globe, ArrowRight, Loader2 } from 'lucide-react';

export default function CreateProjectPage() {
  const router = useRouter();
  const supabase = createSupabaseClient();
  
  const [projectName, setProjectName] = useState('');
  const [domain, setDomain] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const user = await getCurrentUserClient();
      if (!user) {
        router.push('/sign-in');
        return;
      }
      setUser(user);
    };
    getUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!domain.trim()) {
      setError('Please enter a domain');
      setLoading(false);
      return;
    }

    try {
      // Normalize domain
      const normalizedDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

      // Create project
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: normalizedDomain,
          name: projectName || normalizedDomain,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }

      // Update user profile with company name if provided
      if (companyName) {
        await supabase
          .from('profiles')
          .update({ company_name: companyName })
          .eq('id', user.id);
      }

      // Redirect to dashboard
      router.push('/audit/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full ring-[3px] ring-yellow-400/80 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 overflow-hidden shadow-[0_0_15px_rgba(250,204,21,0.5)] mb-4">
            <img src="/logo.svg" alt="SEOInForce" className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold hero-gradient-text mb-2">Create Your First Project</h1>
          <p className="text-sm sm:text-base text-[#C0C0C0] px-4">Let's get started by setting up your website project</p>
        </div>

        <div className="bg-gradient-to-b from-black/50 via-black/30 to-transparent border border-yellow-400/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="domain" className="block text-sm font-semibold text-[#FFD700] mb-2">
                Website Domain <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400/60" />
                <Input
                  id="domain"
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="example.com"
                  required
                  className="pl-10 bg-black/50 border-yellow-400/30 text-white placeholder:text-[#C0C0C0] focus:border-yellow-400"
                />
              </div>
              <p className="text-xs text-[#C0C0C0] mt-1">Enter your website domain (e.g., example.com)</p>
            </div>

            <div>
              <label htmlFor="projectName" className="block text-sm font-semibold text-[#FFD700] mb-2">
                Project Name
              </label>
              <Input
                id="projectName"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My SEO Project"
                className="bg-black/50 border-yellow-400/30 text-white placeholder:text-[#C0C0C0] focus:border-yellow-400"
              />
              <p className="text-xs text-[#C0C0C0] mt-1">Give your project a friendly name</p>
            </div>

            <div>
              <label htmlFor="companyName" className="block text-sm font-semibold text-[#FFD700] mb-2">
                Company Name
              </label>
              <Input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your Company"
                className="bg-black/50 border-yellow-400/30 text-white placeholder:text-[#C0C0C0] focus:border-yellow-400"
              />
            </div>

            <div>
              <label htmlFor="businessType" className="block text-sm font-semibold text-[#FFD700] mb-2">
                Business Type
              </label>
              <select
                id="businessType"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border border-yellow-400/30 text-white rounded-lg focus:border-yellow-400 focus:outline-none"
              >
                <option value="">Select business type</option>
                <option value="ecommerce">E-commerce</option>
                <option value="saas">SaaS</option>
                <option value="agency">Agency</option>
                <option value="local">Local Business</option>
                <option value="blog">Blog/Content</option>
                <option value="other">Other</option>
              </select>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-black font-extrabold py-4 sm:py-6 text-base sm:text-lg rounded-xl shadow-[0_15px_40px_-10px_rgba(250,204,21,0.4)] hover:shadow-[0_20px_50px_-12px_rgba(250,204,21,0.6)] hover:scale-[1.02] transition-all duration-300 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  <span className="text-sm sm:text-base">Creating Project...</span>
                </>
              ) : (
                <>
                  <span className="text-sm sm:text-base">Create Project & Continue</span>
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
