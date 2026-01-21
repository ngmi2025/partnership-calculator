'use client';

import { useState } from 'react';
import { Menu, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Sidebar } from '@/components/admin';

const EMAIL_TEMPLATES = [
  {
    id: 'custom',
    name: 'Custom Email',
    subject: '',
    body: ''
  },
  {
    id: 'intro',
    name: 'Introduction',
    subject: 'Partnership Opportunity with Upgraded Points',
    body: `Hi {{first_name}},

I came across {{channel_name}} and was impressed by your content in the travel/points space.

I'm Luke from Upgraded Points - we run one of the largest credit card and travel rewards sites, and we're launching a sub-affiliate partner program that I think could be a great fit for your audience.

Our partners typically earn $2,000-$10,000+ per month through our program, with dedicated support and optimized conversion funnels.

Would you be open to a quick 15-minute call to explore this?

Best,
Luke`
  },
  {
    id: 'follow_up',
    name: 'Follow Up',
    subject: 'Quick follow up - Upgraded Points Partnership',
    body: `Hi {{first_name}},

I wanted to follow up on my previous email about partnering with Upgraded Points.

I understand you're busy, but I genuinely think this could be valuable for {{channel_name}}. Our partners see strong conversions because we handle all the optimization - you just drive traffic.

Happy to jump on a quick call whenever works for you, or I can send over more details via email if you prefer.

Best,
Luke`
  },
  {
    id: 'calculator_invite',
    name: 'Calculator Invite',
    subject: 'See your earning potential with Upgraded Points',
    body: `Hi {{first_name}},

I've been following {{channel_name}} and love what you're doing in the travel space.

I wanted to share a quick tool we built - our Partner Earnings Calculator. It takes about 30 seconds and shows you what you could realistically earn through our affiliate program based on your traffic.

Check it out here: https://partnership-calculator.vercel.app/

No commitment - just thought it might be interesting to see the numbers.

Let me know if you have any questions!

Best,
Luke`
  }
];

interface ComposeClientProps {
  userName: string;
}

