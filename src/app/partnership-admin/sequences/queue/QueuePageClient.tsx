'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Menu,
  ArrowLeft,
  Clock,
  Pause,
  SkipForward,
  Check,
  Loader2,
  Calendar,
  Mail,
} from 'lucide-react';
import { Sidebar } from '@/components/admin';

interface QueuePageClientProps {
  userName: string;
}

interface QueuedEmail {
  id: string;
  email: string;
  name: string | null;
  channel_name: string | null;
  sequence: string;
  sequence_display: string;
  step: number;
  scheduled_at: string;
  subject: string;
}

type FilterType = 'today' | 'tomorrow' | 'week' | 'all';

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMs < 0) return 'Overdue';
  if (diffMins < 60) return `In ${diffMins}m`;
  if (diffHours < 24) return `In ${diffHours}h`;
  return `In ${Math.floor(diffHours / 24)}d`;
};

export function QueuePageClient({ userName }: QueuePageClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [queue, setQueue] = useState<QueuedEmail[]>([]);
  const [counts, setCounts] = useState({ today: 0, tomorrow: 0, week: 0 });
  const [filter, setFilter] = useState<FilterType>('today');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchQueue();
  }, [filter]);

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/sequences/queue?filter=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setQueue(data.queue || []);
        setCounts(data.counts || { today: 0, tomorrow: 0, week: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch queue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === queue.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(queue.map((q) => q.id)));
    }
  };

  const handleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkAction = async (action: 'pause' | 'skip') => {
    if (selectedIds.size === 0) return;

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/sequences/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, leadIds: Array.from(selectedIds) }),
      });

      if (response.ok) {
        setSelectedIds(new Set());
        fetchQueue();
      }
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: 'today', label: 'Today', count: counts.today },
    { key: 'tomorrow', label: 'Tomorrow', count: counts.tomorrow },
    { key: 'week', label: 'This Week', count: counts.week },
    { key: 'all', label: 'All', count: 0 },
  ];

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
              <Link
                href="/partnership-admin/sequences"
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Email Queue</h1>
                <p className="text-sm text-slate-500">Scheduled emails waiting to be sent</p>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600">{selectedIds.size} selected</span>
                <button
                  onClick={() => handleBulkAction('pause')}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 disabled:opacity-50"
                >
                  <Pause className="w-4 h-4" />
                  Pause Selected
                </button>
                <button
                  onClick={() => handleBulkAction('skip')}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                >
                  <SkipForward className="w-4 h-4" />
                  Skip to Next Step
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="p-6">
          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f.key
                    ? 'bg-[#0F75BD] text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {f.label}
                {f.key !== 'all' && f.count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    filter === f.key ? 'bg-white/20' : 'bg-slate-100'
                  }`}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Queue Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#0F75BD] animate-spin" />
              </div>
            ) : queue.length > 0 ? (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === queue.length && queue.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 text-[#0F75BD] focus:ring-[#0F75BD]"
                      />
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Lead</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Email</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Sequence</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Step</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Scheduled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queue.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => handleSelect(item.id)}
                          className="w-4 h-4 rounded border-slate-300 text-[#0F75BD] focus:ring-[#0F75BD]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/partnership-admin/leads/${item.id}`}
                          className="text-sm font-medium text-slate-900 hover:text-[#0F75BD]"
                        >
                          {item.name || 'Unknown'}
                        </Link>
                        {item.channel_name && (
                          <p className="text-xs text-slate-500">{item.channel_name}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{item.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          item.sequence === 'calculator_nurture'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          <Mail className="w-3 h-3" />
                          {item.sequence_display}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-200 text-slate-600 rounded-full text-xs font-medium">
                            {item.step}
                          </span>
                          <span className="text-sm text-slate-600 max-w-[200px] truncate" title={item.subject}>
                            {item.subject}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-sm text-slate-900">{formatRelativeTime(item.scheduled_at)}</p>
                            <p className="text-xs text-slate-500">{formatDateTime(item.scheduled_at)}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No emails scheduled</h3>
                <p className="text-slate-500">
                  {filter === 'today' && 'No emails are scheduled for today'}
                  {filter === 'tomorrow' && 'No emails are scheduled for tomorrow'}
                  {filter === 'week' && 'No emails are scheduled this week'}
                  {filter === 'all' && 'No emails are currently in the queue'}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
