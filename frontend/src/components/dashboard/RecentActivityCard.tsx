import React from 'react';
import { Transaction } from '../../types';
import { Badge } from '../common/Badge';
import { ArrowUpRight } from 'lucide-react';

interface RecentActivityCardProps {
  transactions: Transaction[];
  onSelectTransaction: (txn: Transaction) => void;
  onViewAll: () => void;
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
  transactions,
  onSelectTransaction,
  onViewAll,
}) => {
  const recentItems = transactions.slice(0, 4);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-7 shadow-[0_10px_30px_rgba(23,43,77,0.03)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-50">
        <div>
          <h3 className="text-lg font-bold text-[#172B4D] tracking-tight">Recent Activity</h3>
          <p className="text-xs text-[#5E6C84]">Transaction volume & distribution</p>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs font-bold text-[#0070E0] hover:text-[#005bb8] flex items-center gap-1 transition-colors"
        >
          <span>View All</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Sleek rounded vertical activity bars matching Image 4 */}
      <div className="py-4 px-2">
        <div className="flex items-end justify-between h-28 gap-2 px-2 pb-2 border-b border-slate-100/80">
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <div className="w-full h-8 bg-[#EAF3FC] rounded-t-xl transition-all hover:bg-blue-100" />
            <span className="text-[10px] text-slate-400 font-medium">0</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <div className="w-full h-14 bg-[#64B5F6] rounded-t-xl transition-all hover:bg-blue-400" />
            <span className="text-[10px] text-slate-400 font-medium">10</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <div className="w-full h-20 bg-[#2196F3] rounded-t-xl transition-all hover:bg-blue-500" />
            <span className="text-[10px] text-slate-400 font-medium">20</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <div className="w-full h-24 bg-[#0070E0] rounded-t-xl transition-all hover:bg-blue-700" />
            <span className="text-[10px] text-slate-400 font-medium">50</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <div className="w-full h-18 bg-[#64B5F6] rounded-t-xl transition-all hover:bg-blue-400" />
            <span className="text-[10px] text-slate-400 font-medium">40</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <div className="w-full h-28 bg-[#90CAF9] rounded-t-xl transition-all hover:bg-blue-300" />
            <span className="text-[10px] text-slate-400 font-medium">80</span>
          </div>
        </div>
      </div>

      {/* List of recent activities */}
      <div className="divide-y divide-slate-50 my-1">
        {recentItems.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400">
            No recent activity recorded.
          </div>
        ) : (
          recentItems.map((txn) => {
            const dateStr = new Date(txn.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={txn.id}
                onClick={() => onSelectTransaction(txn)}
                className="py-2.5 px-1.5 flex items-center justify-between hover:bg-[#F5F7FA] rounded-2xl cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#EAF3FC] text-[#0070E0] flex items-center justify-center font-bold text-xs">
                    ${Math.round(txn.amount)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#172B4D] line-clamp-1">
                      {txn.customer_name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {dateStr} &bull; {txn.payment_method === 'PAYPAL_SANDBOX' ? 'PayPal' : txn.payment_method}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-extrabold text-[#172B4D]">
                    +${txn.amount.toFixed(2)}
                  </div>
                  <Badge status={txn.status} size="sm" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Clean footer indicator */}
      <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-[11px] text-[#6B7A90]">
        <span>Verified via PayPal Sandbox</span>
        <span className="font-semibold text-emerald-600">Active Ledger</span>
      </div>
    </div>
  );
};
