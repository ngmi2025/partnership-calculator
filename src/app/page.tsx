'use client';

import { useState, useCallback, useRef } from 'react';
import { Check, Mail, Lock, ArrowRight, Calendar } from 'lucide-react';
import { HowItWorks } from '@/components';
import { calculateEarnings, getClickRangeById, CLICK_RANGES, formatCurrency, getSmartCTAText, type EarningsCalculation } from '@/lib/calculations';
import { ClickInput } from '@/components/ClickInput';
import { EarningsTable } from '@/components/EarningsTable';

type AppStep = 'landing' | 'input' | 'email' | 'report';

export default function Home() {
  const [step, setStep] = useState<AppStep>('landing');
  const [calculation, setCalculation] = useState<EarningsCalculation | null>(null);
  const [selectedRange, setSelectedRange] = useState<string | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  
  const calculatorRef = useRef<HTMLDivElement>(null);

  const handleStartCalculator = useCallback(() => {
    setStep('input');
    setTimeout(() => {
      calculatorRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  const emailStepRef = useRef<HTMLDivElement>(null);

  // When user clicks "See My Earnings Potential" - go to email step (inline, not modal)
  const handleClickSubmit = useCallback((clickRangeId: string, channels: string[]) => {
    setSelectedRange(clickRangeId);
    setSelectedChannels(channels);
    setStep('email');
    // Scroll to email step after state update
    setTimeout(() => {
      emailStepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, []);

  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Handle email submit
  const handleEmailSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userEmail.trim()) {
      setEmailError('Please enter your email address');
      return;
    }

    if (!validateEmail(userEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (!selectedRange) return;

    setEmailError(null);
    setIsSubmitting(true);

    // Calculate earnings
    const range = getClickRangeById(selectedRange);
    if (!range) return;
    
    const result = calculateEarnings(range.midpoint, selectedRange);
    
    try {
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          monthlyClicks: result.monthlyClicks,
          clickRangeId: result.clickRangeId,
          channels: selectedChannels,
          earningsConservative: result.conservative.annualEarnings,
          earningsRealistic: result.realistic.annualEarnings,
          earningsOptimistic: result.optimistic.annualEarnings,
          industryDifference: result.industryComparison.annualDifference,
        }),
      });
    } catch (error) {
      console.error('Subscribe failed:', error);
    }

    // Show full report
    setCalculation(result);
    setStep('report');
    setIsSubmitting(false);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [userEmail, selectedRange, selectedChannels]);

  const handleStartOver = useCallback(() => {
    setStep('landing');
    setCalculation(null);
    setSelectedRange(null);
    setSelectedChannels([]);
    setUserName('');
    setUserEmail('');
    setEmailError(null);
    setShowApplicationForm(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const ctaHeadline = calculation ? getSmartCTAText(calculation.realistic.monthlyEarnings) : 'Ready to Start Earning?';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="w-full py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center cursor-pointer">
            <img 
              src="/Upgraded-Points-Logo.svg" 
              alt="Upgraded Points" 
              className="h-5 w-auto"
            />
          </a>
          <a
            href="https://upgradedpoints.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          >
            Visit Main Site →
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section - faded when not on input step */}
          {(step === 'landing' || step === 'input' || step === 'email') && (
            <div className={`pt-12 md:pt-20 pb-12 text-center max-w-3xl mx-auto animate-fade-in ${step === 'email' ? 'opacity-40' : ''}`}>
              <span className="inline-block px-4 py-1.5 bg-up-light-blue text-up-blue rounded-full text-sm font-medium mb-6">
                Partner Earnings Calculator
              </span>
              
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                See How Much You Could Earn
                <span className="text-up-blue block">on Credit Card Referrals</span>
              </h1>
              
              <p className="text-lg text-gray-600 mb-4">
                Whether you&apos;re a blogger, YouTuber, newsletter writer, or app builder - 
                if you can drive credit card clicks, we&apos;ll show you what you could earn.
              </p>

              <p className="text-sm text-gray-500 mb-8">
                Upgraded Points is a premium affiliate partner of Chase, American Express, 
                Capital One, and other major card issuers.
              </p>

              {step === 'landing' && (
                <button
                  onClick={handleStartCalculator}
                  className="bg-up-dark text-white px-8 py-4 rounded-lg font-medium hover:bg-gray-700 transition-all duration-200 inline-flex items-center gap-2 cursor-pointer"
                >
                  Calculate My Earnings
                  <span>→</span>
                </button>
              )}

              {step === 'landing' && (
                <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-up-blue" />
                    Free
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-up-blue" />
                    Private
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-up-blue" />
                    Instant results
                  </span>
                </div>
              )}
            </div>
          )}

          {/* How It Works (landing only) */}
          {step === 'landing' && <HowItWorks />}

          {/* STEP: Click Input */}
          {step === 'input' && (
            <div ref={calculatorRef} className="py-12 animate-fade-in">
              <ClickInput onSubmit={handleClickSubmit} />
            </div>
          )}

          {/* STEP: Email (inline, not modal) */}
          {step === 'email' && (
            <div ref={emailStepRef} className="max-w-md mx-auto py-12 animate-fade-in text-center">
              {/* Progress indicator */}
              <div className="mb-8">
                <span className="text-sm text-gray-500">Step 2 of 2</span>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className="w-8 h-1 bg-up-blue rounded-full"></div>
                  <div className="w-8 h-1 bg-up-blue rounded-full"></div>
                </div>
              </div>

              {/* Icon */}
              <div className="w-16 h-16 bg-up-light-blue rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-up-blue" />
              </div>

              {/* Heading */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                One Last Step
              </h2>

              {/* Enticing subhead - NO exact numbers */}
              <p className="text-gray-600 mb-6">
                Enter your email to unlock your personalized earnings report
              </p>

              {/* Email form */}
              <form onSubmit={handleEmailSubmit} className="max-w-sm mx-auto">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg mb-3 transition-all duration-200 text-gray-900 placeholder-gray-400 focus:border-up-blue focus:ring-up-light-blue focus:outline-none focus:ring-4"
                  disabled={isSubmitting}
                  autoFocus
                />
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => {
                    setUserEmail(e.target.value);
                    setEmailError(null);
                  }}
                  placeholder="you@example.com"
                  className={`
                    w-full px-4 py-3 border-2 rounded-lg mb-4 transition-all duration-200
                    text-gray-900 placeholder-gray-400
                    ${emailError 
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-100' 
                      : 'border-gray-200 focus:border-up-blue focus:ring-up-light-blue'
                    }
                    focus:outline-none focus:ring-4
                  `}
                  disabled={isSubmitting}
                />
                {emailError && (
                  <p className="text-sm text-red-500 mb-4 -mt-2">{emailError}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-up-orange hover:brightness-110 text-white font-medium py-3 rounded-lg transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Loading...
                    </>
                  ) : (
                    <>
                      See My Report Instantly
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Trust signals */}
              <div className="flex items-center justify-center gap-4 mt-6 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Secure
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  No spam
                </span>
              </div>

              {/* Back link */}
              <button
                onClick={() => setStep('input')}
                className="mt-6 text-sm text-gray-500 hover:text-up-blue cursor-pointer"
              >
                ← Back to edit
              </button>
            </div>
          )}

          {/* STEP: Full Report (inline) */}
          {step === 'report' && calculation && (
            <div className="w-full max-w-4xl mx-auto animate-fade-in pt-8 md:pt-12">
              {/* Report Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-up-light-blue text-up-blue rounded-full text-sm font-medium mb-4">
                  <Check className="w-4 h-4" />
                  Report Unlocked
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  Your Earnings Report
                </h1>
                <p className="text-lg text-gray-600">
                  Based on {calculation.monthlyClicks.toLocaleString()} estimated monthly card clicks
                </p>
              </div>

              {/* Earnings Highlight */}
              <div className="mb-8 rounded-2xl bg-up-blue p-8 text-center text-white">
                <p className="text-sm uppercase tracking-wide text-blue-100 mb-2">
                  Estimated Annual Earnings
                </p>
                <p className="text-5xl md:text-6xl font-bold mb-2">
                  {formatCurrency(calculation.realistic.annualEarnings)}
                </p>
                <p className="text-blue-100">
                  Based on realistic projections • ~{formatCurrency(calculation.realistic.monthlyEarnings)}/month
                </p>
              </div>

              {/* Earnings Projections */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Earnings Projections
                </h3>
                <EarningsTable calculation={calculation} />
              </div>

              {/* Why UP - Simplified comparison that works for everyone */}
              <div className="mb-8 bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Why Upgraded Points?
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Other programs */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Typical programs</p>
                    <p className="text-2xl font-bold text-gray-400">50%</p>
                    <p className="text-xs text-gray-500">commission</p>
                  </div>

                  {/* UP */}
                  <div className="p-4 bg-up-light-blue border-2 border-up-blue rounded-lg relative">
                    <span className="absolute -top-2 right-2 bg-up-orange text-white text-xs px-2 py-0.5 rounded-full">
                      Best rate
                    </span>
                    <p className="text-xs text-up-blue mb-1">Upgraded Points</p>
                    <p className="text-2xl font-bold text-up-blue">65%</p>
                    <p className="text-xs text-up-blue">commission</p>
                  </div>
                </div>

                {/* Simple explanation */}
                <p className="text-sm text-gray-600">
                  For every approved card application you refer, you keep 65% of the commission.
                  That&apos;s 30% more than most programs offer.
                </p>
              </div>

              {/* What's Included - Simplified */}
              <div className="mb-8 bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  What&apos;s Included
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    '65-70% commission split (industry-leading)',
                    'Access to Chase, Amex, Capital One, Citi, Discover',
                    'Real-time tracking dashboard',
                    'Dedicated tracking links for each channel',
                    'Monthly payouts (NET 30)',
                    'No minimums, no contracts, no exclusivity',
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-up-blue flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{item}</span>
                    </div>
                  ))}
                </div>
                
                <p className="text-sm text-gray-500 mt-4">
                  High-volume partners may qualify for premium rates and promotional support.
                </p>
              </div>

              {/* CTA Section with Inline Application Form */}
              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8 md:p-10">
                <div className="max-w-2xl mx-auto text-center">
                  <span className="inline-block px-4 py-1.5 text-up-orange text-sm font-medium mb-4">
                    Start Earning Today
                  </span>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                    {ctaHeadline}
                  </h2>
                  <p className="text-lg text-gray-600 mb-6">
                    Join Upgraded Points&apos; partner program and start monetizing your content.
                  </p>

                  {!showApplicationForm ? (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <button
                        onClick={() => setShowApplicationForm(true)}
                        className="w-full sm:w-auto bg-up-orange hover:brightness-110 text-white font-medium px-6 py-3 rounded-lg transition cursor-pointer inline-flex items-center justify-center gap-2"
                      >
                        Apply to Partner Program
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <a
                        href="https://calendly.com/upgradedpoints/partner-call"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto border border-gray-300 hover:border-gray-400 text-gray-700 font-medium px-6 py-3 rounded-lg transition cursor-pointer inline-flex items-center justify-center gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        Schedule a Call via Calendly
                      </a>
                    </div>
                  ) : (
                    <ApplicationForm
                      prefillName={userName}
                      prefillEmail={userEmail}
                      prefillClickRange={selectedRange}
                      prefillChannels={selectedChannels}
                      onCancel={() => setShowApplicationForm(false)}
                    />
                  )}

                  {!showApplicationForm && (
                    <p className="mt-6 text-sm text-gray-400">
                      Join our growing partner network
                    </p>
                  )}
                </div>
              </div>

              {/* Start Over */}
              <div className="mt-8 text-center">
                <button
                  onClick={handleStartOver}
                  className="text-gray-500 hover:text-up-blue transition-colors text-sm cursor-pointer"
                >
                  ← Calculate again with different numbers
                </button>
              </div>

              {/* Disclaimer */}
              <p className="mt-8 text-xs text-gray-400 text-center">
                Estimates based on typical partner performance. Actual earnings vary by audience, content, and card mix.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Upgraded Points. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="https://upgradedpoints.com/privacy-policy/" className="hover:text-gray-900 transition-colors cursor-pointer">
              Privacy Policy
            </a>
            <a href="https://upgradedpoints.com/terms-and-conditions/" className="hover:text-gray-900 transition-colors cursor-pointer">
              Terms & Conditions
            </a>
            <a href="mailto:partnerships@upgradedpoints.com" className="hover:text-gray-900 transition-colors cursor-pointer">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Inline Application Form Component
function ApplicationForm({ 
  prefillName,
  prefillEmail, 
  prefillClickRange,
  prefillChannels,
  onCancel 
}: { 
  prefillName: string;
  prefillEmail: string;
  prefillClickRange: string | null;
  prefillChannels: string[];
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: prefillName || '',
    email: prefillEmail || '',
    website: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          clickRange: prefillClickRange,
          channels: prefillChannels,
        }),
      });
    } catch (error) {
      console.error('Application failed:', error);
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="mt-6 p-6 bg-up-light-blue rounded-xl text-center">
        <div className="w-12 h-12 bg-up-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-6 h-6 text-up-blue" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Application Submitted!</h3>
        <p className="text-gray-600 text-sm">
          We&apos;ll review your application and get back to you within 2 business days.
        </p>
      </div>
    );
  }

  const clickRangeLabel = CLICK_RANGES.find(r => r.id === prefillClickRange)?.label || 'Not specified';

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto text-left mt-6">
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-up-blue focus:border-transparent focus:outline-none"
          />
        </div>

        {/* Email - pre-filled */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-up-blue focus:border-transparent focus:outline-none"
          />
        </div>

        {/* Website/Channel URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Website or Channel URL *
          </label>
          <input
            type="url"
            required
            placeholder="https://..."
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-up-blue focus:border-transparent focus:outline-none"
          />
        </div>

        {/* Estimated clicks - pre-filled, shown as confirmation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estimated Monthly Card Clicks
          </label>
          <p className="text-gray-600 text-sm bg-gray-50 px-4 py-2 rounded-lg">
            {clickRangeLabel}
          </p>
        </div>

        {/* Optional message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Anything else we should know? (Optional)
          </label>
          <textarea
            rows={3}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Tell us about your audience, content, or any questions..."
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-up-blue focus:border-transparent focus:outline-none"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-4 mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-up-orange hover:brightness-110 text-white font-medium py-3 rounded-lg transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-3 text-gray-500 hover:text-gray-700 cursor-pointer"
        >
          Cancel
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center mt-4">
        We&apos;ll review your application and get back to you within 2 business days.
      </p>
    </form>
  );
}
