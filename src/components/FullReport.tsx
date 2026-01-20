'use client';

import { Check, TrendingUp, ArrowRight, Calendar } from 'lucide-react';
import { formatNumber, formatCurrency, getSmartCTAText, type EarningsCalculation } from '@/lib/calculations';
import { EarningsTable } from './EarningsTable';

interface FullReportProps {
  calculation: EarningsCalculation;
  channels: string[];
  onStartOver: () => void;
}

export function FullReport({ calculation, channels, onStartOver }: FullReportProps) {
  const { industryComparison, realistic } = calculation;
  const ctaHeadline = getSmartCTAText(realistic.monthlyEarnings);

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      {/* Report Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-full text-sm font-medium mb-4">
          <Check className="w-4 h-4" />
          Report Unlocked
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Your Earnings Report
        </h1>
        <p className="text-lg text-gray-600">
          Based on {formatNumber(calculation.monthlyClicks)} estimated monthly card clicks
        </p>
      </div>

      {/* Earnings Highlight Card */}
      <div className="mb-4 rounded-2xl bg-gradient-to-r from-green-600 to-green-500 p-8 text-center text-white">
        <p className="text-sm uppercase tracking-wide text-green-100 mb-2">
          Estimated Annual Earnings
        </p>
        <p className="text-5xl md:text-6xl font-bold mb-2">
          {formatCurrency(realistic.annualEarnings)}
        </p>
        <p className="text-green-100">
          Based on realistic projections • ~{formatCurrency(realistic.monthlyEarnings)}/month
        </p>
      </div>
      
      {/* Comparison callout - OUTSIDE hero, standalone */}
      {industryComparison.annualDifference > 0 && (
        <div className="flex items-center justify-center gap-2 mb-8 text-green-600">
          <TrendingUp className="w-5 h-5" />
          <span className="font-medium">
            That&apos;s {formatCurrency(industryComparison.annualDifference)}/year MORE than industry-average 50% rates
          </span>
        </div>
      )}

      {/* Earnings Projections */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Earnings Projections
        </h3>
        <EarningsTable calculation={calculation} />
      </div>

      {/* Industry Comparison */}
      <div className="mb-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Why Partner With Upgraded Points?
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Industry Average */}
          <div className="bg-white rounded-lg p-5 border border-gray-200">
            <p className="text-sm text-gray-400 mb-2">Industry Average</p>
            <p className="text-3xl font-bold text-gray-400 mb-2">
              {industryComparison.industryRate}%
            </p>
            <p className="text-sm text-gray-400">Commission rate</p>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                {formatCurrency(industryComparison.industryMonthly)}/month
              </p>
              <p className="text-lg font-medium text-gray-500">
                {formatCurrency(industryComparison.industryAnnual)}/year
              </p>
            </div>
          </div>
          
          {/* UP Rate */}
          <div className="bg-white rounded-lg p-5 border-2 border-green-500 relative">
            <div className="absolute -top-3 right-4 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
              RECOMMENDED
            </div>
            <p className="text-sm text-green-600 mb-2">Upgraded Points</p>
            <p className="text-3xl font-bold text-green-600 mb-2">
              {industryComparison.upRate}%
            </p>
            <p className="text-sm text-green-600">Commission rate</p>
            <div className="mt-3 pt-3 border-t border-green-100">
              <p className="text-sm text-green-600">
                {formatCurrency(industryComparison.upMonthly)}/month
              </p>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(industryComparison.upAnnual)}/year
              </p>
            </div>
          </div>
        </div>
        
        {industryComparison.annualDifference > 0 && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-700 font-medium">
              You&apos;d earn {formatCurrency(industryComparison.annualDifference)} MORE per year with UP
            </p>
          </div>
        )}
      </div>

      {/* What's Included */}
      <div className="mb-8 bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          What&apos;s Included in UP&apos;s Partner Program
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            '65-70% commission split (industry-leading rates)',
            'Access to all major issuers: Chase, Amex, Capital One, Citi, Discover',
            'Real-time tracking dashboard with click and conversion data',
            'Dedicated tracking links for each of your channels',
            'Monthly payouts (NET 30)',
            'No minimums, no contracts, no exclusivity required',
          ].map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-600">{item}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-3">Premium partners also get:</p>
          <div className="space-y-2">
            {[
              'UP actively promotes your brand to our 3M+ monthly readers',
              'Featured placement in our newsletter (85K+ subscribers)',
              'Backlinks from upgradedpoints.com (DA 70+)',
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8 md:p-10">
        <div className="max-w-2xl mx-auto text-center">
          {/* Header */}
          <div className="mb-6">
            <span className="inline-block px-4 py-1.5 bg-green-50 text-green-600 text-sm font-medium rounded-full mb-4">
              Start Earning Today
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              {ctaHeadline}
            </h2>
            <p className="text-lg text-gray-600">
              Join Upgraded Points&apos; partner program and start monetizing your content with industry-leading commission rates.
            </p>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-left">
            {[
              { title: '65-70% Commission', desc: 'Industry-leading rates' },
              { title: 'Premium Cards', desc: 'Chase, Amex, Capital One' },
              { title: 'Real-Time Tracking', desc: 'Full dashboard access' },
              { title: 'No Minimums', desc: 'Start immediately' },
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://upgradedpoints.com/partners/apply"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 text-lg font-medium text-white rounded-lg transition-all duration-200 bg-gray-900 hover:bg-gray-800 flex items-center justify-center gap-2"
            >
              Apply to Partner Program
              <ArrowRight className="w-5 h-5" />
            </a>
            
            <a
              href="https://calendly.com/upgradedpoints/partner-call"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 text-lg font-medium text-gray-700 rounded-lg transition-all duration-200 bg-white border-2 border-gray-200 hover:border-gray-300 flex items-center justify-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Book a Call
            </a>
          </div>

          {/* Trust text - simplified */}
          <p className="mt-6 text-sm text-gray-400">
            Join our growing partner network
          </p>
        </div>
      </div>

      {/* Start Over */}
      <div className="mt-8 text-center">
        <button
          onClick={onStartOver}
          className="text-gray-500 hover:text-gray-900 transition-colors text-sm"
        >
          ← Calculate again with different numbers
        </button>
      </div>
    </div>
  );
}
