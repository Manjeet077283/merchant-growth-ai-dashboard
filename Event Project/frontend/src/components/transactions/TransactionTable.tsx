import React, { useState } from 'react';
import { Transaction } from '../../types';
import { Badge } from '../common/Badge';
import { Search, ChevronLeft, ChevronRight, Eye, Filter, RefreshCw } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onSearch: (query: string) => void;
  onStatusFilter: (status: string) => void;
  onSelectTransaction: (txn: Transaction) => void;
  isLoading?: boolean;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  total,
  page,
  pageSize,
  onPageChange,
  onSearch,
  onStatusFilter,
  onSelectTransaction,
  isLoading = false,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    onStatusFilter(val);
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_25px_rgba(23,43,77,0.03)] overflow-hidden flex flex-col">
      {/* Search & Filter Bar */}
      <div className="p-5 border-b border-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by customer name, email, or transaction ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#F5F7FA] border border-slate-200/80 rounded-2xl text-xs text-[#172B4D] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0070E0] focus:bg-white transition-all"
          />
        </form>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="text-xs font-semibold pl-3.5 pr-8 py-2.5 bg-[#F5F7FA] border border-slate-200/80 rounded-2xl text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#0070E0] appearance-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Captured</option>
              <option value="REFUNDED">Refunded</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#F5F7FA]/60 border-b border-slate-100 text-[#6B7A90] font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-6">Transaction ID</th>
              <th className="py-3.5 px-6">Customer</th>
              <th className="py-3.5 px-6">Status</th>
              <th className="py-3.5 px-6 text-right">Amount</th>
              <th className="py-3.5 px-6">Payment Method</th>
              <th className="py-3.5 px-6">Date</th>
              <th className="py-3.5 px-6 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#0070E0]" />
                  Loading transactions...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No transactions match the selected filters.
                </td>
              </tr>
            ) : (
              transactions.map((txn) => {
                const dateStr = new Date(txn.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                return (
                  <tr
                    key={txn.id}
                    onClick={() => onSelectTransaction(txn)}
                    className="hover:bg-[#F5F7FA]/70 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-6 font-mono font-semibold text-[#172B4D] group-hover:text-[#0070E0] transition-colors">
                      {txn.transaction_id}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="font-bold text-[#172B4D]">{txn.customer_name}</div>
                      <div className="text-[11px] text-slate-400">{txn.customer_email}</div>
                    </td>
                    <td className="py-3.5 px-6">
                      <Badge status={txn.status} />
                    </td>
                    <td className="py-3.5 px-6 text-right font-extrabold text-[#172B4D] text-sm">
                      ${txn.amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-6 text-slate-600">
                      <span className="px-2.5 py-1 rounded-full bg-[#EAF3FC] text-[#0070E0] text-[11px] font-bold">
                        {txn.payment_method === 'PAYPAL_SANDBOX'
                          ? 'PayPal'
                          : txn.payment_method === 'PAY_IN_4'
                          ? 'Pay in 4'
                          : txn.payment_method === 'PAYPAL_WALLET'
                          ? 'PayPal Wallet'
                          : 'Credit Card'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-400">{dateStr}</td>
                    <td className="py-3.5 px-6 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTransaction(txn);
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-[#0070E0] hover:bg-blue-50 transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="p-4 px-6 bg-white border-t border-slate-50 flex items-center justify-between text-xs text-[#6B7A90]">
        <div>
          Showing{' '}
          <span className="font-bold text-[#172B4D]">
            {total > 0 ? (page - 1) * pageSize + 1 : 0}
          </span>{' '}
          to{' '}
          <span className="font-bold text-[#172B4D]">
            {Math.min(page * pageSize, total)}
          </span>{' '}
          of <span className="font-bold text-[#172B4D]">{total}</span> transactions
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-bold text-[#172B4D]">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
