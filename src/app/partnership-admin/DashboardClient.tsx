'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Flame,
  Trophy,
  DollarSign,
  ArrowRight,
  Menu,
  Clock,
  Mail,
  MousePointerClick,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import { Sidebar, StatCard, TierBadge, PriorityBadge, EngagementIndicator } from '@/components/admin';
import { EarningsTier, Priority, LeadStatus } from '@/types/database';

interface Stats {
  total_leads: number;
  new_this_week: number;
  hot_prospects: number;
  enterprise_tier: number;
  total_pipeline_value: number;
  by_tier: Record<string, number>;
  by_status: Record<string, number>;
}

interface HotLead {
  id: string;
  name: string | null;
  email: string;
  earnings_tier: EarningsTier | null;
  projected_annual_earnings: number | null;
  engagement_score: number;
  priority: Priority | null;
  status: LeadStatus;
  created_at: string;
}

interface Activity {
  id: string;
  activity_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  lead?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  calculator_leads?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface DashboardClientProps {
  userName: string;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

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

const activityIcons: Record<string, typeof Mail> = {
  calculator_submitted: Users,
  email_sent: Mail,
  email_clicked: MousePointerClick,
  email_replied: Mail,
  status_changed: RefreshCw,
  partner_signed: UserCheck,
  application_submitted: UserCheck,
};

export function DashboardClient({ userName }: DashboardClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [hotLeads, setHotLeads] = useState<HotLead[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [statsRes, leadsRes, activityRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/hot-leads'),
          fetch('/api/admin/activity'),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (leadsRes.ok) {
          const leadsData = await leadsRes.json();
          setHotLeads(leadsData.leads || []);
        }

        if (activityRes.ok) {
          const activityData = await activityRes.json();
          setActivities(activityData.activities || []);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

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
                <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
                <p className="text-sm text-slate-500">Partnership CRM Overview</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F75BD]"></div>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                  label="New This Week"
                  value={stats?.new_this_week || 0}
                  icon={Users}
                  color="blue"
                />
                <StatCard
                  label="Hot Prospects"
                  value={stats?.hot_prospects || 0}
                  icon={Flame}
                  color="orange"
                />
                <StatCard
                  label="Enterprise Tier"
                  value={stats?.enterprise_tier || 0}
                  icon={Trophy}
                  color="purple"
                />
                <StatCard
                  label="Pipeline Value"
                  value={formatCurrency(stats?.total_pipeline_value || 0)}
                  icon={DollarSign}
                  color="green"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hot Leads Panel */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-500" />
                      <h2 className="font-semibold text-slate-900">Hot Leads</h2>
                    </div>
                    <Link
                      href="/partnership-admin/leads?filter=hot"
                      className="text-sm text-[#0F75BD] hover:underline flex items-center gap-1"
                    >
                      View all <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {hotLeads.length > 0 ? (
                      hotLeads.slice(0, 5).map((lead) => (
                        <Link
                          key={lead.id}
                          href={`/partnership-admin/leads/${lead.id}`}
                          className="block px-6 py-4 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-slate-900">
                                {lead.name || lead.email}
                              </p>
                              {lead.name && (
                                <p className="text-sm text-slate-500">{lead.email}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-slate-900">
                                {lead.projected_annual_earnings
                                  ? formatCurrency(lead.projected_annual_earnings)
                                  : '-'}
                                <span className="text-slate-400 font-normal">/yr</span>
                              </p>
                              <div className="flex items-center gap-2 mt-1 justify-end">
                                <TierBadge tier={lead.earnings_tier} size="sm" />
                                <EngagementIndicator score={lead.engagement_score} size="sm" />
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="px-6 py-8 text-center text-slate-500">
                        No hot leads yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Activity Panel */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-slate-500" />
                      <h2 className="font-semibold text-slate-900">Recent Activity</h2>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-96 overflow-auto">
                    {activities.length > 0 ? (
                      activities.map((activity) => {
                        const lead = activity.calculator_leads || activity.lead;
                        const Icon = activityIcons[activity.activity_type] || Clock;
                        const activityLabel = activity.activity_type
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (l) => l.toUpperCase());

                        return (
                          <div key={activity.id} className="px-6 py-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-slate-100 rounded-lg">
                                <Icon className="w-4 h-4 text-slate-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-900">
                                  <span className="font-medium">
                                    {lead?.name || lead?.email || 'Unknown'}
                                  </span>{' '}
                                  <span className="text-slate-500">{activityLabel}</span>
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {formatRelativeTime(activity.created_at)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-6 py-8 text-center text-slate-500">
                        No recent activity
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tier Distribution */}
              {stats && (
                <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <h2 className="font-semibold text-slate-900 mb-4">
                    Leads by Earnings Tier
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(['starter', 'growth', 'scale', 'enterprise'] as const).map((tier) => {
                      const count = stats.by_tier[tier] || 0;
                      const total = stats.total_leads || 1;
                      const percentage = Math.round((count / total) * 100);

                      return (
                        <Link
                          key={tier}
                          href={`/partnership-admin/leads?tier=${tier}`}
                          className="p-4 border border-slate-200 rounded-xl hover:border-[#0F75BD] transition-colors group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <TierBadge tier={tier} />
                            <span className="text-lg font-semibold text-slate-900">{count}</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#0F75BD] transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{percentage}% of leads</p>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
