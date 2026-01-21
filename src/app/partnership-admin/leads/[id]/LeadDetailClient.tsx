'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu,
  ArrowLeft,
  ExternalLink,
  Mail,
  Phone,
  Globe,
  Calendar,
  Clock,
  Check,
  X,
  Pause,
  Play,
  UserCheck,
  UserX,
  Send,
  MousePointerClick,
  RefreshCw,
  Users,
  FileText,
  Activity,
} from 'lucide-react';
import { Sidebar, TierBadge, LeadStatusBadge, EngagementIndicator, PriorityBadge } from '@/components/admin';
import { ComposeEmailModal } from '@/components/admin/ComposeEmailModal';
import { CalculatorLead, LeadStatus, LeadActivity, EmailSend } from '@/types/database';

interface LeadDetailClientProps {
  leadId: string;
  userName: string;
}

const formatCurrency = (amount: number | null) =>
  amount
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount)
    : '-';

const formatDate = (dateString: string | null) =>
  dateString
    ? new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const statusOptions: LeadStatus[] = [
  'new',
  'nurturing',
  'engaged',
  'qualified',
  'in_conversation',
  'signed',
  'lost',
];

const activityIcons: Record<string, typeof Mail> = {
  calculator_submitted: Users,
  email_sent: Mail,
  email_clicked: MousePointerClick,
  email_replied: Mail,
  status_changed: RefreshCw,
  partner_signed: UserCheck,
  application_submitted: UserCheck,
  note_added: FileText,
  unsubscribed: UserX,
};

type Tab = 'overview' | 'emails' | 'activity' | 'notes';

