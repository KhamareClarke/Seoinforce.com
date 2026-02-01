'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Mail, Lock, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    try {
      // Sign in using custom auth API
      const signInResponse = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!signInResponse.ok) {
        const errorData = await signInResponse.json();
        setError(errorData.error || 'Invalid email or password');
        setLoading(false);
        return;
      }

      // Wait a moment for session to be fully established
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Check if user is admin
      const userResponse = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (!userResponse.ok) {
        setError('Failed to verify admin access');
        setLoading(false);
        return;
      }

      const userData = await userResponse.json();
      const user = userData.user;

      if (!user || !user.is_admin) {
        // Sign out the user
        await fetch('/api/auth/signout', {
          method: 'POST',
          credentials: 'include',
        });
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }

      // Admin confirmed, redirect to admin dashboard
      // Use window.location to ensure a full page reload and avoid any redirect loops
      window.location.href = '/admin';
      return; // Prevent any further execution
    } catch (err) {
      console.error('Admin sign in error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full ring-[3px] ring-yellow-400/80 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 overflow-hidden shadow-[0_0_15px_rgba(250,204,21,0.5)] mb-4">
            <Shield className="h-10 w-10 text-black" />
          </div>
          <h1 className="text-4xl font-extrabold hero-gradient-text mb-2">Admin Login</h1>
          <p className="text-[#C0C0C0]">Sign in to access the admin dashboard</p>
        </div>

        <div className="bg-gradient-to-b from-black/50 via-black/30 to-transparent border border-yellow-400/20 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSignIn} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#FFD700] mb-2">
                Admin Email <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400/60" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@seoinforce.com"
                  required
                  className="pl-10 bg-black/50 border-yellow-400/30 text-white placeholder:text-[#C0C0C0] focus:border-yellow-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[#FFD700] mb-2">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400/60" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pl-10 bg-black/50 border-yellow-400/30 text-white placeholder:text-[#C0C0C0] focus:border-yellow-400"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-black font-extrabold py-6 text-lg rounded-xl shadow-[0_15px_40px_-10px_rgba(250,204,21,0.4)] hover:shadow-[0_20px_50px_-12px_rgba(250,204,21,0.6)] hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In to Admin Dashboard'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#C0C0C0] text-sm">
              Regular user?{' '}
              <a href="/sign-in" className="text-yellow-400 hover:text-yellow-300 font-semibold underline">
                Sign in here
              </a>
            </p>
          </div>
        </div>

        <p className="text-center text-[#C0C0C0] text-xs mt-6">
          Admin access is restricted to authorized personnel only
        </p>
      </div>
    </div>
  );
}
