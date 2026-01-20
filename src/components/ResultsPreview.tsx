'use client';

import { useState } from 'react';
import { MousePointerClick, CheckCircle, DollarSign, Lock, Check, ArrowRight } from 'lucide-react';
import { formatNumber, formatCurrency, type EarningsCalculation } from '@/lib/calculations';

interface ResultsPreviewProps {
  calculation: EarningsCalculation;
  onEmailSubmit: (email: string) => Promise<void>;
}

export function ResultsPreview({ calculation, onEmailSubmit }: ResultsPreviewProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await onEmailSubmit(email);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto animate-slide-up">
      {/* Progress indicator */}
      <div className="text-center mb-8">
        <span className="text-sm text-gray-500">Step 2 of 2</span>
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className="w-8 h-1 bg-green-500 rounded-full"></div>
          <div className="w-8 h-1 bg-green-500 rounded-full"></div>
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-full text-sm font-medium mb-4">
          <Check className="w-4 h-4" />
          Estimate Complete
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Your Earnings Potential
        </h2>
        <p className="text-gray-600">
          Based on {formatNumber(calculation.monthlyClicks)} monthly card clicks
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Monthly Clicks */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-50 flex items-center justify-center">
            <MousePointerClick className="w-6 h-6 text-gray-600" />
          </div>
          <p className="text-sm text-gray-500 mb-1">Monthly Clicks</p>
          <p className="text-3xl font-bold text-gray-900">
            {formatNumber(calculation.monthlyClicks)}
          </p>
        </div>

        {/* Estimated Approvals */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-50 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-gray-600" />
          </div>
          <p className="text-sm text-gray-500 mb-1">Est. Approvals</p>
          <p className="text-3xl font-bold text-gray-900">
            {calculation.monthlyApprovalsLow} - {calculation.monthlyApprovalsHigh}
          </p>
          <p className="text-xs text-gray-400">per month</p>
        </div>

        {/* Annual Earnings (Locked with blurred number) */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center relative overflow-hidden">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-50 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-sm text-gray-500 mb-2">Annual Earnings</p>
          
          {/* Blurred earnings with lock overlay */}
          <div className="relative">
            <span className="text-3xl font-bold text-gray-900 blur-md select-none">
              {formatCurrency(calculation.realistic.annualEarnings)}
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-green-500 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 text-sm font-medium">
                <Lock className="w-4 h-4" />
                Locked
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Email gate section */}
      <div className="relative bg-gray-50 rounded-2xl border border-gray-200 p-8">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white border border-gray-200 flex items-center justify-center">
          <Lock className="w-6 h-6 text-gray-600" />
        </div>

        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Unlock Your Full Report
          </h3>
          
          <p className="text-gray-600 mb-2">
            See your projected{' '}
            <span className="font-semibold text-green-600">
              {formatCurrency(calculation.conservative.annualEarnings)} – {formatCurrency(calculation.optimistic.annualEarnings)}
            </span>
            {' '}annual earnings
          </p>
          
          <p className="text-sm text-gray-500">
            Plus industry comparison and personalized recommendations
          </p>
        </div>

        {/* What's included */}
        <div className="flex flex-wrap justify-center gap-4 mb-6 text-sm text-gray-600">
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-green-500" />
            3 earnings scenarios
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-green-500" />
            Industry rate comparison
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-green-500" />
            Channel-specific tips
          </span>
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="you@example.com"
              className={`
                flex-1 px-4 py-3.5 text-base
                bg-white border-2 rounded-lg
                text-gray-900 placeholder-gray-400
                transition-all duration-200
                ${error 
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-100' 
                  : 'border-gray-200 focus:border-green-500 focus:ring-green-100'
                }
                focus:ring-4 focus:outline-none
              `}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3.5 text-base font-medium text-white rounded-lg transition-all duration-200 bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Unlocking...
                </>
              ) : (
                <>
                  Get My Full Report
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
          
          {error && (
            <p className="mt-2 text-sm text-red-500">
              {error}
            </p>
          )}
        </form>

        <p className="mt-4 text-center text-xs text-gray-400">
          We respect your privacy. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}
