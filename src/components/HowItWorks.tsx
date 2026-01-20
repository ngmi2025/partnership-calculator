'use client';

import { PenLine, MousePointerClick, Link2, DollarSign, Check } from 'lucide-react';

const steps = [
  {
    icon: PenLine,
    title: 'Create Content',
    description: 'You create content about credit cards (blog posts, YouTube videos, newsletters, etc.)',
  },
  {
    icon: MousePointerClick,
    title: 'Audience Clicks',
    description: 'Your audience clicks your affiliate links to explore card offers',
  },
  {
    icon: Link2,
    title: 'Tracked by UP',
    description: 'Links route through Upgraded Points to the card issuer (Chase, Amex, etc.)',
  },
  {
    icon: DollarSign,
    title: 'Earn Commission',
    description: 'When applications are approved, you earn 65-70% commission - industry-leading rates',
  },
];

export function HowItWorks() {
  return (
    <section className="w-full max-w-4xl mx-auto py-16">
      <div className="text-center mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          How Partner Earnings Work
        </h2>
        <p className="text-gray-600">
          A simple 4-step process
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {steps.map((step, index) => (
          <div key={step.title} className="text-center">
            <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gray-50 rounded-2xl mb-4">
              <step.icon className="w-7 h-7 text-gray-600" />
              <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-up-blue text-white text-xs font-bold rounded-full flex items-center justify-center">
                {index + 1}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
            <p className="text-sm text-gray-600">{step.description}</p>
          </div>
        ))}
      </div>

      {/* Commission callout - no emoji */}
      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-up-light-blue rounded-full">
          <Check className="w-5 h-5 text-up-blue" />
          <span className="text-up-blue font-medium">
            We offer 65-70% commission splits - among the highest in the industry
          </span>
        </div>
      </div>
    </section>
  );
}
