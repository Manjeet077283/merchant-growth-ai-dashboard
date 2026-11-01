import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { HourlyTrendPoint } from '../../types';
import { Clock } from 'lucide-react';

interface HourlyTrafficChartProps {
  data: HourlyTrendPoint[];
}

export const HourlyTrafficChart: React.FC<HourlyTrafficChartProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-600" />
            Peak Order Hours & Customer Traffic
          </h3>
          <p className="text-xs text-slate-500">
            Identifies highest-converting hours for scheduling flash sales and email campaigns
          </p>
        </div>
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          Peak Window: 9:00 AM – 11:00 AM
        </span>
      </div>

      <div className="h-48 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <XAxis dataKey="display_hour" stroke="#94a3b8" fontSize={10} tickLine={false} interval={2} />
            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as HourlyTrendPoint;
                  return (
                    <div className="bg-slate-900 text-white p-2 rounded-lg text-xs shadow-lg">
                      <div className="font-semibold text-slate-300">{d.display_hour}</div>
                      <div className="text-emerald-400 font-bold">{d.orders_count} orders</div>
                      <div className="text-slate-400">${d.revenue.toFixed(2)} sales</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="orders_count"
              fill="#0ea5e9"
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
