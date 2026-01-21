'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Menu,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Check,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { Sidebar, TierBadge, LeadStatusBadge, EngagementIndicator, PriorityBadge } from '@/components/admin';
import { CalculatorLead, LeadStatus, EarningsTier } from '@/types/database';

interface LeadsListClientProps {
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

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const statusOptions: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'nurturing', label: 'Nurturing' },
  { value: 'engaged', label: 'Engaged' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'in_conversation', label: 'In Conversation' },
  { value: 'signed', label: 'Signed' },
  { value: 'lost', label: 'Lost' },
];

const tierOptions: { value: EarningsTier; label: string }[] = [
  { value: 'starter', label: 'Starter' },
  { value: 'growth', label: 'Growth' },
  { value: 'scale', label: 'Scale' },
  { value: 'enterprise', label: 'Enterprise' },
];

export function LeadsListClient({ userName }: LeadsListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [leads, setLeads] = useState<CalculatorLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filter states
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedStatuses, setSelectedStatuses] = useState<LeadStatus[]>(
    (searchParams.get('status')?.split(',') as LeadStatus[]) || []
  );
  const [selectedTiers, setSelectedTiers] = useState<EarningsTier[]>(
    (searchParams.get('tier')?.split(',') as EarningsTier[]) || []
  );
  const [showFilters, setShowFilters] = useState(false);

  const filter = searchParams.get('filter');
  const page = parseInt(searchParams.get('page') || '1');
  const sort = searchParams.get('sort') || 'created_at';
  const order = searchParams.get('order') || 'desc';

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedStatuses.length) params.set('status', selectedStatuses.join(','));
      if (selectedTiers.length) params.set('tier', selectedTiers.join(','));
      if (filter) params.set('filter', filter);
      params.set('page', page.toString());
      params.set('sort', sort);
      params.set('order', order);

      const response = await fetch(`/api/admin/leads?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedStatuses, selectedTiers, filter, page, sort, order]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    router.push(`/partnership-admin/leads?${params.toString()}`);
  };

  const handleSort = (field: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === field) {
      params.set('order', order === 'asc' ? 'desc' : 'asc');
    } else {
      params.set('sort', field);
      params.set('order', 'desc');
    }
    params.set('page', '1');
    router.push(`/partnership-admin/leads?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/partnership-admin/leads?${params.toString()}`);
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (selectedStatuses.length) params.set('status', selectedStatuses.join(','));
    if (selectedTiers.length) params.set('tier', selectedTiers.join(','));
    if (filter) params.set('filter', filter);
    params.set('page', '1');
    router.push(`/partnership-admin/leads?${params.toString()}`);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedStatuses([]);
    setSelectedTiers([]);
    router.push('/partnership-admin/leads');
    setShowFilters(false);
  };

  const pageTitle = filter === 'hot' ? 'Hot Prospects' : 'All Leads';

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
                <h1 className="text-xl font-semibold text-slate-900">{pageTitle}</h1>
                <p className="text-sm text-slate-500">
                  {total} lead{total !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <form onSubmit={handleSearch} className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search leads..."
                  className="w-64 pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0F75BD] focus:border-transparent outline-none text-sm"
                />
              </form>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
                  showFilters || selectedStatuses.length || selectedTiers.length
                    ? 'border-[#0F75BD] text-[#0F75BD] bg-blue-50'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {(selectedStatuses.length > 0 || selectedTiers.length > 0) && (
                  <span className="bg-[#0F75BD] text-white text-xs px-1.5 py-0.5 rounded-full">
                    {selectedStatuses.length + selectedTiers.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSelectedStatuses((prev) =>
                            prev.includes(option.value)
                              ? prev.filter((s) => s !== option.value)
                              : [...prev, option.value]
                          );
                        }}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                          selectedStatuses.includes(option.value)
                            ? 'border-[#0F75BD] bg-[#0F75BD] text-white'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Earnings Tier
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tierOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSelectedTiers((prev) =>
                            prev.includes(option.value)
                              ? prev.filter((t) => t !== option.value)
                              : [...prev, option.value]
                          );
                        }}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                          selectedTiers.includes(option.value)
                            ? 'border-[#0F75BD] bg-[#0F75BD] text-white'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-4">
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900"
                >
                  Clear all
                </button>
                <button
                  onClick={applyFilters}
                  className="px-4 py-1.5 text-sm bg-[#0F75BD] text-white rounded-lg hover:bg-[#0a5a94]"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Table */}
        <main className="p-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-900"
                      onClick={() => handleSort('name')}
                    >
                      Name / Email
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">
                      Website / Channel
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">
                      Tier
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-900"
                      onClick={() => handleSort('projected_annual_earnings')}
                    >
                      Projected
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-900"
                      onClick={() => handleSort('engagement_score')}
                    >
                      Engagement
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">
                      Consent
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-900"
                      onClick={() => handleSort('created_at')}
                    >
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F75BD] mx-auto"></div>
                      </td>
                    </tr>
                  ) : leads.length > 0 ? (
                    leads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                        onClick={() => router.push(`/partnership-admin/leads/${lead.id}`)}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">
                            {lead.name || <span className="text-slate-400">No name</span>}
                          </p>
                          <p className="text-sm text-slate-500">{lead.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          {lead.website_url ? (
                            <a
                              href={lead.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-sm text-[#0F75BD] hover:underline flex items-center gap-1"
                            >
                              {lead.channel_name || new URL(lead.website_url).hostname}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <TierBadge tier={lead.earnings_tier} size="sm" />
                          {!lead.earnings_tier && lead.priority && (
                            <PriorityBadge priority={lead.priority} size="sm" />
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {formatCurrency(lead.projected_annual_earnings || lead.earnings_realistic)}
                          <span className="text-slate-400 font-normal">/yr</span>
                        </td>
                        <td className="px-4 py-3">
                          <EngagementIndicator score={lead.engagement_score} size="sm" />
                        </td>
                        <td className="px-4 py-3">
                          <LeadStatusBadge status={lead.status} size="sm" />
                        </td>
                        <td className="px-4 py-3">
                          {lead.marketing_consent ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <X className="w-4 h-4 text-slate-300" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {formatDate(lead.created_at)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                        No leads found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Showing {(page - 1) * 25 + 1} - {Math.min(page * 25, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-slate-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
