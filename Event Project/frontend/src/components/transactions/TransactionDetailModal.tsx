import React, { useState } from 'react';
import { Transaction } from '../../types';
import { Badge } from '../common/Badge';
import { X, CheckCircle2, RotateCcw, ShieldCheck, AlertCircle } from 'lucide-react';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onRefund: (transactionId: string, reason: string, amount?: number) => Promise<void>;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
  onRefund,
}) => {
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundReason, setRefundReason] = useState('Customer requested return');
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  if (!transaction) return null;

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRefund(true);
    setRefundError(null);
    try {
      await onRefund(transaction.transaction_id, refundReason, transaction.amount);
      setIsRefunding(false);
    } catch (err: any) {
      setRefundError(err.message || 'Refund failed');
    } finally {
      setSubmittingRefund(false);
    }
  };

  const formattedDate = new Date(transaction.created_at).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-[#172B4D]">Transaction Details</h2>
            <Badge status={transaction.status} size="md" />
            {transaction.is_demo && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                Demo
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-3 gap-3 bg-[#F5F7FA] p-4 rounded-2xl border border-slate-100">
            <div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Total Amount</div>
              <div className="text-xl font-extrabold text-[#172B4D] mt-0.5">
                ${transaction.amount.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase">PayPal Fee</div>
              <div className="text-xl font-bold text-slate-600 mt-0.5">
                -${transaction.fee.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Net Payout</div>
              <div className="text-xl font-extrabold text-emerald-600 mt-0.5">
                ${transaction.net_amount.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Verification IDs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2.5 p-4 rounded-2xl bg-[#F5F7FA] border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Transaction ID</span>
                <span className="font-mono font-bold text-[#172B4D]">{transaction.transaction_id}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">PayPal Order ID</span>
                <span className="font-mono text-slate-700">{transaction.paypal_order_id || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">PayPal Capture ID</span>
                <span className="font-mono text-slate-700">{transaction.paypal_capture_id || 'N/A'}</span>
              </div>
            </div>
            <div className="space-y-2.5 p-4 rounded-2xl bg-[#F5F7FA] border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Customer Name</span>
                <span className="font-bold text-[#172B4D]">{transaction.customer_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Customer Email</span>
                <span className="text-slate-700">{transaction.customer_email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Captured Date</span>
                <span className="text-slate-700">{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Refund Notice if refunded */}
          {transaction.status === 'REFUNDED' && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
              <RotateCcw className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-rose-900">
                  Refund Processed: ${transaction.refunded_amount?.toFixed(2) || transaction.amount.toFixed(2)}
                </div>
                <div className="text-rose-700 mt-0.5">
                  Reason: {transaction.refund_reason || 'Customer request'}
                </div>
              </div>
            </div>
          )}

          {/* Line Items */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7A90] mb-2.5">
              Order Line Items
            </h3>
            <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F7FA] border-b border-slate-100 text-[#6B7A90]">
                  <tr>
                    <th className="py-3 px-4 font-bold">Item</th>
                    <th className="py-3 px-4 font-bold text-center">Qty</th>
                    <th className="py-3 px-4 font-bold text-right">Price</th>
                    <th className="py-3 px-4 font-bold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transaction.items && transaction.items.length > 0 ? (
                    transaction.items.map((item, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-semibold text-[#172B4D]">
                          {item.name}
                          {item.sku && <span className="block text-[10px] text-slate-400 font-mono">{item.sku}</span>}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600">{item.qty || 1}</td>
                        <td className="py-3 px-4 text-right text-slate-600">${item.unit_price.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-extrabold text-[#172B4D]">
                          ${((item.qty || 1) * item.unit_price).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400">
                        Merchant transaction item (${transaction.amount.toFixed(2)})
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Refund Trigger Section */}
          {transaction.status === 'COMPLETED' && (
            <div className="pt-2 border-t border-slate-100">
              {!isRefunding ? (
                <button
                  type="button"
                  onClick={() => setIsRefunding(true)}
                  className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Issue Refund
                </button>
              ) : (
                <form onSubmit={handleProcessRefund} className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-900">Process Refund for ${transaction.amount.toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => setIsRefunding(false)}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Reason for refund</label>
                    <input
                      type="text"
                      required
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="e.g., Damaged item, customer requested return"
                      className="w-full text-xs px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  {refundError && (
                    <div className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {refundError}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={submittingRefund}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50"
                  >
                    {submittingRefund ? 'Processing...' : 'Confirm and Execute Refund'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#F5F7FA] border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Verified Server-Side via PayPal REST API Sandbox</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-[#172B4D] font-bold rounded-xl border border-slate-200 transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
