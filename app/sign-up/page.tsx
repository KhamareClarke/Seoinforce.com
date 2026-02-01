'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Mail, Lock, User } from 'lucide-react';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validation
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          fullName: fullName || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create account. Please try again.');
        setLoading(false);
        return;
      }

      // Success - email verification required
      setSuccess(true);
      setError(null);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFullName('');
      setLoading(false);
    } catch (err) {
      console.error('Sign up error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full ring-[3px] ring-yellow-400/80 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 overflow-hidden shadow-[0_0_15px_rgba(250,204,21,0.5)] mb-4">
            <img src="/logo.svg" alt="SEOInForce" className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold hero-gradient-text mb-2">Create Account</h1>
          <p className="text-sm sm:text-base text-[#C0C0C0] px-4">Join SEOInForce and start optimizing your SEO</p>
        </div>

        <div className="bg-gradient-to-b from-black/50 via-black/30 to-transparent border border-yellow-400/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleSignUp} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && !error && (
              <div className="bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg text-sm">
                Account created successfully! Please check your email to verify your account before signing in.
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-[#FFD700] mb-2">
                Full Name (Optional)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400/60" />
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="pl-10 bg-black/50 border-yellow-400/30 text-white placeholder:text-[#C0C0C0] focus:border-yellow-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#FFD700] mb-2">
                Email Address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400/60" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
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
                  minLength={6}
                  className="pl-10 bg-black/50 border-yellow-400/30 text-white placeholder:text-[#C0C0C0] focus:border-yellow-400"
                />
              </div>
              <p className="text-xs text-[#C0C0C0] mt-1">Must be at least 6 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#FFD700] mb-2">
                Confirm Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400/60" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="pl-10 bg-black/50 border-yellow-400/30 text-white placeholder:text-[#C0C0C0] focus:border-yellow-400"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !email || !password || password !== confirmPassword}
              className="w-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-black font-extrabold py-4 sm:py-6 text-base sm:text-lg rounded-xl shadow-[0_15px_40px_-10px_rgba(250,204,21,0.4)] hover:shadow-[0_20px_50px_-12px_rgba(250,204,21,0.6)] hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-yellow-400/20"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gradient-to-b from-black/50 via-black/30 to-transparent px-2 text-[#C0C0C0]">Or</span>
              </div>
            </div>
            <div className="mt-6 text-center">
              <p className="text-[#C0C0C0] text-sm">
                Already have an account?{' '}
                <Link href="/sign-in" className="text-yellow-400 hover:text-yellow-300 font-semibold underline">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-[#C0C0C0] text-sm mt-6">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
