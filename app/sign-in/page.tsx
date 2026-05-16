'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Mail, Lock } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const message = searchParams.get('message');
    const errorParam = searchParams.get('error');

    if (message === 'email_verified') {
      setSuccess('Your email has been verified! You can now sign in.');
    } else if (message === 'already_verified') {
      setSuccess('Your email is already verified. You can sign in.');
    } else if (errorParam === 'invalid_token') {
      setError('Invalid verification link. Please request a new one.');
    } else if (errorParam === 'token_expired') {
      setError('Verification link has expired. Use Resend below or sign up again.');
    } else if (errorParam === 'verification_failed') {
      setError('Email verification failed. Please try again.');
    }
  }, [searchParams]);

  const handleResendVerification = async () => {
    const target = email.trim();
    if (!target) {
      setResendMessage('Enter your email above, then click Resend.');
      return;
    }
    setResendLoading(true);
    setResendMessage(null);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: target }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResendMessage(data.error || 'Could not resend verification email.');
      } else {
        setResendMessage(data.message || 'Verification email sent. Check spam folder.');
      }
    } catch {
      setResendMessage('Could not resend. Try again in a minute.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setNeedsVerification(false);
    setResendMessage(null);

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      let data: {
        error?: string;
        redirectTo?: string;
        user?: { account_type?: string; agency_id?: string | null };
      } = {};

      try {
        data = await response.json();
      } catch {
        setError('Invalid response from server. Try again.');
        return;
      }

      if (!response.ok) {
        const msg = data.error || 'Invalid email or password';
        setError(msg);
        setNeedsVerification(msg.toLowerCase().includes('verify'));
        return;
      }

      const redirect =
        data.redirectTo ||
        (data.user?.account_type === 'brand'
          ? '/agency/dashboard'
          : data.user?.agency_id
            ? '/client/dashboard'
            : '/audit/dashboard');

      window.location.href = redirect;
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
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
          <h1 className="text-3xl sm:text-4xl font-extrabold hero-gradient-text mb-2">Welcome Back</h1>
          <p className="text-sm sm:text-base text-[#C0C0C0] px-4">Sign in to access your SEO dashboard</p>
        </div>

        <div className="bg-gradient-to-b from-black/50 via-black/30 to-transparent border border-yellow-400/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleSignIn} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm space-y-2">
                <p>{error}</p>
                {needsVerification && (
                  <button
                    type="button"
                    onClick={() => void handleResendVerification()}
                    disabled={resendLoading}
                    className="text-yellow-400 hover:text-yellow-300 font-semibold underline disabled:opacity-50"
                  >
                    {resendLoading ? 'Sending…' : 'Resend verification email'}
                  </button>
                )}
                {resendMessage && <p className="text-[#C0C0C0] text-xs">{resendMessage}</p>}
              </div>
            )}

            {success && (
              <div className="bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#FFD700] mb-2">
                Email Address
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
                Password
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
              disabled={loading}
              className="w-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-black font-extrabold py-4 sm:py-6 text-base sm:text-lg rounded-xl shadow-[0_15px_40px_-10px_rgba(250,204,21,0.4)] hover:shadow-[0_20px_50px_-12px_rgba(250,204,21,0.6)] hover:scale-[1.02] transition-all duration-300 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-yellow-400/20"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gradient-to-b from-black/50 via-black/30 to-transparent px-2 text-[#C0C0C0]">
                  Or
                </span>
              </div>
            </div>
            <div className="mt-6 text-center">
              <p className="text-[#C0C0C0] text-sm">
                Don&apos;t have an account?{' '}
                <Link href="/sign-up" className="text-yellow-400 hover:text-yellow-300 font-semibold underline">
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-[#C0C0C0] text-sm mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <SignInForm />
    </Suspense>
  );
}
