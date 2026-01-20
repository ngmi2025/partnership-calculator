'use client';

import { useState } from 'react';
import { Mail, Lock, Check, X, ArrowRight } from 'lucide-react';
import { formatCurrency, type EarningsCalculation } from '@/lib/calculations';

interface EmailGateProps {
  calculation: EarningsCalculation;
  onSubmit: (email: string) => Promise<void>;
  onClose: () => void;
}

export function EmailGate({ calculation, onSubmit, onClose }: EmailGateProps) {
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
      await onSubmit(email);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const minEarnings = calculation.conservative.annualEarnings;
  const maxEarnings = calculation.optimistic.annualEarnings;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-8 animate-slide-up">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-50 flex items-center justify-center">
          <Mail className="w-8 h-8 text-green-600" />
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Unlock Your Full Report
          </h3>
          <p className="text-gray-600">
            Enter your email to see your detailed earnings breakdown and industry comparison.
          </p>
          
          {/* Earnings teaser */}
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">
              See your projected{' '}
              <span className="font-semibold text-green-600">
                {formatCurrency(minEarnings)} – {formatCurrency(maxEarnings)}
              </span>
              {' '}annual earnings
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="you@example.com"
              className={`
                w-full px-4 py-3.5 text-base
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
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-500">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-4 text-lg font-medium text-white rounded-lg transition-all duration-200 bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Unlocking Report...
              </>
            ) : (
              <>
                Get My Full Report
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Trust signals */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              Secure
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              No Spam
            </span>
            <span className="flex items-center gap-1">
              <X className="w-3.5 h-3.5" />
              Unsubscribe Anytime
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
