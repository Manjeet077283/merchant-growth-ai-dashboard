import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { RevenueTrendPoint } from '../../types';

interface RevenueChartProps {
  data: RevenueTrendPoint[];
  title?: string;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
  data,
  title = 'Overview',
}) => {
  const [metricView, setMetricView] = useState<'revenue' | 'orders'>('revenue');

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 flex items-center justify-center h-80 text-slate-400">
        No sales trend records found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-7 shadow-[0_10px_30px_rgba(23,43,77,0.03)] flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-50">
        <div>
          <h2 className="text-lg font-bold text-[#172B4D] tracking-tight">{title}</h2>
          <p className="text-xs text-[#5E6C84]">Monthly captured sales trajectory & trends</p>
        </div>

        {/* Minimal Toggle */}
        <div className="flex items-center gap-1 bg-[#F5F7FA] p-1 rounded-2xl text-xs font-semibold">
          <button
            onClick={() => setMetricView('revenue')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              metricView === 'revenue'
                ? 'bg-white text-[#0070E0] shadow-sm font-bold'
                : 'text-[#6B7A90] hover:text-[#172B4D]'
            }`}
          >
            Revenue ($)
          </button>
          <button
            onClick={() => setMetricView('orders')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              metricView === 'orders'
                ? 'bg-white text-[#0070E0] shadow-sm font-bold'
                : 'text-[#6B7A90] hover:text-[#172B4D]'
            }`}
          >
            Orders
          </button>
        </div>
      </div>

      {/* Recharts Area matching Image 4's smooth curve */}
      <div className="h-72 w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          {metricView === 'revenue' ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="overviewBlueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0070E0" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#0070E0" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F4F8" vertical={false} />
              <XAxis
                dataKey="display_date"
                stroke="#97A0AF"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#97A0AF"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as RevenueTrendPoint;
                    return (
                      <div className="bg-[#172B4D] text-white px-3.5 py-2.5 rounded-2xl text-xs shadow-xl">
                        <div className="font-medium text-slate-300">{d.display_date}</div>
                        <div className="text-emerald-400 font-extrabold text-sm mt-0.5">
                          ${d.captured_revenue.toFixed(2)}
                        </div>
                        <div className="text-slate-400 text-[11px]">{d.orders_count} captured orders</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="captured_revenue"
                stroke="#0070E0"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#overviewBlueGrad)"
              />
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F4F8" vertical={false} />
              <XAxis
                dataKey="display_date"
                stroke="#97A0AF"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#97A0AF"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as RevenueTrendPoint;
                    return (
                      <div className="bg-[#172B4D] text-white px-3.5 py-2.5 rounded-2xl text-xs shadow-xl">
                        <div className="font-medium text-slate-300">{d.display_date}</div>
                        <div className="text-blue-300 font-extrabold text-sm mt-0.5">
                          {d.orders_count} orders
                        </div>
                        <div className="text-slate-400 text-[11px]">${d.captured_revenue.toFixed(2)} sales</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="orders_count" fill="#0070E0" radius={[8, 8, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
