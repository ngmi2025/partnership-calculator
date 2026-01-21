'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Menu,
  Mail,
  Users,
  Pause,
  Play,
  Clock,
  TrendingUp,
  Check,
  Settings,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Sidebar } from '@/components/admin';

interface SequencesPageClientProps {
  userName: string;
}

interface SequenceStep {
  step: number;
  subject: string;
  total_sent: number;
  click_rate: number;
  reply_rate: number;
}

interface SequenceStats {
  name: string;
  display_name: string;
  total_leads: number;
  active_leads: number;
  paused_leads: number;
  completed_leads: number;
  scheduled_today: number;
  settings: {
    paused: boolean;
    send_window_start: string;
    send_window_end: string;
    send_timezone: string;
    daily_limit: number;
    skip_weekends: boolean;
  };
  steps: SequenceStep[];
}

export function SequencesPageClient({ userName }: SequencesPageClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sequences, setSequences] = useState<SequenceStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchSequences();
  }, []);

  const fetchSequences = async () => {
    try {
      const response = await fetch('/api/admin/sequences');
      if (response.ok) {
        const data = await response.json();
        setSequences(data.sequences || []);
      }
    } catch (error) {
      console.error('Failed to fetch sequences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePauseResume = async (sequenceName: string, isPaused: boolean) => {
    setActionLoading(sequenceName);
    try {
      const action = isPaused ? 'resume' : 'pause';
      const response = await fetch(`/api/admin/sequences/${sequenceName}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        fetchSequences();
      }
    } catch (error) {
      console.error('Failed to pause/resume:', error);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
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
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Email Sequences</h1>
                <p className="text-sm text-slate-500">Manage automated email campaigns</p>
              </div>
            </div>

            <Link
              href="/partnership-admin/sequences/queue"
              className="flex items-center gap-2 px-4 py-2 bg-[#0F75BD] text-white rounded-lg hover:bg-[#0a5a94] transition-colors"
            >
              <Clock className="w-4 h-4" />
              View Queue
            </Link>
          </div>
        </header>

        <main className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#0F75BD] animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {sequences.map((seq) => (
                <div
                  key={seq.name}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                >
                  {/* Sequence Header */}
                  <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${
                        seq.name === 'calculator_nurture' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-purple-100 text-purple-600'
                      }`}>
                        <Mail className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">{seq.display_name}</h2>
                        <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {seq.total_leads} leads
                          </span>
                          <span>•</span>
                          <span>{seq.active_leads} active</span>
                          <span>•</span>
                          <span>{seq.scheduled_today} scheduled today</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {seq.settings.paused && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                          <Pause className="w-3 h-3" />
                          Paused
                        </span>
                      )}
                      <button
                        onClick={() => handlePauseResume(seq.name, seq.settings.paused)}
                        disabled={actionLoading === seq.name}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                          seq.settings.paused
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        }`}
                      >
                        {actionLoading === seq.name ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : seq.settings.paused ? (
                          <Play className="w-4 h-4" />
                        ) : (
                          <Pause className="w-4 h-4" />
                        )}
                        {seq.settings.paused ? 'Resume' : 'Pause'}
                      </button>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-4 gap-4 p-6 bg-slate-50 border-b border-slate-100">
                    <div>
                      <p className="text-sm text-slate-500">Active</p>
                      <p className="text-2xl font-bold text-slate-900">{seq.active_leads}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Paused</p>
                      <p className="text-2xl font-bold text-slate-900">{seq.paused_leads}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Completed</p>
                      <p className="text-2xl font-bold text-slate-900">{seq.completed_leads}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Completion Rate</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {seq.total_leads > 0 
                          ? `${Math.round((seq.completed_leads / seq.total_leads) * 100)}%`
                          : '--'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Settings Summary */}
                  <div className="flex items-center gap-6 px-6 py-3 bg-slate-50/50 text-sm text-slate-600 border-b border-slate-100">
                    <span>
                      📧 Send window: {seq.settings.send_window_start} - {seq.settings.send_window_end} ({seq.settings.send_timezone})
                    </span>
                    <span>📊 Daily limit: {seq.settings.daily_limit}</span>
                    <span>{seq.settings.skip_weekends ? '📅 Skip weekends' : '📅 Includes weekends'}</span>
                  </div>

                  {/* Steps Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Step</th>
                          <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Subject</th>
                          <th className="text-right text-xs font-medium text-slate-500 uppercase px-6 py-3">Sent</th>
                          <th className="text-right text-xs font-medium text-slate-500 uppercase px-6 py-3">Click Rate</th>
                          <th className="text-right text-xs font-medium text-slate-500 uppercase px-6 py-3">Reply Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {seq.steps.length > 0 ? (
                          seq.steps.map((step) => (
                            <tr key={step.step} className="hover:bg-slate-50">
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-200 text-slate-600 rounded-full text-xs font-medium">
                                  {step.step}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-900 max-w-md truncate">
                                {step.subject}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 text-right">
                                {step.total_sent.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {step.total_sent > 0 ? (
                                  <span className={`text-sm font-medium ${
                                    step.click_rate > 10 ? 'text-green-600' :
                                    step.click_rate > 5 ? 'text-amber-600' : 'text-slate-600'
                                  }`}>
                                    {step.click_rate.toFixed(1)}%
                                  </span>
                                ) : (
                                  <span className="text-slate-400">--</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {step.total_sent > 0 ? (
                                  <span className={`text-sm font-medium ${
                                    step.reply_rate > 5 ? 'text-green-600' :
                                    step.reply_rate > 2 ? 'text-amber-600' : 'text-slate-600'
                                  }`}>
                                    {step.reply_rate.toFixed(1)}%
                                  </span>
                                ) : (
                                  <span className="text-slate-400">--</span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                              No email templates configured for this sequence
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
                    <Link
                      href={`/partnership-admin/templates?sequence=${seq.name}`}
                      className="text-sm text-[#0F75BD] hover:underline flex items-center gap-1"
                    >
                      Edit Templates
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/partnership-admin/leads?sequence=${seq.name}`}
                      className="text-sm text-[#0F75BD] hover:underline flex items-center gap-1"
                    >
                      View Leads in Sequence
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}

              {sequences.length === 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No sequences found</h3>
                  <p className="text-slate-500">
                    Make sure you&apos;ve run the database migrations and seeded the email templates.
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
