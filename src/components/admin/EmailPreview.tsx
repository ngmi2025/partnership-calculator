'use client';

import { useMemo } from 'react';

interface SampleData {
  name: string;
  channel_name: string;
  projected_monthly_earnings: string;
  projected_annual_earnings: string;
  monthly_visitors: string;
  click_rate: string;
}

interface EmailPreviewProps {
  subject: string;
  body: string;
  sampleData?: Partial<SampleData>;
}

// Default sample data for preview
const DEFAULT_SAMPLE: SampleData = {
  name: 'Alex',
  channel_name: 'Travel Points Pro',
  projected_monthly_earnings: '$2,450',
  projected_annual_earnings: '$29,400',
  monthly_visitors: '50,000',
  click_rate: '3.2',
};

function replaceVariables(text: string, data: SampleData): string {
  return text
    .replace(/\{\{name\}\}/g, data.name)
    .replace(/\{\{channel_name\}\}/g, data.channel_name)
    .replace(/\{\{projected_monthly_earnings\}\}/g, data.projected_monthly_earnings)
    .replace(/\{\{projected_annual_earnings\}\}/g, data.projected_annual_earnings)
    .replace(/\{\{monthly_visitors\}\}/g, data.monthly_visitors)
    .replace(/\{\{click_rate\}\}/g, data.click_rate);
}

// Convert markdown-style formatting to HTML for preview
function formatBody(text: string): string {
  return text
    // Bold text: **text** -> <strong>text</strong>
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Emoji bullets and regular bullets
    .replace(/^([📊💰❌✅•-]) /gm, '<span class="bullet">$1</span> ')
    // Line breaks
    .split('\n')
    .map(line => line.trim() === '' ? '<br/>' : `<p>${line}</p>`)
    .join('');
}

export function EmailPreview({ subject, body, sampleData }: EmailPreviewProps) {
  const mergedData: SampleData = { ...DEFAULT_SAMPLE, ...sampleData };

  const previewSubject = useMemo(
    () => replaceVariables(subject, mergedData),
    [subject, mergedData]
  );

  const previewBody = useMemo(
    () => formatBody(replaceVariables(body, mergedData)),
    [body, mergedData]
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      {/* Email Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="space-y-2 text-sm">
          <div className="flex">
            <span className="text-gray-500 w-16">From:</span>
            <span className="text-gray-900">Luke R &lt;partnerships@upgradedpoints.com&gt;</span>
          </div>
          <div className="flex">
            <span className="text-gray-500 w-16">To:</span>
            <span className="text-gray-900">{mergedData.name} &lt;alex@example.com&gt;</span>
          </div>
          <div className="flex">
            <span className="text-gray-500 w-16">Subject:</span>
            <span className="text-gray-900 font-medium">{previewSubject}</span>
          </div>
        </div>
      </div>

      {/* Email Body */}
      <div 
        className="p-6 text-gray-800 leading-relaxed email-preview"
        dangerouslySetInnerHTML={{ __html: previewBody }}
      />

      {/* Preview Notice */}
      <div className="bg-amber-50 border-t border-amber-200 px-4 py-2">
        <p className="text-xs text-amber-700">
          ⚡ Preview mode — Variables replaced with sample data
        </p>
      </div>

      <style jsx>{`
        .email-preview :global(p) {
          margin: 0 0 0.5rem 0;
        }
        .email-preview :global(p:empty) {
          margin: 0;
        }
        .email-preview :global(br) {
          display: block;
          margin: 0.75rem 0;
          content: "";
        }
        .email-preview :global(strong) {
          font-weight: 600;
          color: #1f2937;
        }
        .email-preview :global(.bullet) {
          display: inline-block;
          width: 1.25rem;
        }
      `}</style>
    </div>
  );
}

// Editable sample data panel
interface SampleDataEditorProps {
  sampleData: SampleData;
  onChange: (data: SampleData) => void;
}

export function SampleDataEditor({ sampleData, onChange }: SampleDataEditorProps) {
  const handleChange = (key: keyof SampleData, value: string) => {
    onChange({ ...sampleData, ...{ [key]: value } });
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
      <h4 className="text-sm font-medium text-gray-700 mb-3">Preview Variables</h4>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Name</label>
          <input
            type="text"
            value={sampleData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-xs text-gray-500 mb-1">Channel Name</label>
          <input
            type="text"
            value={sampleData.channel_name}
            onChange={(e) => handleChange('channel_name', e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-xs text-gray-500 mb-1">Monthly Earnings</label>
          <input
            type="text"
            value={sampleData.projected_monthly_earnings}
            onChange={(e) => handleChange('projected_monthly_earnings', e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-xs text-gray-500 mb-1">Annual Earnings</label>
          <input
            type="text"
            value={sampleData.projected_annual_earnings}
            onChange={(e) => handleChange('projected_annual_earnings', e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-xs text-gray-500 mb-1">Monthly Visitors</label>
          <input
            type="text"
            value={sampleData.monthly_visitors}
            onChange={(e) => handleChange('monthly_visitors', e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-xs text-gray-500 mb-1">Click Rate (%)</label>
          <input
            type="text"
            value={sampleData.click_rate}
            onChange={(e) => handleChange('click_rate', e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

export { DEFAULT_SAMPLE };
export type { SampleData };
