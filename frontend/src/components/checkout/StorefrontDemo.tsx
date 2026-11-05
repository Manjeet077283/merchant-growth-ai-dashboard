import React, { useState, useEffect } from 'react';
import { Product, OrderItem, PayPalConfig } from '../../types';
import { api } from '../../services/api';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  X,
  ExternalLink,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface StorefrontDemoProps {
  onOrderCompleted: () => void;
  payPalConfig?: PayPalConfig;
  onClose?: () => void;
}

interface PendingPayPalOrder {
  order_id: string;
  status: string;
  approval_url?: string;
  amount: number;
  currency: string;
}

export const StorefrontDemo: React.FC<StorefrontDemoProps> = ({
  onOrderCompleted,
  payPalConfig,
  onClose,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{ product: Product; qty: number }[]>([]);
  const [customerName, setCustomerName] = useState('Sarah Jenkins');
  const [customerEmail, setCustomerEmail] = useState('sarah.jenkins@sandbox.demo');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<PendingPayPalOrder | null>(null);
  const [successDetails, setSuccessDetails] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    api.getProducts().then((prods) => {
      setProducts(prods);
      if (prods.length > 0 && cart.length === 0) {
        setCart([{ product: prods[0], qty: 1 }]);
      }
    }).catch(() => {});
  }, []);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: Product; qty: number }[]
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const estimatedFee = Math.round((cartSubtotal * 0.029 + 0.3) * 100) / 100;
  const estimatedNet = Math.max(0, Math.round((cartSubtotal - estimatedFee) * 100) / 100);

  // Step 1: Create Order in PayPal Sandbox
  const handleInitiateOrder = async () => {
    if (cart.length === 0) return;
    setErrorMessage(null);

    // Validate customer inputs
    const trimmedName = customerName.trim();
    const trimmedEmail = customerEmail.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage('Please provide a valid customer name.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please provide a valid customer email address.');
      return;
    }

    if (!payPalConfig?.client_id_configured) {
      setErrorMessage(
        'PayPal Sandbox credentials are required to initiate checkout. ' +
        'Please configure PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in your Render Environment settings.'
      );
      return;
    }

    setIsProcessing(true);

    try {
      const orderItems: OrderItem[] = cart.map((item) => ({
        sku: item.product.sku,
        name: item.product.name,
        qty: item.qty,
        unit_price: item.product.price,
        category: item.product.category,
      }));

      // Server-side order creation via PayPal Sandbox REST API
      const created = await api.createPayPalOrder(
        orderItems,
        trimmedName,
        trimmedEmail
      );

      setPendingOrder({
        order_id: created.order_id,
        status: created.status,
        approval_url: created.approval_url,
        amount: created.amount,
        currency: created.currency,
      });

      // Auto-open PayPal Sandbox approval window if URL available
      if (created.approval_url) {
        window.open(created.approval_url, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initiate PayPal Sandbox order.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2: Capture Approved Order in PayPal Sandbox
  const handleCaptureOrder = async () => {
    if (!pendingOrder) return;
    setIsCapturing(true);
    setErrorMessage(null);

    try {
      const orderItems: OrderItem[] = cart.map((item) => ({
        sku: item.product.sku,
        name: item.product.name,
        qty: item.qty,
        unit_price: item.product.price,
        category: item.product.category,
      }));

      const captured = await api.capturePayPalOrder(
        pendingOrder.order_id,
        orderItems,
        customerName.trim(),
        customerEmail.trim()
      );

      if (captured.status === 'COMPLETED' || captured.success) {
        setSuccessDetails(captured);
        setPendingOrder(null);
        setCart([]); // Clear cart only after confirmed capture
        onOrderCompleted(); // Refresh dashboard KPIs
      } else {
        setErrorMessage(captured.message || 'PayPal capture failed or is still awaiting buyer approval.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment capture failed. Verify buyer approval on PayPal Sandbox.');
    } finally {
      setIsCapturing(false);
    }
  };

  // Step 3: Cancel Pending Order
  const handleCancelOrder = async () => {
    if (!pendingOrder) return;
    try {
      await api.cancelPayPalOrder(pendingOrder.order_id, 'Buyer cancelled checkout');
    } catch {
      // Ignored
    } finally {
      setPendingOrder(null);
      setErrorMessage(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#172B4D]">PayPal Sandbox Demo Store</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF3FC] text-[#0070E0] border border-blue-200">
              Live Testbed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Test authentic server-side payment capture and see immediate updates in your dashboard.
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Catalog */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-[0_4px_20px_rgba(23,43,77,0.03)] hover:shadow-hover transition-all flex flex-col justify-between"
              >
                <div className="h-36 bg-slate-50 overflow-hidden relative">
                  <img
                    src={prod.image_url || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e'}
                    alt={prod.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-xs text-[#172B4D] text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-2xs">
                    {prod.category}
                  </span>
                </div>

                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-[#172B4D] line-clamp-1">{prod.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {prod.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <span className="text-base font-extrabold text-[#172B4D]">
                      ${prod.price.toFixed(2)}
                    </span>
                    <button
                      onClick={() => addToCart(prod)}
                      className="px-3.5 py-1.5 bg-[#EAF3FC] hover:bg-[#0070E0] text-[#0070E0] hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Checkout Cart */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_4px_20px_rgba(23,43,77,0.03)] flex flex-col justify-between space-y-4 h-fit">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#0070E0]" />
                <span className="font-bold text-sm text-[#172B4D]">Checkout Cart</span>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {cart.reduce((s, i) => s + i.qty, 0)} items
              </span>
            </div>

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Your cart is empty. Pick items from the catalog.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between p-2.5 bg-[#F5F7FA] rounded-xl text-xs"
                  >
                    <div className="flex-1 pr-2">
                      <div className="font-bold text-[#172B4D] line-clamp-1">{item.product.name}</div>
                      <div className="text-[11px] text-slate-400">
                        ${item.product.price.toFixed(2)} &times; {item.qty}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updateQty(item.product.id, -1)}
                        disabled={Boolean(pendingOrder)}
                        className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-4 text-center font-bold text-[#172B4D]">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.product.id, 1)}
                        disabled={Boolean(pendingOrder)}
                        className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        disabled={Boolean(pendingOrder)}
                        className="p-1 text-slate-400 hover:text-rose-600 ml-1 disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Customer Inputs */}
            <div className="space-y-2.5 pt-2 border-t border-slate-50">
              <div>
                <label className="block text-[11px] font-bold text-[#6B7A90] mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  disabled={Boolean(pendingOrder)}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 bg-[#F5F7FA] border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0070E0] disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#6B7A90] mb-1">
                  Customer Email
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  disabled={Boolean(pendingOrder)}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 bg-[#F5F7FA] border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0070E0] disabled:opacity-60"
                />
              </div>
            </div>

            {/* Price Calculations */}
            <div className="space-y-1.5 pt-2 border-t border-slate-50 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-bold text-[#172B4D]">${cartSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Est. PayPal Fee (2.9% + $0.30)</span>
                <span>-${estimatedFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-bold pt-1.5 border-t border-dashed border-slate-200">
                <div>
                  <span>Est. Net Payout</span>
                  <p className="text-[10px] text-slate-400 font-normal">Final fee &amp; net recorded upon PayPal capture</p>
                </div>
                <span>${estimatedNet.toFixed(2)}</span>
              </div>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* PayPal Configuration Warning if Missing */}
            {!payPalConfig?.client_id_configured && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-[#003087] text-[11px] leading-relaxed">
                <strong>Credentials Required:</strong> Enter <code>PAYPAL_CLIENT_ID</code> and <code>PAYPAL_CLIENT_SECRET</code> in Render Environment to process live sandbox checkout.
              </div>
            )}

            {/* Multi-Step Checkout Action Area */}
            {pendingOrder ? (
              /* Step 2: Awaiting Approval & Capture Action Box */
              <div className="p-4 rounded-2xl bg-[#EAF3FC] border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#003087]">Order Created: #{pendingOrder.order_id.slice(-8)}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#0070E0]">
                    Awaiting Approval
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Log in with your <strong>PayPal Sandbox Buyer account</strong> to approve payment of <strong>${pendingOrder.amount.toFixed(2)}</strong>.
                </p>

                {pendingOrder.approval_url && (
                  <a
                    href={pendingOrder.approval_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-blue-300 text-[#0070E0] font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all"
                  >
                    <span>Open PayPal Sandbox Window</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                <div className="pt-1 flex gap-2">
                  <button
                    onClick={handleCaptureOrder}
                    disabled={isCapturing}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#0070E0] hover:bg-[#005bb8] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isCapturing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying &amp; Capturing...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Complete &amp; Capture</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleCancelOrder}
                    disabled={isCapturing}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Step 1: Initiate Order Button */
              <div className="pt-2 space-y-2">
                <button
                  onClick={handleInitiateOrder}
                  disabled={cart.length === 0 || isProcessing || !payPalConfig?.client_id_configured}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#0070E0] hover:bg-[#005bb8] active:scale-[0.99] text-white font-extrabold text-sm shadow-[0_4px_16px_rgba(0,112,224,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Initiating PayPal Sandbox Order...</span>
                    </div>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        Pay with PayPal Sandbox (${cartSubtotal.toFixed(2)})
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {successDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#172B4D]">Payment Verified &amp; Captured!</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Authoritative transaction recorded in SQLite database with <code>is_demo=False</code>.
              </p>
            </div>

            <div className="bg-[#F5F7FA] p-4 rounded-2xl text-left text-xs space-y-2 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction ID:</span>
                <span className="font-mono font-bold text-[#172B4D]">{successDetails.transaction_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">PayPal Order ID:</span>
                <span className="font-mono text-slate-700">{successDetails.order_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">PayPal Capture ID:</span>
                <span className="font-mono text-slate-700">{successDetails.capture_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Authoritative Fee:</span>
                <span className="font-mono text-rose-600">-${successDetails.fee?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5">
                <span className="font-bold text-[#172B4D]">Net Recorded to Ledger:</span>
                <span className="font-extrabold text-emerald-600">
                  ${successDetails.net?.toFixed(2)} {successDetails.currency}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setSuccessDetails(null);
                if (onClose) onClose();
              }}
              className="w-full py-3 bg-[#0070E0] hover:bg-[#005bb8] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Done &amp; Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
