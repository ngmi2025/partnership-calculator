'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu,
  ArrowLeft,
  Save,
  Eye,
  Check,
} from 'lucide-react';
import { Sidebar } from '@/components/admin';
import { EmailTemplate } from '@/types/database';

interface TemplateEditorClientProps {
  templateId: string;
  userName: string;
}

const sampleData = {
  first_name: 'John',
  name: 'John Smith',
  email: 'john@example.com',
  channel_name: 'TravelHacks',
  website_url: 'https://travelhacks.com',
  click_range: '2,000-5,000',
  earnings_conservative: '$12,500',
  earnings_realistic: '$25,000',
  earnings_optimistic: '$50,000',
  monthly_visitors: '50,000',
};

function replaceVariables(text: string): string {
  let result = text;
  Object.entries(sampleData).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  });
  return result;
}

const variableChips = [
  '{{first_name}}',
  '{{name}}',
  '{{channel_name}}',
  '{{website_url}}',
  '{{click_range}}',
  '{{earnings_conservative}}',
  '{{earnings_realistic}}',
  '{{earnings_optimistic}}',
  '{{monthly_visitors}}',
];

export function TemplateEditorClient({ templateId, userName }: TemplateEditorClientProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [delayDays, setDelayDays] = useState(0);
  const [active, setActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchTemplate() {
      try {
        const response = await fetch(`/api/admin/templates/${templateId}`);
        if (response.ok) {
          const data = await response.json();
          setTemplate(data.template);
          setSubject(data.template.subject);
          setBody(data.template.body);
          setDelayDays(data.template.delay_days);
          setActive(data.template.active);
        }
      } catch (error) {
        console.error('Failed to fetch template:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTemplate();
  }, [templateId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body, delay_days: delayDays, active }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error('Failed to save template:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('body-textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newBody = body.substring(0, start) + variable + body.substring(end);
      setBody(newBody);
      // Set cursor position after inserted text
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + variable.length;
        textarea.focus();
      }, 0);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar userName={userName} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F75BD]"></div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex h-screen">
        <Sidebar userName={userName} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-500">Template not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar userName={userName} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
              <Link
                href="/partnership-admin/templates"
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Edit Template</h1>
                <p className="text-sm text-slate-500">
                  {template.sequence} - Step {template.step}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm transition-colors ${
                  showPreview
                    ? 'border-[#0F75BD] text-[#0F75BD] bg-blue-50'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-[#0F75BD] text-white rounded-lg hover:bg-[#0a5a94] disabled:opacity-50"
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="p-6">
          <div className={`grid gap-6 ${showPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Editor */}
            <div className="space-y-6">
              {/* Settings Row */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Delay (days after previous)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={delayDays}
                      onChange={(e) => setDelayDays(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0F75BD] focus:border-transparent outline-none"
                      disabled={template.step === 0}
                    />
                    {template.step === 0 && (
                      <p className="text-xs text-slate-500 mt-1">First email sends immediately</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Status
                    </label>
                    <button
                      onClick={() => setActive(!active)}
                      className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                        active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0F75BD] focus:border-transparent outline-none"
                  placeholder="Email subject..."
                />
              </div>

              {/* Body */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Body
                </label>

                {/* Variable Chips */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {variableChips.map((variable) => (
                    <button
                      key={variable}
                      onClick={() => insertVariable(variable)}
                      className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors"
                    >
                      {variable}
                    </button>
                  ))}
                </div>

                <textarea
                  id="body-textarea"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={20}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0F75BD] focus:border-transparent outline-none font-mono text-sm resize-none"
                  placeholder="Email body..."
                />
              </div>
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-sm font-medium text-slate-700 mb-4">Preview (with sample data)</h3>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  {/* Email Header */}
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                    <p className="text-xs text-slate-500">From: Luke R &lt;partnerships@upgradedpoints.com&gt;</p>
                    <p className="text-xs text-slate-500">To: {sampleData.email}</p>
                    <p className="text-sm font-medium text-slate-900 mt-1">
                      {replaceVariables(subject)}
                    </p>
                  </div>

                  {/* Email Body */}
                  <div className="p-4 whitespace-pre-wrap text-sm text-slate-700 font-mono">
                    {replaceVariables(body)}
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-4">
                  This preview uses sample data to show how variables will be replaced.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
