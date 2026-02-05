'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Loader2, Check } from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: (planType: string) => void;
  userProfile?: {
    account_type?: 'personal' | 'brand';
    brand_name?: string | null;
  } | null;
}

const personalPlans = [
  {
    name: 'Starter',
    price: '£49',
    desc: 'Small Sites & Freelancers',
    features: 'Track 100 keywords with monthly audits',
    planType: 'starter',
    featured: false,
  },
  {
    name: 'Growth',
    price: '£249',
    desc: 'Growing Teams & Agencies',
    features: 'Track 1,000 keywords with weekly competitor reports',
    planType: 'growth',
    featured: true,
  },
  {
    name: 'Empire',
    price: '£499',
    desc: 'Agencies & Enterprises',
    features: 'Unlimited keyword tracking with white-label reports',
    planType: 'empire',
    featured: false,
  },
];

const brandPlan = {
  name: 'Brand',
  price: '£99',
  desc: 'For Brands & Businesses',
  features: 'Unlimited audits with brand name on reports',
  planType: 'brand',
  featured: true,
};

export default function PricingModal({ isOpen, onClose, onSubscribe, userProfile }: PricingModalProps) {
  const isBrandAccount = userProfile?.account_type === 'brand';
  const plans = isBrandAccount ? [brandPlan] : personalPlans;
  const [loading, setLoading] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubscribe = async (planType: string) => {
    setLoading(planType);
    try {
      // Call Stripe checkout API
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error instanceof Error ? error.message : 'Failed to start checkout');
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl mx-4 max-h-[90vh] overflow-y-auto bg-gradient-to-b from-black/90 via-black/80 to-black/90 border border-yellow-400/30 rounded-2xl shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#C0C0C0] hover:text-white transition z-10"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-extrabold hero-gradient-text mb-4">
              Choose Your Plan
            </h2>
            <p className="text-[#C0C0C0] text-lg">
              Upgrade to unlock unlimited website audits and advanced features
            </p>
          </div>

          <div className={`grid gap-6 mb-8 ${isBrandAccount ? 'md:grid-cols-1 max-w-md mx-auto' : 'md:grid-cols-3'}`}>
            {plans.map((plan) => (
              <div
                key={plan.planType}
                className={`relative p-6 rounded-2xl bg-gradient-to-b from-black/50 via-black/30 to-transparent border transition-all duration-500 hover:shadow-[0_15px_45px_-5px_rgba(250,204,21,0.3)] ${
                  plan.featured
                    ? 'border-yellow-400 scale-105 shadow-[0_15px_45px_-5px_rgba(250,204,21,0.3)]'
                    : 'border-yellow-400/10 hover:border-yellow-400/20'
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 text-sm font-black rounded-full bg-gradient-to-r from-yellow-400 via-[#ffd700] to-yellow-400 text-black shadow-lg">
                    RECOMMENDED
                  </div>
                )}
                <h3 className="text-2xl font-black text-white mb-2">{plan.name}</h3>
                <p className="text-[#C0C0C0] mb-4 text-sm font-medium">{plan.desc}</p>
                <p className="text-4xl font-black text-[#FFD700] mb-2">
                  {plan.price}
                  <span className="text-lg text-[#C0C0C0]">/mo</span>
                </p>
                <p className="text-[#C0C0C0] text-sm mb-6 leading-relaxed">{plan.features}</p>
                <Button
                  onClick={() => handleSubscribe(plan.planType)}
                  disabled={loading === plan.planType}
                  className="w-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-black font-extrabold py-3 rounded-xl shadow-[0_15px_40px_-10px_rgba(250,204,21,0.4)] hover:shadow-[0_20px_50px_-12px_rgba(250,204,21,0.6)] hover:scale-[1.02] transition-all duration-300 disabled:opacity-50"
                >
                  {loading === plan.planType ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Get Started'
                  )}
                </Button>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-[#C0C0C0] text-sm">
              💳 Secure payment powered by Stripe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
