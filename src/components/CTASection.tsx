'use client';

import { formatCurrency, getSmartCTAText } from '@/lib/calculations';

interface CTASectionProps {
  monthlyEarnings: number;
}

export function CTASection({ monthlyEarnings }: CTASectionProps) {
  const ctaHeadline = getSmartCTAText(monthlyEarnings);
  
  return (
    <div className="bg-gradient-to-br from-[var(--primary)]/5 via-white to-[var(--success)]/5 rounded-2xl border border-[var(--border)] p-8 md:p-10">
      <div className="max-w-2xl mx-auto text-center">
        {/* Header */}
        <div className="mb-6">
          <span className="inline-block px-4 py-1.5 bg-[var(--success)]/10 text-[var(--success-dark)] text-sm font-semibold rounded-full mb-4">
            🚀 Start Earning Today
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-3">
            {ctaHeadline}
          </h2>
          <p className="text-lg text-[var(--text-secondary)]">
            Join Upgraded Points&apos; partner program and start monetizing your content with industry-leading commission rates.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-left">
          <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-[var(--border)]">
            <div className="w-8 h-8 rounded-full bg-[var(--success)]/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-[var(--success)]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">65-70% Commission</p>
              <p className="text-sm text-[var(--text-secondary)]">Industry-leading rates</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-[var(--border)]">
            <div className="w-8 h-8 rounded-full bg-[var(--success)]/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-[var(--success)]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">Premium Cards</p>
              <p className="text-sm text-[var(--text-secondary)]">Chase, Amex, Capital One</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-[var(--border)]">
            <div className="w-8 h-8 rounded-full bg-[var(--success)]/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-[var(--success)]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">Real-Time Tracking</p>
              <p className="text-sm text-[var(--text-secondary)]">Full dashboard access</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-[var(--border)]">
            <div className="w-8 h-8 rounded-full bg-[var(--success)]/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-[var(--success)]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">No Minimums</p>
              <p className="text-sm text-[var(--text-secondary)]">Start immediately</p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://upgradedpoints.com/partners/apply"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 text-lg font-semibold text-white rounded-xl transition-all duration-200 gradient-primary hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/30 flex items-center justify-center gap-2"
          >
            Apply to Partner Program
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
          
          <a
            href="https://calendly.com/upgradedpoints/partner-call"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 text-lg font-semibold text-[var(--primary)] rounded-xl transition-all duration-200 bg-white border-2 border-[var(--primary)] hover:bg-[var(--primary)]/5 focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/20 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Book a Call
          </a>
        </div>

        {/* Trust text */}
        <p className="mt-6 text-sm text-[var(--text-muted)]">
          Join 500+ content creators already earning with Upgraded Points
        </p>
      </div>
    </div>
  );
}