export function LeadDetailClient({ leadId, userName }: LeadDetailClientProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lead, setLead] = useState<CalculatorLead | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [emails, setEmails] = useState<EmailSend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);

  const fetchLead = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/leads/${leadId}`);
      if (response.ok) {
        const data = await response.json();
        setLead(data.lead);
        setNotes(data.lead.notes || '');
      }
    } catch (error) {
      console.error('Failed to fetch lead:', error);
    }
  }, [leadId]);

  const fetchActivities = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/leads/${leadId}/activity`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    }
  }, [leadId]);

  const fetchEmails = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/leads/${leadId}/emails`);
      if (response.ok) {
        const data = await response.json();
        setEmails(data.emails || []);
      }
    } catch (error) {
      console.error('Failed to fetch emails:', error);
    }
  }, [leadId]);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchLead(), fetchActivities(), fetchEmails()]).finally(() => {
      setIsLoading(false);
    });
  }, [fetchLead, fetchActivities, fetchEmails]);

  const updateLead = async (updates: Partial<CalculatorLead>) => {
    try {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        const data = await response.json();
        setLead(data.lead);
        fetchActivities(); // Refresh activity after update
      }
    } catch (error) {
      console.error('Failed to update lead:', error);
    }
  };

  const handleStatusChange = async (newStatus: LeadStatus) => {
    setIsUpdatingStatus(true);
    await updateLead({ status: newStatus });
    setIsUpdatingStatus(false);
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    await updateLead({ notes });
    setIsSavingNotes(false);
  };

  const handleMarkReplied = async () => {
    await updateLead({
      status: 'engaged',
      paused: true,
      paused_reason: 'replied',
      engagement_score: (lead?.engagement_score || 0) + 10,
    } as Partial<CalculatorLead>);
    await fetch(`/api/admin/leads/${leadId}/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity_type: 'email_replied',
        metadata: { manual: true },
      }),
    });
    fetchActivities();
  };

  const handlePauseSequence = async () => {
    await updateLead({
      paused: true,
      paused_reason: 'manual',
    } as Partial<CalculatorLead>);
  };

  const handleResumeSequence = async () => {
    await updateLead({
      paused: false,
      paused_reason: null,
    } as Partial<CalculatorLead>);
  };

  const handleMarkSigned = async () => {
    await updateLead({
      status: 'signed',
      paused: true,
      paused_reason: 'signed',
    } as Partial<CalculatorLead>);
    await fetch(`/api/admin/leads/${leadId}/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity_type: 'partner_signed',
        metadata: {},
      }),
    });
    fetchActivities();
  };

  const handleMarkLost = async () => {
    await updateLead({ status: 'lost' });
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

  if (!lead) {
    return (
      <div className="flex h-screen">
        <Sidebar userName={userName} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-500">Lead not found</p>
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
                href="/partnership-admin/leads"
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold text-slate-900">
                    {lead.name || lead.email}
                  </h1>
                  <EngagementIndicator score={lead.engagement_score} />
                </div>
                <p className="text-sm text-slate-500">{lead.email}</p>
              </div>
            </div>

            {/* Status Dropdown */}
            <select
              value={lead.status}
              onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
              disabled={isUpdatingStatus}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0F75BD] focus:border-transparent outline-none"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
        </header>

        <main className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Info Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500 mb-1">Projected Annual</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatCurrency(lead.projected_annual_earnings || lead.earnings_realistic)}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500 mb-1">Tier</p>
                  <div className="mt-1">
                    <TierBadge tier={lead.earnings_tier} />
                    {!lead.earnings_tier && lead.priority && (
                      <PriorityBadge priority={lead.priority} />
                    )}
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500 mb-1">Status</p>
                  <div className="mt-1">
                    <LeadStatusBadge status={lead.status} />
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500 mb-1">Sequence</p>
                  <p className="text-lg font-medium text-slate-900">
                    {lead.paused ? (
                      <span className="text-amber-600">Paused</span>
                    ) : (
                      `Step ${lead.sequence_step || 0}`
                    )}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-xl border border-slate-200">
                <div className="border-b border-slate-200">
                  <nav className="flex">
                    {(['overview', 'emails', 'activity', 'notes'] as Tab[]).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === tab
                            ? 'border-[#0F75BD] text-[#0F75BD]'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="p-6">
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium text-slate-500 mb-3">Contact Info</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-slate-400" />
                            <a href={`mailto:${lead.email}`} className="text-[#0F75BD] hover:underline">
                              {lead.email}
                            </a>
                          </div>
                          {lead.phone && (
                            <div className="flex items-center gap-3">
                              <Phone className="w-5 h-5 text-slate-400" />
                              <span className="text-slate-900">{lead.phone}</span>
                            </div>
                          )}
                          {lead.website_url && (
                            <div className="flex items-center gap-3">
                              <Globe className="w-5 h-5 text-slate-400" />
                              <a
                                href={lead.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#0F75BD] hover:underline flex items-center gap-1"
                              >
                                {lead.channel_name || lead.website_url}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-slate-500 mb-3">Calculator Data</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {lead.projected_monthly_clicks && (
                            <div>
                              <p className="text-xs text-slate-400">Monthly Clicks</p>
                              <p className="text-slate-900 font-medium">
                                {lead.projected_monthly_clicks.toLocaleString()}
                              </p>
                            </div>
                          )}
                          {lead.click_range_id && (
                            <div>
                              <p className="text-xs text-slate-400">Click Range</p>
                              <p className="text-slate-900 font-medium">{lead.click_range_id}</p>
                            </div>
                          )}
                          {lead.earnings_conservative && (
                            <div>
                              <p className="text-xs text-slate-400">Conservative</p>
                              <p className="text-slate-900 font-medium">
                                {formatCurrency(lead.earnings_conservative)}/yr
                              </p>
                            </div>
                          )}
                          {lead.earnings_realistic && (
                            <div>
                              <p className="text-xs text-slate-400">Realistic</p>
                              <p className="text-slate-900 font-medium">
                                {formatCurrency(lead.earnings_realistic)}/yr
                              </p>
                            </div>
                          )}
                          {lead.earnings_optimistic && (
                            <div>
                              <p className="text-xs text-slate-400">Optimistic</p>
                              <p className="text-slate-900 font-medium">
                                {formatCurrency(lead.earnings_optimistic)}/yr
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-slate-500 mb-3">Dates</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <div>
                              <p className="text-xs text-slate-400">Created</p>
                              <p className="text-slate-900 text-sm">{formatDate(lead.created_at)}</p>
                            </div>
                          </div>
                          {lead.replied_at && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-green-500" />
                              <div>
                                <p className="text-xs text-slate-400">Replied</p>
                                <p className="text-slate-900 text-sm">{formatDate(lead.replied_at)}</p>
                              </div>
                            </div>
                          )}
                          {lead.applied_at && (
                            <div className="flex items-center gap-2">
                              <UserCheck className="w-4 h-4 text-blue-500" />
                              <div>
                                <p className="text-xs text-slate-400">Applied</p>
                                <p className="text-slate-900 text-sm">{formatDate(lead.applied_at)}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Emails Tab */}
                  {activeTab === 'emails' && (
                    <div className="space-y-4">
                      {emails.length > 0 ? (
                        emails.map((email) => (
                          <div
                            key={email.id}
                            className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg"
                          >
                            <div className="p-2 bg-white rounded-lg">
                              <Mail className="w-4 h-4 text-slate-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-slate-900">
                                {email.subject || email.email_type}
                              </p>
                              <p className="text-sm text-slate-500">
                                Sent {formatDate(email.sent_at)}
                              </p>
                              <div className="flex items-center gap-4 mt-2">
                                {email.clicked_at && (
                                  <span className="flex items-center gap-1 text-xs text-green-600">
                                    <MousePointerClick className="w-3 h-3" />
                                    Clicked
                                  </span>
                                )}
                                {email.opened_at && (
                                  <span className="flex items-center gap-1 text-xs text-blue-600">
                                    <Check className="w-3 h-3" />
                                    Opened
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-500 text-center py-8">No emails sent yet</p>
                      )}
                    </div>
                  )}

                  {/* Activity Tab */}
                  {activeTab === 'activity' && (
                    <div className="space-y-4">
                      {activities.length > 0 ? (
                        activities.map((activity) => {
                          const Icon = activityIcons[activity.activity_type] || Activity;
                          return (
                            <div key={activity.id} className="flex items-start gap-4">
                              <div className="p-2 bg-slate-100 rounded-lg">
                                <Icon className="w-4 h-4 text-slate-600" />
                              </div>
                              <div>
                                <p className="text-slate-900">
                                  {activity.activity_type
                                    .replace(/_/g, ' ')
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                </p>
                                <p className="text-sm text-slate-500">
                                  {formatRelativeTime(activity.created_at)}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-slate-500 text-center py-8">No activity yet</p>
                      )}
                    </div>
                  )}

                  {/* Notes Tab */}
                  {activeTab === 'notes' && (
                    <div>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes about this lead..."
                        rows={8}
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0F75BD] focus:border-transparent outline-none resize-none"
                      />
                      <div className="flex justify-end mt-4">
                        <button
                          onClick={handleSaveNotes}
                          disabled={isSavingNotes}
                          className="px-4 py-2 bg-[#0F75BD] text-white rounded-lg hover:bg-[#0a5a94] disabled:opacity-50"
                        >
                          {isSavingNotes ? 'Saving...' : 'Save Notes'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Actions */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-medium text-slate-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  {/* Send Email Button */}
                  <button
                    onClick={() => setShowComposeModal(true)}
                    disabled={lead.unsubscribed}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm bg-[#0F75BD] text-white rounded-lg hover:bg-[#0a5a94] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    Send Email
                  </button>

                  <button
                    onClick={handleMarkReplied}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    <Mail className="w-4 h-4 text-green-500" />
                    Mark as Replied
                  </button>
                  
                  {lead.paused ? (
                    <button
                      onClick={handleResumeSequence}
                      className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
                    >
                      <Play className="w-4 h-4 text-blue-500" />
                      Resume Sequence
                    </button>
                  ) : (
                    <button
                      onClick={handlePauseSequence}
                      className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
                    >
                      <Pause className="w-4 h-4 text-amber-500" />
                      Pause Sequence
                    </button>
                  )}

                  <button
                    onClick={handleMarkSigned}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm border border-green-200 bg-green-50 rounded-lg hover:bg-green-100 text-green-700"
                  >
                    <UserCheck className="w-4 h-4" />
                    Mark as Signed Partner
                  </button>

                  <button
                    onClick={handleMarkLost}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500"
                  >
                    <UserX className="w-4 h-4" />
                    Mark as Lost
                  </button>
                </div>
              </div>

              {/* Sequence Management */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-medium text-slate-900 mb-4">Sequence</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-slate-500 mb-1">Current Sequence</label>
                    <select
                      value={lead.current_sequence || 'calculator_nurture'}
                      onChange={async (e) => {
                        const newSequence = e.target.value;
                        try {
                          const response = await fetch(`/api/admin/leads/${lead.id}/sequence`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ sequence: newSequence }),
                          });
                          if (response.ok) {
                            fetchLead();
                            fetchActivities();
                          }
                        } catch (error) {
                          console.error('Failed to change sequence:', error);
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0F75BD] focus:border-transparent outline-none"
                    >
                      <option value="calculator_nurture">Calculator Nurture</option>
                      <option value="cold_outreach">Cold Outreach</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Step</span>
                    <span className="font-medium text-slate-900">{lead.sequence_step || 0}</span>
                  </div>
                  {lead.next_email_at && !lead.paused && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Next Email</span>
                      <span className="text-slate-900">
                        {new Date(lead.next_email_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Compliance Info */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-medium text-slate-900 mb-4">Compliance</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Marketing Consent</span>
                    {lead.marketing_consent ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <Check className="w-4 h-4" /> Yes
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-400">
                        <X className="w-4 h-4" /> No
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Unsubscribed</span>
                    {lead.unsubscribed ? (
                      <span className="flex items-center gap-1 text-red-600">
                        <Check className="w-4 h-4" /> Yes
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-400">
                        <X className="w-4 h-4" /> No
                      </span>
                    )}
                  </div>
                  {lead.paused && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Pause Reason</span>
                      <span className="text-amber-600 capitalize">
                        {lead.paused_reason || 'Manual'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Compose Email Modal */}
      <ComposeEmailModal
        isOpen={showComposeModal}
        onClose={() => setShowComposeModal(false)}
        lead={{
          id: lead.id,
          email: lead.email,
          name: lead.name,
          channel_name: lead.channel_name,
          projected_monthly_earnings: lead.projected_monthly_earnings,
          projected_annual_earnings: lead.projected_annual_earnings || lead.earnings_realistic,
          monthly_visitors: lead.monthly_visitors,
          click_rate: lead.click_rate,
        }}
        onSent={() => {
          fetchEmails();
          fetchActivities();
        }}
      />
    </div>
  );
}
