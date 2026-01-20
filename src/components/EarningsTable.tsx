'use client';

import { formatCurrency, formatPercent, type EarningsCalculation } from '@/lib/calculations';

interface EarningsTableProps {
  calculation: EarningsCalculation;
}

export function EarningsTable({ calculation }: EarningsTableProps) {
  const scenarios = [
    { key: 'conservative', data: calculation.conservative, highlight: false },
    { key: 'realistic', data: calculation.realistic, highlight: true },
    { key: 'optimistic', data: calculation.optimistic, highlight: false },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <th className="px-6 py-4">Scenario</th>
              <th className="px-6 py-4">Conversion</th>
              <th className="px-6 py-4">Avg Commission</th>
              <th className="px-6 py-4 text-right">Monthly</th>
              <th className="px-6 py-4 text-right">Annual</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {scenarios.map(({ key, data, highlight }) => (
              <tr 
                key={key}
                className={`border-t border-gray-100 ${highlight ? 'bg-up-light-blue' : ''}`}
              >
                <td className="px-6 py-4">
                  <span className={`${highlight ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                    {data.name}
                  </span>
                  {highlight && (
                    <span className="ml-2 text-xs text-up-blue font-normal">Most likely</span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {formatPercent(data.conversionRate * 100)}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {formatCurrency(data.avgCommission)}
                </td>
                <td className={`px-6 py-4 text-right ${highlight ? 'text-up-blue font-medium' : 'text-gray-700'}`}>
                  {formatCurrency(data.monthlyEarnings)}
                </td>
                <td className={`px-6 py-4 text-right ${highlight ? 'text-up-blue font-bold' : 'text-gray-700'}`}>
                  {formatCurrency(data.annualEarnings)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden">
        {scenarios.map(({ key, data, highlight }) => (
          <div 
            key={`mobile-${key}`}
            className={`p-4 border-b border-gray-100 last:border-b-0 ${highlight ? 'bg-up-light-blue' : ''}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`font-medium ${highlight ? 'text-gray-900' : 'text-gray-700'}`}>
                {data.name}
              </span>
              {highlight && (
                <span className="text-xs text-up-blue">Most likely</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-400">Conversion:</span>{' '}
                <span className="text-gray-600">{formatPercent(data.conversionRate * 100)}</span>
              </div>
              <div>
                <span className="text-gray-400">Avg Comm:</span>{' '}
                <span className="text-gray-600">{formatCurrency(data.avgCommission)}</span>
              </div>
              <div>
                <span className="text-gray-400">Monthly:</span>{' '}
                <span className={`font-medium ${highlight ? 'text-up-blue' : ''}`}>
                  {formatCurrency(data.monthlyEarnings)}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Annual:</span>{' '}
                <span className={`font-bold ${highlight ? 'text-up-blue' : ''}`}>
                  {formatCurrency(data.annualEarnings)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer note */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          * Based on {calculation.monthlyClicks.toLocaleString()} monthly clicks at 65% commission share. 
          Actual results depend on card mix, audience quality, and content placement.
        </p>
      </div>
    </div>
  );
}
