'use client';

import { useState } from 'react';
import { Globe, Youtube, Mail, Share2, Puzzle, Smartphone, Mic, ChevronDown } from 'lucide-react';
import { CLICK_RANGES } from '@/lib/calculations';

// Map icon names to components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe,
  Youtube,
  Mail,
  Share2,
  Puzzle,
  Smartphone,
  Mic,
};

const channels = [
  { id: 'blog', label: 'Blog / Website', icon: Globe },
  { id: 'youtube', label: 'YouTube', icon: Youtube },
  { id: 'newsletter', label: 'Newsletter', icon: Mail },
  { id: 'social', label: 'Social Media', icon: Share2 },
  { id: 'extension', label: 'Browser Extension', icon: Puzzle },
  { id: 'app', label: 'Mobile App', icon: Smartphone },
  { id: 'podcast', label: 'Podcast', icon: Mic },
  { id: 'other', label: 'Other', icon: null },
];

interface ClickInputProps {
  onSubmit: (clickRangeId: string, channels: string[]) => void;
}

export function ClickInput({ onSubmit }: ClickInputProps) {
  const [selectedRange, setSelectedRange] = useState<string | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [showHelper, setShowHelper] = useState(false);

  const toggleChannel = (channelId: string) => {
    setSelectedChannels(prev => 
      prev.includes(channelId)
        ? prev.filter(c => c !== channelId)
        : [...prev, channelId]
    );
  };

  const handleSubmit = () => {
    if (selectedRange) {
      onSubmit(selectedRange, selectedChannels);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="text-center mb-8">
        <span className="text-sm text-gray-500">Step 1 of 2</span>
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className="w-8 h-1 bg-up-blue rounded-full"></div>
          <div className="w-8 h-1 bg-gray-200 rounded-full"></div>
        </div>
      </div>

      {/* Section Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          Estimate Your Monthly Card Clicks
        </h2>
        <p className="text-gray-600">
          Think about all your channels: your website, blog posts, YouTube descriptions, 
          newsletters, social media, browser extensions, apps - anywhere you could place 
          credit card affiliate links.
        </p>
      </div>

      {/* Click Range Selection */}
      <div className="space-y-3 mb-8">
        <label className="block text-sm font-medium text-gray-900 mb-3">
          How many credit card link clicks could you drive per month?
        </label>
        
        {CLICK_RANGES.map((range) => (
          <button
            key={range.id}
            onClick={() => setSelectedRange(range.id)}
            className={`
              w-full p-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer
              ${selectedRange === range.id
                ? 'border-up-blue bg-up-light-blue'
                : 'border-gray-200 bg-white hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                ${selectedRange === range.id
                  ? 'border-up-blue bg-up-blue'
                  : 'border-gray-300'
                }
              `}>
                {selectedRange === range.id && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <div>
                <p className={`font-medium ${selectedRange === range.id ? 'text-up-blue' : 'text-gray-900'}`}>
                  {range.label}
                </p>
                <p className="text-sm text-gray-500">
                  {range.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Channel Selection (Optional) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-900 mb-2">
          What are your main channels? <span className="text-gray-400 font-normal">(Optional)</span>
        </label>
        <p className="text-sm text-gray-500 mb-4">
          This helps us give you more relevant recommendations.
        </p>
        
        <div className="flex flex-wrap gap-2">
          {channels.map((channel) => {
            const Icon = channel.icon;
            return (
              <button
                key={channel.id}
                onClick={() => toggleChannel(channel.id)}
                className={`
                  px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer
                  ${selectedChannels.includes(channel.id)
                    ? 'border-up-blue bg-up-light-blue text-up-blue'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }
                `}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {channel.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Collapsible helper text */}
      <details className="mb-8 bg-gray-50 rounded-lg">
        <summary className="px-4 py-3 cursor-pointer text-sm text-gray-600 hover:text-gray-800 font-medium flex items-center justify-between">
          <span>Not sure how to estimate? Click for a rough guide</span>
          <ChevronDown className="w-4 h-4" />
        </summary>
        <div className="px-4 pb-4 text-sm text-gray-600 space-y-1">
          <p>• 10K monthly blog visitors → ~200-500 card clicks</p>
          <p>• 50K YouTube views/month → ~500-1,500 card clicks</p>
          <p>• 20K newsletter subscribers → ~400-1,000 card clicks</p>
          <p>• Browser extension with 5K users → ~1,000-3,000 card clicks</p>
        </div>
      </details>

      {/* CTA Button */}
      <button
        onClick={handleSubmit}
        disabled={!selectedRange}
        className={`
          w-full px-8 py-4 text-lg font-medium rounded-lg transition-all duration-200
          flex items-center justify-center gap-2
          ${selectedRange
            ? 'bg-up-dark text-white hover:bg-gray-700 cursor-pointer'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        See My Earnings Potential
        <span className="text-lg">→</span>
      </button>

      {!selectedRange && (
        <p className="text-center text-sm text-gray-400 mt-3">
          Select your estimated clicks to continue
        </p>
      )}
    </div>
  );
}
