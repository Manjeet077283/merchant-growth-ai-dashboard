import React from 'react';
import { CategoryBreakdown, StatusBreakdown } from '../../types';
import { Badge } from '../common/Badge';

interface SalesDistributionProps {
  categories: CategoryBreakdown[];
  statuses: StatusBreakdown[];
}

export const SalesDistributionChart: React.FC<SalesDistributionProps> = ({
  categories,
  statuses,
}) => {
  const categoryColors = ['bg-blue-600', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Category Share */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-1">Sales by Product Category</h3>
        <p className="text-xs text-slate-500 mb-4">Volume breakdown across coffee lines & gear</p>

        <div className="space-y-3.5">
          {categories.map((cat, idx) => (
            <div key={cat.category}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">{cat.category}</span>
                <span className="text-slate-500">
                  <span className="font-bold text-slate-900">${cat.revenue.toFixed(2)}</span> ({cat.percentage}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${categoryColors[idx % categoryColors.length]}`}
                  style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Status Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-1">Payment Status Health</h3>
        <p className="text-xs text-slate-500 mb-4">Verification of captured vs refunded Sandbox orders</p>

        <div className="grid grid-cols-2 gap-3">
          {statuses.map((item) => (
            <div key={item.status} className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70">
              <div className="mb-2">
                <Badge status={item.status} />
              </div>
              <div className="text-xl font-black text-slate-900 tracking-tight">
                {item.count} <span className="text-xs font-normal text-slate-400">orders</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                ${item.amount.toFixed(2)} ({item.percentage}%)
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
