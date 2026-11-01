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
  CreditCard,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface StorefrontDemoProps {
  onOrderCompleted: () => void;
  payPalConfig?: PayPalConfig;
  onClose?: () => void;
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
  const [successDetails, setSuccessDetails] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    api.getProducts().then((prods) => {
      setProducts(prods);
      if (prods.length > 0 && cart.length === 0) {
        setCart([{ product: prods[0], qty: 2 }]);
      }
    });
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

  const handlePayPalCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const orderItems: OrderItem[] = cart.map((item) => ({
        sku: item.product.sku,
        name: item.product.name,
        qty: item.qty,
        unit_price: item.product.price,
        category: item.product.category,
      }));

      // 1. Server-side order creation via PayPal Sandbox REST API
      const createdOrder = await api.createPayPalOrder(
        orderItems,
        customerName,
        customerEmail
      );

      // 2. Server-side payment capture & SQLite commitment
      const capturedPayment = await api.capturePayPalOrder(
        createdOrder.order_id,
        orderItems,
        customerName,
        customerEmail
      );

      setSuccessDetails(capturedPayment);
      setCart([]);
      onOrderCompleted();
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment capture failed. Check server connection.');
    } finally {
      setIsProcessing(false);
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
            Test real server-side payment capture and see immediate updates in your dashboard.
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
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-[#172B4D] mb-1 leading-snug">{prod.name}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{prod.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <span className="text-base font-extrabold text-[#172B4D]">${prod.price.toFixed(2)}</span>
                    <button
                      onClick={() => addToCart(prod)}
                      className="px-3.5 py-1.5 bg-[#EAF3FC] hover:bg-[#0070E0] text-[#0070E0] hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
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

        {/* Shopping Cart & PayPal Checkout Card */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_4px_25px_rgba(23,43,77,0.04)] space-y-4 sticky top-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#0070E0]" />
                <h3 className="font-bold text-sm text-[#172B4D]">Checkout Cart</h3>
              </div>
              <span className="text-xs font-bold text-slate-400">
                {cart.reduce((s, i) => s + i.qty, 0)} items
              </span>
            </div>

            {/* Cart Items */}
            {cart.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
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
                        className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-4 text-center font-bold text-[#172B4D]">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.product.id, 1)}
                        className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 ml-1"
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
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 bg-[#F5F7FA] border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0070E0]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#6B7A90] mb-1">
                  Customer Email
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 bg-[#F5F7FA] border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0070E0]"
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
                <span>Net Recorded to Ledger</span>
                <span>${estimatedNet.toFixed(2)}</span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorMessage}
              </div>
            )}

            {/* PayPal Checkout CTA */}
            <div className="pt-2">
              <button
                onClick={handlePayPalCheckout}
                disabled={cart.length === 0 || isProcessing}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#0070E0] hover:bg-[#005bb8] active:scale-[0.99] text-white font-extrabold text-sm shadow-[0_4px_16px_rgba(0,112,224,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Capturing Payment...</span>
                  </div>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Pay with PayPal Sandbox (${cartSubtotal.toFixed(2)})</span>
                  </>
                )}
              </button>
            </div>
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
              <h3 className="text-lg font-bold text-[#172B4D]">Payment Captured!</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Verified server-side and recorded in your SQLite database.
              </p>
            </div>

            <div className="bg-[#F5F7FA] p-4 rounded-2xl text-left text-xs space-y-2 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction ID:</span>
                <span className="font-mono font-bold text-[#172B4D]">{successDetails.transaction_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">PayPal Capture ID:</span>
                <span className="font-mono text-slate-700">{successDetails.capture_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className="font-extrabold text-emerald-600">
                  ${successDetails.amount?.toFixed(2)} {successDetails.currency}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setSuccessDetails(null);
                if (onClose) onClose();
              }}
              className="w-full py-3 bg-[#0070E0] hover:bg-[#005bb8] text-white font-bold text-xs rounded-xl shadow-xs transition-all"
            >
              Done & Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