export function ComposeClient({ userName }: ComposeClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mode, setMode] = useState<'single' | 'sequence'>('single');
  const [selectedTemplate, setSelectedTemplate] = useState('custom');
  const [formData, setFormData] = useState({
    to_email: '',
    first_name: '',
    channel_name: '',
    website_url: '',
    subject: '',
    body: '',
    sequence_id: 'cold_outreach'
  });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        subject: template.subject,
        body: template.body
      }));
    }
  };

  const replaceVariables = (text: string) => {
    return text
      .replace(/\{\{first_name\}\}/g, formData.first_name || '[First Name]')
      .replace(/\{\{channel_name\}\}/g, formData.channel_name || '[Channel Name]');
  };

  const handleSendEmail = async () => {
    setSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/compose-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          to_email: formData.to_email,
          first_name: formData.first_name,
          channel_name: formData.channel_name,
          website_url: formData.website_url,
          subject: replaceVariables(formData.subject),
          body: replaceVariables(formData.body),
          sequence_id: mode === 'sequence' ? formData.sequence_id : null
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          message: mode === 'single'
            ? 'Email sent successfully!'
            : `Lead added to ${formData.sequence_id} sequence. First email will send based on schedule.`
        });
        // Reset form
        setFormData({
          to_email: '',
          first_name: '',
          channel_name: '',
          website_url: '',
          subject: '',
          body: '',
          sequence_id: 'cold_outreach'
        });
        setSelectedTemplate('custom');
      } else {
        setResult({ success: false, message: data.error || 'Failed to send' });
      }
    } catch (error) {
      setResult({ success: false, message: 'Network error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        userName={userName}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Compose Email</h1>
                <p className="text-sm text-slate-500">Send one-off emails or add leads to sequences</p>
              </div>
            </div>
            <Link
              href="/partnership-admin"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Mode Toggle */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">What do you want to do?</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setMode('single')}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    mode === 'single'
                      ? 'border-[#0F75BD] bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-semibold text-slate-900">Send One-Off Email</div>
                  <div className="text-sm text-slate-500">Send a single email right now</div>
                </button>
                <button
                  onClick={() => setMode('sequence')}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    mode === 'sequence'
                      ? 'border-[#0F75BD] bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-semibold text-slate-900">Add to Sequence</div>
                  <div className="text-sm text-slate-500">Add lead and start automated emails</div>
                </button>
              </div>
            </div>

            {/* Recipient Info */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Recipient Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.to_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, to_email: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F75BD] focus:border-transparent"
                    placeholder="creator@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F75BD] focus:border-transparent"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Channel/Brand Name
                  </label>
                  <input
                    type="text"
                    value={formData.channel_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, channel_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F75BD] focus:border-transparent"
                    placeholder="Travel Points Pro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F75BD] focus:border-transparent"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              {mode === 'sequence' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Select Sequence
                  </label>
                  <select
                    value={formData.sequence_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, sequence_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F75BD] focus:border-transparent"
                  >
                    <option value="cold_outreach">Cold Outreach (5 emails over 20 days)</option>
                    <option value="calculator_nurture">Calculator Nurture (5 emails over 14 days)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Email Content - Only show for single mode */}
            {mode === 'single' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900 mb-4">Email Content</h2>

                {/* Template Selector */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Start from Template
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F75BD] focus:border-transparent"
                  >
                    {EMAIL_TEMPLATES.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Subject Line <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F75BD] focus:border-transparent"
                    placeholder="Partnership Opportunity with Upgraded Points"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email Body <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.body}
                    onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                    rows={12}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F75BD] focus:border-transparent font-mono text-sm"
                    placeholder="Write your email here... Use {{first_name}} and {{channel_name}} for personalization."
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Variables: {"{{first_name}}"}, {"{{channel_name}}"} will be replaced automatically
                  </p>
                </div>

                {/* Preview */}
                {formData.body && (
                  <div className="border-t border-slate-200 pt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Preview</label>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="text-sm text-slate-600 mb-2">
                        <strong>To:</strong> {formData.to_email || '[email]'}
                      </div>
                      <div className="text-sm text-slate-600 mb-3">
                        <strong>Subject:</strong> {replaceVariables(formData.subject) || '[subject]'}
                      </div>
                      <div className="text-sm whitespace-pre-wrap font-mono bg-white p-3 rounded border border-slate-200">
                        {replaceVariables(formData.body)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sequence Info - Only show for sequence mode */}
            {mode === 'sequence' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="font-semibold text-blue-900 mb-2">
                  {formData.sequence_id === 'cold_outreach' ? 'Cold Outreach Sequence' : 'Calculator Nurture Sequence'}
                </h3>
                <p className="text-sm text-blue-800 mb-3">
                  This lead will receive the following automated emails:
                </p>
                <ul className="text-sm text-blue-700 space-y-1.5">
                  {formData.sequence_id === 'cold_outreach' ? (
                    <>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />Email 1: Partnership opportunity (Day 0)</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />Email 2: Thought this might help (Day 3)</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />Email 3: How creators like you earn $5k+/month (Day 7)</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />Email 4: Quick yes or no? (Day 12)</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />Email 5: Last one from me (Day 20)</li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />Email 0: Your Partnership Earnings Estimate (Immediate)</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />Email 1: Quick question about your channel (Day 2)</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />Email 2: How one partner 3x&apos;d their estimate (Day 5)</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />Email 3: Still thinking about it? (Day 8)</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />Email 4: Closing the loop (Day 14)</li>
                    </>
                  )}
                </ul>
              </div>
            )}

            {/* Result Message */}
            {result && (
              <div className={`p-4 rounded-xl ${
                result.success 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {result.message}
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={handleSendEmail}
              disabled={sending || !formData.to_email || (mode === 'single' && (!formData.subject || !formData.body))}
              className="w-full py-3 bg-[#0F75BD] text-white font-semibold rounded-xl hover:bg-[#0a5a91] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {sending ? 'Processing...' : mode === 'single' ? 'Send Email Now' : 'Add to Sequence'}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
