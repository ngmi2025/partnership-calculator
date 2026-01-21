'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Menu,
  Mail,
  Clock,
  Check,
  X,
  Edit,
  ChevronRight,
} from 'lucide-react';
import { Sidebar } from '@/components/admin';
import { EmailTemplate } from '@/types/database';

interface TemplatesClientProps {
  userName: string;
}

export function TemplatesClient({ userName }: TemplatesClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const response = await fetch('/api/admin/templates');
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.templates || []);
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTemplates();
  }, []);

  const toggleActive = async (template: EmailTemplate) => {
    try {
      const response = await fetch(`/api/admin/templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !template.active }),
      });

      if (response.ok) {
        setTemplates((prev) =>
          prev.map((t) =>
            t.id === template.id ? { ...t, active: !t.active } : t
          )
        );
      }
    } catch (error) {
      console.error('Failed to toggle template:', error);
    }
  };

  // Group templates by sequence
  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.sequence]) {
      acc[template.sequence] = [];
    }
    acc[template.sequence].push(template);
    return acc;
  }, {} as Record<string, EmailTemplate[]>);

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
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Email Templates</h1>
              <p className="text-sm text-slate-500">Manage your email sequences</p>
            </div>
          </div>
        </header>

        <main className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F75BD]"></div>
            </div>
          ) : templates.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Mail className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-lg font-medium text-slate-900 mb-2">No templates yet</h2>
              <p className="text-slate-500">
                Email templates will appear here once you run the schema SQL.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTemplates).map(([sequence, seqTemplates]) => (
                <div key={sequence} className="bg-white rounded-xl border border-slate-200">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-900 capitalize">
                      {sequence.replace(/_/g, ' ')}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {seqTemplates.length} email{seqTemplates.length !== 1 ? 's' : ''} in sequence
                    </p>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {seqTemplates.sort((a, b) => a.step - b.step).map((template) => (
                      <div
                        key={template.id}
                        className="px-6 py-4 flex items-center justify-between hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                              template.active
                                ? 'bg-[#0F75BD] text-white'
                                : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            {template.step}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{template.subject}</p>
                            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {template.step === 0
                                  ? 'Immediate'
                                  : `Day ${template.delay_days}`}
                              </span>
                              <span
                                className={`flex items-center gap-1 ${
                                  template.active ? 'text-green-600' : 'text-slate-400'
                                }`}
                              >
                                {template.active ? (
                                  <>
                                    <Check className="w-3 h-3" /> Active
                                  </>
                                ) : (
                                  <>
                                    <X className="w-3 h-3" /> Inactive
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleActive(template)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              template.active
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {template.active ? 'Active' : 'Inactive'}
                          </button>
                          <Link
                            href={`/partnership-admin/templates/${template.id}`}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Template Variables Reference */}
          <div className="mt-6 bg-slate-50 rounded-xl border border-slate-200 p-6">
            <h3 className="font-medium text-slate-900 mb-3">Available Variables</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                '{{first_name}}',
                '{{name}}',
                '{{email}}',
                '{{channel_name}}',
                '{{website_url}}',
                '{{click_range}}',
                '{{earnings_conservative}}',
                '{{earnings_realistic}}',
                '{{earnings_optimistic}}',
                '{{monthly_visitors}}',
              ].map((variable) => (
                <code
                  key={variable}
                  className="bg-white px-2 py-1 rounded border border-slate-200 text-sm text-slate-600"
                >
                  {variable}
                </code>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
