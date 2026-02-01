'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    // Call the verification API
    const verifyEmail = async () => {
      try {
        setStatus('loading');
        setMessage('Verifying your email...');

        const response = await fetch(`/api/auth/verify-email?token=${token}`, {
          method: 'GET',
        });

        const data = await response.json();

        if (!response.ok) {
          // Handle different error codes
          if (data.code === 'invalid_token') {
            setStatus('error');
            setMessage('Invalid verification link. Please request a new one.');
          } else if (data.code === 'token_expired') {
            setStatus('error');
            setMessage('Verification link has expired. Please sign up again.');
          } else if (data.code === 'verification_failed') {
            setStatus('error');
            setMessage('Email verification failed. Please try again.');
          } else {
            setStatus('error');
            setMessage(data.error || 'An error occurred during verification.');
          }
          return;
        }

        // Success
        if (data.success) {
          if (data.code === 'already_verified') {
            setStatus('success');
            setMessage('Your email is already verified. You can sign in now.');
            setTimeout(() => {
              router.push('/sign-in?message=already_verified');
            }, 2000);
          } else {
            setStatus('success');
            setMessage(data.message || 'Your email has been verified successfully!');
            setTimeout(() => {
              router.push('/sign-in?message=email_verified');
            }, 2000);
          }
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('An error occurred during verification. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full ring-[3px] ring-yellow-400/80 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 overflow-hidden shadow-[0_0_15px_rgba(250,204,21,0.5)] mb-4">
            <img src="/logo.svg" alt="SEOInForce" className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold hero-gradient-text mb-2">Email Verification</h1>
        </div>

        <div className="bg-gradient-to-b from-black/50 via-black/30 to-transparent border border-yellow-400/20 rounded-2xl p-6 sm:p-8 shadow-2xl text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-400 mx-auto mb-4 animate-spin" />
              <p className="text-sm sm:text-base text-[#C0C0C0] mb-6 px-4">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-400 mx-auto mb-4" />
              <p className="text-sm sm:text-base text-green-400 mb-6 px-4">{message || 'Your email has been verified successfully!'}</p>
              <Button
                onClick={() => router.push('/sign-in')}
                className="w-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-black font-extrabold py-4 sm:py-6 text-base sm:text-lg rounded-xl"
              >
                Go to Sign In
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-400 mx-auto mb-4" />
              <p className="text-sm sm:text-base text-red-400 mb-6 px-4">{message || 'Verification failed. The link may be invalid or expired.'}</p>
              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/sign-in')}
                  className="w-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-black font-extrabold py-4 sm:py-6 text-base sm:text-lg rounded-xl"
                >
                  Go to Sign In
                </Button>
                <Link href="/sign-up" className="block text-yellow-400 hover:text-yellow-300 text-sm">
                  Create a new account
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
