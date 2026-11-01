import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  changePct?: number;
  periodLabel?: string;
  icon?: LucideIcon;
  sparklineType?: 'line' | 'bars' | 'none';
  subtitle?: string;
  isNegativeBetter?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  changePct,
  periodLabel = 'vs prior month',
  icon: Icon,
  sparklineType = 'none',
  subtitle,
  isNegativeBetter = false,
}) => {
  const isPositive = (changePct ?? 0) >= 0;
  const isGood = isNegativeBetter ? !isPositive : isPositive;

  // Render Card 3 (Sparkline curve matching Image 4)
  if (sparklineType === 'line') {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_10px_30px_rgba(23,43,77,0.03)] hover:shadow-[0_14px_40px_rgba(23,43,77,0.06)] transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#5E6C84] tracking-wide">{title}</span>
          {changePct !== undefined && (
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              +{changePct.toFixed(1)}%
            </span>
          )}
        </div>

        {/* Minimalist smooth sine curve with soft blue fill matching Image 4 */}
        <div className="w-full h-14 flex items-center justify-center my-1">
          <svg className="w-full h-12 text-[#0070E0]" viewBox="0 0 160 50" fill="none">
            <defs>
              <linearGradient id="kpiBlueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0070E0" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#0070E0" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M0 36 C25 15, 45 42, 70 24 C95 6, 120 38, 140 18 C150 10, 155 12, 160 8 L160 50 L0 50 Z"
              fill="url(#kpiBlueGradient)"
            />
            <path
              d="M0 36 C25 15, 45 42, 70 24 C95 6, 120 38, 140 18 C150 10, 155 12, 160 8"
              stroke="#0070E0"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-bold text-[#172B4D]">{value}</span>
          <span className="text-[11px] text-slate-400 font-medium">Trajectory</span>
        </div>
      </div>
    );
  }

  // Render Card 4 (Orders with vertical bars matching Image 4)
  if (sparklineType === 'bars') {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_10px_30px_rgba(23,43,77,0.03)] hover:shadow-[0_14px_40px_rgba(23,43,77,0.06)] transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#5E6C84] tracking-wide">{title}</span>
          {changePct !== undefined && (
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              +{changePct.toFixed(1)}%
            </span>
          )}
        </div>

        <div className="flex items-end justify-between my-1">
          <div className="text-3xl font-extrabold text-[#172B4D] tracking-tight">
            {value}
          </div>

          {/* Series of vertical rounded blue bars matching Image 4 */}
          <div className="flex items-end gap-1.5 h-12 pb-1">
            <div className="w-2 h-3 bg-[#EAF3FC] rounded-t-sm" />
            <div className="w-2 h-6 bg-[#B7DBFC] rounded-t-sm" />
            <div className="w-2 h-8 bg-[#64B5F6] rounded-t-sm" />
            <div className="w-2 h-11 bg-[#0070E0] rounded-t-sm" />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
          <span>{subtitle || periodLabel}</span>
          <span className="text-[#0070E0] font-semibold">Active</span>
        </div>
      </div>
    );
  }

  // Standard Card 1 & 2 (Matching Image 4)
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_10px_30px_rgba(23,43,77,0.03)] hover:shadow-[0_14px_40px_rgba(23,43,77,0.06)] transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-[#5E6C84] tracking-wide">
            {title}
          </span>
          {Icon && (
            <div className="w-8 h-8 rounded-xl bg-[#EAF3FC] text-[#0070E0] flex items-center justify-center">
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>

        <div className="text-3xl font-extrabold text-[#172B4D] tracking-tight">
          {value}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        {changePct !== undefined ? (
          <div className="flex items-center gap-1.5 text-xs">
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-bold text-[11px] ${
                isGood
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isPositive ? `+${changePct.toFixed(1)}%` : `${changePct.toFixed(1)}%`}
            </span>
            <span className="text-slate-400 text-[11px]">{periodLabel}</span>
          </div>
        ) : subtitle ? (
          <span className="text-xs text-slate-400 font-medium">{subtitle}</span>
        ) : null}
      </div>
    </div>
  );
};
