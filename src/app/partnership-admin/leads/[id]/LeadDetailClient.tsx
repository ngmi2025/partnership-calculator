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
  Linkedin,
  Youtube,
  Twitter,
  Eye,
} from 'lucide-react';
import { Sidebar, TierBadge, LeadStatusBadge, EngagementIndicator, PriorityBadge } from '@/components/admin';
import { ComposeEmailModal } from '@/components/admin/ComposeEmailModal';
import { CalculatorLead, LeadStatus, LeadActivity, EmailSend } from '@/types/database';

interface LeadDetailClientProps {
  leadId: string;
  userName: string;
}

// Extended lead type with new fields
interface ExtendedLead extends CalculatorLead {
  linkedin_url?: string | null;
  youtube_url?: string | null;
  twitter_handle?: string | null;
  subscribers?: number | null;
  content_niche?: string | null;
  last_contacted_at?: string | null;
  last_replied_at?: string | null;
  call_scheduled_at?: string | null;
  next_followup_at?: string | null;
  next_action?: string | null;
  email_opens?: number;
  email_clicks?: number;
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

const formatShortDate = (dateString: string | null) =>
  dateString
    ? new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : 'Never';

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
  'applied',
  'call_scheduled',
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

const contentNiches = [
  'Travel Rewards',
  'Credit Cards',
  'Points & Miles',
  'Budget Travel',
  'Luxury Travel',
  'Personal Finance',
  'Flight Deals',
  'Hotel Reviews',
  'Other',
];

const leadSources = [
  'calculator',
  'manual_research',
  'modash',
  'feedspot',
  'izea',
  'referral',
  'inbound',
  'csv_import',
  'manual_import',
  'other',
];

type Tab = 'overview' | 'emails' | 'activity' | 'notes';

export function LeadDetailClient({ leadId, userName }: LeadDetailClientProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lead, setLead] = useState<ExtendedLead | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [emails, setEmails] = useState<EmailSend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);

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

  const updateLead = async (updates: Partial<ExtendedLead>) => {
    try {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        const data = await response.json();
        setLead(data.lead);
        fetchActivities();
      }
    } catch (error) {
      console.error('Failed to update lead:', error);
    }
  };

  const handleFieldUpdate = async (field: string, value: unknown) => {
    setEditingField(null);
    await updateLead({ [field]: value } as Partial<ExtendedLead>);
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
      last_replied_at: new Date().toISOString(),
    } as Partial<ExtendedLead>);
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
    } as Partial<ExtendedLead>);
  };

  const handleResumeSequence = async () => {
    await updateLead({
      paused: false,
      paused_reason: null,
    } as Partial<ExtendedLead>);
  };

  const handleMarkSigned = async () => {
    await updateLead({
      status: 'signed',
      paused: true,
      paused_reason: 'signed',
    } as Partial<ExtendedLead>);
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
                      {/* Contact Info */}
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
                          {lead.channel_name && (
                            <div className="flex items-center gap-3">
                              <Users className="w-5 h-5 text-slate-400" />
                              <span className="text-slate-900">{lead.channel_name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Social & Channel Links */}
                      <div>
                        <h3 className="text-sm font-medium text-slate-500 mb-3">Social & Channel Links</h3>
                        <div className="space-y-3">
                          {/* LinkedIn */}
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#0A66C2] rounded flex items-center justify-center flex-shrink-0">
                              <Linkedin className="w-4 h-4 text-white" />
                            </div>
                            {editingField === 'linkedin_url' ? (
                              <input
                                type="url"
                                defaultValue={lead.linkedin_url || ''}
                                onBlur={(e) => handleFieldUpdate('linkedin_url', e.target.value || null)}
                                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-[#0F75BD]"
                                placeholder="https://linkedin.com/in/..."
                                autoFocus
                              />
                            ) : lead.linkedin_url ? (
                              <a
                                href={lead.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#0F75BD] hover:underline truncate flex-1"
                              >
                                {lead.linkedin_url.replace('https://www.linkedin.com/in/', '').replace('https://linkedin.com/in/', '').replace('/', '')}
                              </a>
                            ) : (
                              <button
                                onClick={() => setEditingField('linkedin_url')}
                                className="text-slate-400 hover:text-slate-600 text-sm"
                              >
                                + Add LinkedIn
                              </button>
                            )}
                          </div>

                          {/* YouTube */}
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#FF0000] rounded flex items-center justify-center flex-shrink-0">
                              <Youtube className="w-4 h-4 text-white" />
                            </div>
                            {editingField === 'youtube_url' ? (
                              <input
                                type="url"
                                defaultValue={lead.youtube_url || ''}
                                onBlur={(e) => handleFieldUpdate('youtube_url', e.target.value || null)}
                                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-[#0F75BD]"
                                placeholder="https://youtube.com/@..."
                                autoFocus
                              />
                            ) : lead.youtube_url ? (
                              <a
                                href={lead.youtube_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#0F75BD] hover:underline truncate flex-1"
                              >
                                {lead.youtube_url.replace('https://www.youtube.com/', '').replace('https://youtube.com/', '')}
                              </a>
                            ) : (
                              <button
                                onClick={() => setEditingField('youtube_url')}
                                className="text-slate-400 hover:text-slate-600 text-sm"
                              >
                                + Add YouTube
                              </button>
                            )}
                          </div>

                          {/* Twitter/X */}
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-black rounded flex items-center justify-center flex-shrink-0">
                              <Twitter className="w-4 h-4 text-white" />
                            </div>
                            {editingField === 'twitter_handle' ? (
                              <input
                                type="text"
                                defaultValue={lead.twitter_handle || ''}
                                onBlur={(e) => handleFieldUpdate('twitter_handle', e.target.value || null)}
                                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-[#0F75BD]"
                                placeholder="@username"
                                autoFocus
                              />
                            ) : lead.twitter_handle ? (
                              <a
                                href={`https://twitter.com/${lead.twitter_handle.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#0F75BD] hover:underline"
                              >
                                @{lead.twitter_handle.replace('@', '')}
                              </a>
                            ) : (
                              <button
                                onClick={() => setEditingField('twitter_handle')}
                                className="text-slate-400 hover:text-slate-600 text-sm"
                              >
                                + Add Twitter/X
                              </button>
                            )}
                          </div>

                          {/* Website */}
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-500 rounded flex items-center justify-center flex-shrink-0">
                              <Globe className="w-4 h-4 text-white" />
                            </div>
                            {editingField === 'website_url' ? (
                              <input
                                type="url"
                                defaultValue={lead.website_url || ''}
                                onBlur={(e) => handleFieldUpdate('website_url', e.target.value || null)}
                                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-[#0F75BD]"
                                placeholder="https://example.com"
                                autoFocus
                              />
                            ) : lead.website_url ? (
                              <a
                                href={lead.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#0F75BD] hover:underline truncate flex-1 flex items-center gap-1"
                              >
                                {lead.website_url.replace('https://', '').replace('http://', '').replace('www.', '')}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <button
                                onClick={() => setEditingField('website_url')}
                                className="text-slate-400 hover:text-slate-600 text-sm"
                              >
                                + Add Website
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Prospect Context */}
                      <div>
                        <h3 className="text-sm font-medium text-slate-500 mb-3">Prospect Context</h3>
                        <div className="grid grid-cols-3 gap-4">
                          {/* Subscribers */}
                          <div>
                            <label className="text-xs text-slate-400">Subscribers</label>
                            {editingField === 'subscribers' ? (
                              <input
                                type="text"
                                defaultValue={lead.subscribers?.toLocaleString() || ''}
                                onBlur={(e) => handleFieldUpdate('subscribers', parseInt(e.target.value.replace(/[^0-9]/g, '')) || null)}
                                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-[#0F75BD]"
                                placeholder="e.g., 50000"
                                autoFocus
                              />
                            ) : (
                              <p
                                className="font-medium cursor-pointer hover:text-[#0F75BD]"
                                onClick={() => setEditingField('subscribers')}
                              >
                                {lead.subscribers ? lead.subscribers.toLocaleString() : <span className="text-slate-400">+ Add</span>}
                              </p>
                            )}
                          </div>

                          {/* Content Niche */}
                          <div>
                            <label className="text-xs text-slate-400">Niche</label>
                            {editingField === 'content_niche' ? (
                              <select
                                defaultValue={lead.content_niche || ''}
                                onChange={(e) => handleFieldUpdate('content_niche', e.target.value || null)}
                                onBlur={() => setEditingField(null)}
                                className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-[#0F75BD]"
                                autoFocus
                              >
                                <option value="">Select...</option>
                                {contentNiches.map((niche) => (
                                  <option key={niche} value={niche}>{niche}</option>
                                ))}
                              </select>
                            ) : (
                              <p
                                className="font-medium cursor-pointer hover:text-[#0F75BD]"
                                onClick={() => setEditingField('content_niche')}
                              >
                                {lead.content_niche || <span className="text-slate-400">+ Add</span>}
                              </p>
                            )}
                          </div>

                          {/* Lead Source */}
                          <div>
                            <label className="text-xs text-slate-400">Source</label>
                            {editingField === 'lead_source' ? (
                              <select
                                defaultValue={lead.lead_source || ''}
                                onChange={(e) => handleFieldUpdate('lead_source', e.target.value || null)}
                                onBlur={() => setEditingField(null)}
                                className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-[#0F75BD]"
                                autoFocus
                              >
                                <option value="">Select...</option>
                                {leadSources.map((source) => (
                                  <option key={source} value={source}>
                                    {source.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <p
                                className="font-medium cursor-pointer hover:text-[#0F75BD]"
                                onClick={() => setEditingField('lead_source')}
                              >
                                {lead.lead_source ? lead.lead_source.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : <span className="text-slate-400">+ Add</span>}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Calculator Data */}
                      {(lead.projected_monthly_clicks || lead.click_range_id || lead.earnings_conservative) && (
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
                      )}

                      {/* Dates */}
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
                          {lead.last_replied_at && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-green-500" />
                              <div>
                                <p className="text-xs text-slate-400">Replied</p>
                                <p className="text-slate-900 text-sm">{formatDate(lead.last_replied_at)}</p>
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
                          {lead.call_scheduled_at && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-purple-500" />
                              <div>
                                <p className="text-xs text-slate-400">Call Scheduled</p>
                                <p className="text-slate-900 text-sm">{formatDate(lead.call_scheduled_at)}</p>
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
              {/* Quick Actions */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-medium text-slate-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
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

              {/* Next Action */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h3 className="text-sm font-medium text-amber-800 mb-2">Next Action</h3>
                {editingField === 'next_action' ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      defaultValue={lead.next_action || ''}
                      onBlur={(e) => handleFieldUpdate('next_action', e.target.value || null)}
                      className="w-full px-2 py-1 border border-amber-300 rounded text-sm bg-white"
                      placeholder="e.g., Follow up on LinkedIn"
                      autoFocus
                    />
                    <input
                      type="date"
                      defaultValue={lead.next_followup_at?.split('T')[0] || ''}
                      onChange={(e) => handleFieldUpdate('next_followup_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
                      className="w-full px-2 py-1 border border-amber-300 rounded text-sm bg-white"
                    />
                  </div>
                ) : lead.next_action ? (
                  <div
                    className="cursor-pointer hover:bg-amber-100 -m-2 p-2 rounded"
                    onClick={() => setEditingField('next_action')}
                  >
                    <p className="text-sm font-medium text-amber-900">{lead.next_action}</p>
                    {lead.next_followup_at && (
                      <p className="text-xs text-amber-700 mt-1">
                        Due: {new Date(lead.next_followup_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingField('next_action')}
                    className="text-sm text-amber-700 hover:text-amber-900"
                  >
                    + Set next action
                  </button>
                )}
              </div>

              {/* Engagement Stats */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-medium text-slate-900 mb-4">Engagement</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 flex items-center gap-2">
                      <Eye className="w-4 h-4" /> Email Opens
                    </span>
                    <span className="font-medium">{lead.email_opens || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 flex items-center gap-2">
                      <MousePointerClick className="w-4 h-4" /> Email Clicks
                    </span>
                    <span className="font-medium">{lead.email_clicks || 0}</span>
                  </div>
                  <div className="border-t border-slate-100 pt-3 mt-3">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-slate-500">Last Contacted</span>
                      <span className="font-medium">{formatShortDate(lead.last_contacted_at || null)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Last Replied</span>
                      <span className="font-medium">{formatShortDate(lead.last_replied_at || null)}</span>
                    </div>
                  </div>
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
