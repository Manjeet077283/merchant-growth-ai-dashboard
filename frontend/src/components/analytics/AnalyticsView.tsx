import React from 'react';
import { DashboardMetricsResponse } from '../../types';
import { RevenueChart } from '../dashboard/RevenueChart';
import { HourlyTrafficChart } from '../dashboard/HourlyTrafficChart';
import { SalesDistributionChart } from '../dashboard/SalesDistributionChart';
import {
  TrendingUp,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface AnalyticsViewProps {
  metrics: DashboardMetricsResponse | null;
  selectedDays: number;
  onDaysChange: (days: number) => void;
  onOpenAiChat: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  metrics,
  selectedDays,
  onDaysChange,
  onOpenAiChat,
}) => {
  if (!metrics) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-slate-400">
        Loading analytics dataset...
      </div>
    );
  }

  const { kpis, revenue_trends, category_breakdown, status_breakdown, hourly_trends } = metrics;

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#172B4D] tracking-tight">Sales Analytics</h2>
          <p className="text-xs text-[#6B7A90]">
            Multi-dimensional payment trajectory &amp; customer behavior
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200/80 shadow-2xs">
          {[7, 30, 60, 90].map((days) => (
            <button
              key={days}
              onClick={() => onDaysChange(days)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedDays === days
                  ? 'bg-[#0070E0] text-white shadow-2xs'
                  : 'text-[#6B7A90] hover:text-[#172B4D] hover:bg-[#F5F7FA]'
              }`}
            >
              Last {days} Days
            </button>
          ))}
        </div>
      </div>

      {/* Analytics High-level Comparative Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(23,43,77,0.03)]">
          <div className="text-[11px] font-bold text-[#6B7A90] uppercase">Gross Volume ({selectedDays}d)</div>
          <div className="text-xl font-extrabold text-[#172B4D] mt-1.5">
            ${kpis.gross_sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">
            {kpis.sales_growth_pct >= 0 ? `+${kpis.sales_growth_pct}%` : `${kpis.sales_growth_pct}%`} vs prior
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(23,43,77,0.03)]">
          <div className="text-[11px] font-bold text-[#6B7A90] uppercase">Captured Orders</div>
          <div className="text-xl font-extrabold text-[#172B4D] mt-1.5">{kpis.captured_order_count}</div>
          <div className="text-[11px] text-[#0070E0] font-bold mt-1">
            {kpis.order_growth_pct >= 0 ? `+${kpis.order_growth_pct}%` : `${kpis.order_growth_pct}%`} rate
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(23,43,77,0.03)]">
          <div className="text-[11px] font-bold text-[#6B7A90] uppercase">Average Order Value</div>
          <div className="text-xl font-extrabold text-[#172B4D] mt-1.5">${kpis.average_order_value.toFixed(2)}</div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">
            {kpis.aov_growth_pct >= 0 ? `+${kpis.aov_growth_pct}%` : `${kpis.aov_growth_pct}%`} expansion
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(23,43,77,0.03)]">
          <div className="text-[11px] font-bold text-[#6B7A90] uppercase">Net Revenue Retained</div>
          <div className="text-xl font-extrabold text-emerald-600 mt-1.5">
            ${kpis.net_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            After ${kpis.estimated_fees.toFixed(2)} PayPal fees
          </div>
        </div>
      </div>

      {/* Main Revenue Trend Chart */}
      <RevenueChart data={revenue_trends} title={`Daily Revenue Performance (${selectedDays} Days)`} />

      {/* Hourly Traffic & Category Distribution */}
      <HourlyTrafficChart data={hourly_trends} />
      <SalesDistributionChart categories={category_breakdown} statuses={status_breakdown} />
    </div>
  );
};
