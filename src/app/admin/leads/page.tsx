import { createServerClient } from '@/lib/supabase';

const formatCurrency = (amount: number | null) =>
  amount
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount)
    : '-';

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const priorityColors: Record<string, string> = {
  hot: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  standard: 'bg-blue-100 text-blue-700',
  low: 'bg-gray-100 text-gray-700',
};

export default async function LeadsPage() {
  const supabase = createServerClient();

  if (!supabase) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Partner Leads</h1>
        <p className="text-gray-500">Database not configured. Please set up Supabase environment variables.</p>
      </div>
    );
  }

  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .order('lead_score', { ascending: false })
    .limit(100);

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Partner Leads</h1>
        <p className="text-red-500">Error loading leads: {error.message}</p>
      </div>
    );
  }

  // Get stats
  const totalLeads = leads?.length || 0;
  const hotLeads = leads?.filter(l => l.priority === 'hot' || l.priority === 'high').length || 0;
  const totalPotential = leads?.reduce((sum, l) => sum + (l.earnings_realistic || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Partner Leads</h1>
            <p className="text-gray-500">From the Partner Earnings Calculator</p>
          </div>
          <a
            href="/"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to Calculator
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="text-sm text-gray-500 mb-1">Total Leads</div>
            <div className="text-3xl font-bold text-gray-900">{totalLeads}</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="text-sm text-gray-500 mb-1">High-Value Leads</div>
            <div className="text-3xl font-bold text-orange-600">{hotLeads}</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="text-sm text-gray-500 mb-1">Total Potential Revenue</div>
            <div className="text-3xl font-bold text-green-600">{formatCurrency(totalPotential)}</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b bg-gray-50">
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Name</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Email</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Clicks</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Score</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Priority</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Est. Earnings</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {leads && leads.length > 0 ? (
                  leads.map((lead) => (
                    <tr key={lead.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {lead.name || <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{lead.email}</td>
                      <td className="px-4 py-3 text-gray-600">{lead.click_range}</td>
                      <td className="px-4 py-3 text-gray-600">{lead.lead_score || '-'}</td>
                      <td className="px-4 py-3">
                        {lead.priority && (
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              priorityColors[lead.priority] || 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {lead.priority}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-900 font-medium">
                        {formatCurrency(lead.earnings_realistic)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                          {lead.status || 'new'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-sm">
                        {lead.created_at ? formatDate(lead.created_at) : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No leads yet. They&apos;ll appear here when users complete the calculator.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-400 text-center">
          Showing up to 100 most recent leads, sorted by score
        </p>
      </div>
    </div>
  );
}
