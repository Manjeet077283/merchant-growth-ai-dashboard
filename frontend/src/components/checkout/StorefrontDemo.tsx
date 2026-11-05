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
  RefreshCw,
  Sparkles,
  Zap,
  ArrowRight,
  TrendingUp,
  CreditCard
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
  const [checkoutMode, setCheckoutMode] = useState<'sample' | 'paypal_sandbox'>('sample');
  const [isProcessing, setIsProcessing] = useState(false);
  const [quickBuyingId, setQuickBuyingId] = useState<number | null>(null);
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

  // Quick 1-Click Buy Sample directly on any product card
  const handleQuickSampleBuy = async (product: Product) => {
    setErrorMessage(null);
    setQuickBuyingId(product.id);

    try {
      const orderItems: OrderItem[] = [{
        sku: product.sku,
        name: product.name,
        qty: 1,
        unit_price: product.price,
        category: product.category,
      }];

      const created = await api.createPayPalOrder(
        orderItems,
        customerName.trim() || 'Sarah Jenkins',
        customerEmail.trim() || 'sarah.jenkins@sandbox.demo',
        true // force instant sample mode
      );

      const captured = await api.capturePayPalOrder(
        created.order_id,
        orderItems,
        customerName.trim() || 'Sarah Jenkins',
        customerEmail.trim() || 'sarah.jenkins@sandbox.demo'
      );

      if (captured.status === 'COMPLETED' || captured.success) {
        setSuccessDetails(captured);
        onOrderCompleted();
      } else {
        setErrorMessage(captured.message || 'Sample checkout capture failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process sample order.');
    } finally {
      setQuickBuyingId(null);
    }
  };

  // Initiate Order & Process
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

    setIsProcessing(true);

    try {
      const orderItems: OrderItem[] = cart.map((item) => ({
        sku: item.product.sku,
        name: item.product.name,
        qty: item.qty,
        unit_price: item.product.price,
        category: item.product.category,
      }));

      const isSampleOrder = checkoutMode === 'sample' || !payPalConfig?.client_id_configured;

      // Server-side order creation
      const created = await api.createPayPalOrder(
        orderItems,
        trimmedName,
        trimmedEmail,
        isSampleOrder
      );

      // If user chose official PayPal Sandbox and credentials exist, open buyer approval flow
      if (!isSampleOrder && payPalConfig?.client_id_configured && created.approval_url) {
        setPendingOrder({
          order_id: created.order_id,
          status: created.status,
          approval_url: created.approval_url,
          amount: created.amount,
          currency: created.currency,
        });
        window.open(created.approval_url, '_blank', 'noopener,noreferrer');
      } else {
        // Sample demonstration mode: automatically verify and capture to real SQLite ledger
        const captured = await api.capturePayPalOrder(
          created.order_id,
          orderItems,
          trimmedName,
          trimmedEmail
        );

        if (captured.status === 'COMPLETED' || captured.success) {
          setSuccessDetails(captured);
          setCart([]);
          onOrderCompleted();
        } else {
          setErrorMessage(captured.message || 'Sample checkout capture failed.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process checkout order.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Capture Approved Order in PayPal Sandbox
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
        setCart([]);
        onOrderCompleted();
      } else {
        setErrorMessage(captured.message || 'PayPal capture failed or is still awaiting buyer approval.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment capture failed. Verify buyer approval on PayPal Sandbox.');
    } finally {
      setIsCapturing(false);
    }
  };

  // Cancel Pending Order
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
            <h2 className="text-xl font-bold text-[#172B4D]">Demo Storefront &amp; Checkout</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-600" />
              Live Ledger Enabled
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Buy sample products to demonstrate real server-side payment capture, ledger updates, and AI dashboard analytics.
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
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

                  <div className="flex items-center justify-between pt-2 border-t border-slate-50 gap-2">
                    <span className="text-base font-extrabold text-[#172B4D]">
                      ${prod.price.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleQuickSampleBuy(prod)}
                        disabled={quickBuyingId === prod.id || isProcessing}
                        title="Instantly buy 1 sample of this product and record directly to ledger"
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {quickBuyingId === prod.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Zap className="w-3.5 h-3.5" />
                        )}
                        <span>Sample Buy</span>
                      </button>

                      <button
                        onClick={() => addToCart(prod)}
                        className="px-3 py-1.5 bg-[#EAF3FC] hover:bg-[#0070E0] text-[#0070E0] hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add
                      </button>
                    </div>
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
              <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
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

            {/* Checkout Mode Selector */}
            <div className="pt-2 border-t border-slate-50">
              <label className="block text-[11px] font-bold text-[#6B7A90] mb-1.5">
                Checkout Method
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-[#F5F7FA] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCheckoutMode('sample')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    checkoutMode === 'sample'
                      ? 'bg-white text-emerald-700 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Zap className="w-3 h-3 text-emerald-600" />
                  <span>Sample Order</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCheckoutMode('paypal_sandbox')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    checkoutMode === 'paypal_sandbox'
                      ? 'bg-white text-[#0070E0] shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <CreditCard className="w-3 h-3 text-[#0070E0]" />
                  <span>PayPal Sandbox</span>
                </button>
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
                  <p className="text-[10px] text-slate-400 font-normal">Recorded to database ledger upon capture</p>
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

            {/* Mode Explanations */}
            {checkoutMode === 'sample' ? (
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-900 text-[11px] leading-relaxed flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Instant Sample Order:</span> 1-click server-side capture that records directly to the SQLite ledger and updates your Gross Sales, Orders, and AI metrics immediately.
                </div>
              </div>
            ) : !payPalConfig?.client_id_configured ? (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-[#003087] text-[11px] leading-relaxed space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-3.5 h-3.5 text-[#0070E0]" />
                  <span>PayPal REST API Keys Not Found in Render</span>
                </div>
                <p className="text-slate-600">
                  To test live PayPal buyer login popups, enter <code>PAYPAL_CLIENT_ID</code> and <code>PAYPAL_CLIENT_SECRET</code> in Render.
                </p>
                <button
                  type="button"
                  onClick={() => setCheckoutMode('sample')}
                  className="text-xs font-bold text-[#0070E0] hover:underline flex items-center gap-1 pt-0.5 cursor-pointer"
                >
                  <span>Switch to Sample Order (Works Instantly)</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ) : null}

            {/* Multi-Step Checkout Action Area */}
            {pendingOrder ? (
              /* Awaiting Approval & Capture Action Box (Live PayPal Mode) */
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
              /* Initiate Order Button */
              <div className="pt-2 space-y-2">
                <button
                  onClick={handleInitiateOrder}
                  disabled={cart.length === 0 || isProcessing || (checkoutMode === 'paypal_sandbox' && !payPalConfig?.client_id_configured)}
                  className={`w-full py-3.5 px-4 rounded-2xl active:scale-[0.99] text-white font-extrabold text-sm transition-all flex flex-col items-center justify-center gap-0.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                    checkoutMode === 'sample'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-[0_4px_16px_rgba(5,150,105,0.3)]'
                      : 'bg-[#0070E0] hover:bg-[#005bb8] shadow-[0_4px_16px_rgba(0,112,224,0.3)]'
                  }`}
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing Order &amp; Recording to Ledger...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        {checkoutMode === 'sample' ? (
                          <Zap className="w-4 h-4" />
                        ) : (
                          <ShieldCheck className="w-4 h-4" />
                        )}
                        <span>
                          {checkoutMode === 'sample'
                            ? `Buy Sample Order ($${cartSubtotal.toFixed(2)})`
                            : `Pay with PayPal Sandbox ($${cartSubtotal.toFixed(2)})`}
                        </span>
                      </div>
                      <span className="text-[10px] font-normal text-white/80">
                        {checkoutMode === 'sample'
                          ? 'Instant 1-Click Verification & Real Ledger Recording'
                          : payPalConfig?.client_id_configured
                          ? 'Official PayPal Sandbox Buyer Flow'
                          : 'Configure credentials in Render to enable'}
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
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#172B4D]">Sample Payment Verified &amp; Captured!</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Authoritative transaction successfully recorded in your SQLite database ledger.
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
                <span className="text-slate-400">Customer:</span>
                <span className="text-[#172B4D] font-medium">{successDetails.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gross Sale:</span>
                <span className="font-bold text-[#172B4D]">${successDetails.amount?.toFixed(2)}</span>
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

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-[11px] text-emerald-800 flex items-center justify-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Gross Sales, Captured Payments, and Orders updated live!</span>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setSuccessDetails(null);
                  if (onClose) onClose();
                }}
                className="flex-1 py-3 bg-[#0070E0] hover:bg-[#005bb8] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                View in Dashboard
              </button>
              <button
                onClick={() => setSuccessDetails(null)}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Buy Another Sample
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
