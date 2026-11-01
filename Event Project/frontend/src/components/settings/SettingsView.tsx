import React, { useState } from 'react';
import { PayPalConfig, MerchantProfile } from '../../types';
import {
  Key,
  Database,
  RefreshCw,
  CheckCircle2,
  Lock,
  Store,
  Cpu
} from 'lucide-react';

interface SettingsViewProps {
  payPalConfig?: PayPalConfig;
  merchantProfile?: MerchantProfile;
  geminiConfigured?: boolean;
  onResetDemo: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  payPalConfig,
  merchantProfile,
  geminiConfigured = false,
  onResetDemo,
}) => {
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleReset = async () => {
    if (window.confirm('Reset all transaction and catalog records back to initial demo state?')) {
      setIsResetting(true);
      try {
        await onResetDemo();
        setResetSuccess(true);
        setTimeout(() => setResetSuccess(false), 4000);
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-[#172B4D] tracking-tight">Settings &amp; Configuration</h2>
        <p className="text-xs text-[#6B7A90]">
          Inspect PayPal Sandbox status, AI model configuration, and database management.
        </p>
      </div>

      {/* Security Architecture Notice */}
      <div className="bg-[#EAF3FC] border border-blue-200/60 rounded-3xl p-5 flex items-start gap-3.5 text-xs text-[#003087]">
        <Lock className="w-5 h-5 text-[#0070E0] shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-sm text-[#003087] mb-0.5">Strict Zero-Trust Security Protocol</h4>
          <p className="leading-relaxed text-slate-700">
            All API secrets (including PayPal Client Secret and Gemini API Key) are loaded strictly on the Python FastAPI backend via environment variables. Client requests never handle private keys, and payment amounts and orders are verified server-side.
          </p>
        </div>
      </div>

      {/* 1. PayPal REST API Sandbox Config */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_4px_20px_rgba(23,43,77,0.03)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#EAF3FC] text-[#0070E0] flex items-center justify-center font-black">
              P
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172B4D]">PayPal REST API Sandbox</h3>
              <p className="text-xs text-slate-400">Server-side order capture and fee reconciliation</p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              payPalConfig?.client_id_configured
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {payPalConfig?.client_id_configured ? 'Live Sandbox Connected' : 'Sandbox Simulator Active'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-[#F5F7FA] rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-400 block font-medium">Configured Mode</span>
            <span className="font-mono font-bold text-[#172B4D]">{payPalConfig?.mode || 'sandbox'}</span>
          </div>
          <div className="p-4 bg-[#F5F7FA] rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-400 block font-medium">Default Currency</span>
            <span className="font-mono font-bold text-[#172B4D]">{payPalConfig?.currency || 'USD'}</span>
          </div>
        </div>

        <div className="p-4 bg-[#F5F7FA] rounded-2xl border border-slate-100 text-xs space-y-2">
          <div className="font-bold text-[#172B4D] flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-[#0070E0]" />
            <span>Connect your PayPal Sandbox Developer Credentials:</span>
          </div>
          <p className="text-slate-600">
            Set your credentials in <code>backend/.env</code>:
          </p>
          <pre className="p-3 bg-[#172B4D] text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto">
PAYPAL_CLIENT_ID=your_sandbox_client_id_here
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret_here
PAYPAL_MODE=sandbox
          </pre>
          <p className="text-[11px] text-slate-400">
            <em>When credentials are empty, the app uses its full <strong>Sandbox Simulator</strong> for seamless zero-setup testing.</em>
          </p>
        </div>
      </div>

      {/* 2. AI Intelligence Config */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_4px_20px_rgba(23,43,77,0.03)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#EAF3FC] text-[#0070E0] flex items-center justify-center font-bold">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172B4D]">AI Business Agent</h3>
              <p className="text-xs text-slate-400">Speech &amp; text reasoning over SQLite ledger</p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              geminiConfigured
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {geminiConfigured ? 'Gemini 2.5 Flash Live' : 'Grounded Engine Active'}
          </span>
        </div>

        <div className="p-4 bg-[#F5F7FA] rounded-2xl border border-slate-100 text-xs space-y-2">
          <div className="font-bold text-[#172B4D] flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-[#0070E0]" />
            <span>Optional: Enable Gemini 2.5 Flash API</span>
          </div>
          <pre className="p-3 bg-[#172B4D] text-indigo-300 rounded-xl font-mono text-[11px] overflow-x-auto">
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
          </pre>
        </div>
      </div>

      {/* 3. Merchant Profile & Target */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_4px_20px_rgba(23,43,77,0.03)] space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-50">
          <div className="w-9 h-9 rounded-2xl bg-[#F5F7FA] text-[#172B4D] flex items-center justify-center">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#172B4D]">Merchant Profile</h3>
            <p className="text-xs text-slate-400">Business settings in SQLite</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Business Name</span>
            <span className="font-bold text-[#172B4D]">{merchantProfile?.business_name || 'Artisan Coffee Roasters & Co.'}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Category</span>
            <span className="font-bold text-[#172B4D]">{merchantProfile?.category || 'Specialty Coffee & Gourmet Goods'}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Monthly Revenue Target</span>
            <span className="font-mono font-bold text-emerald-600">
              ${merchantProfile?.monthly_target?.toLocaleString() || '25,000.00'} USD
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">PayPal Facilitator Email</span>
            <span className="font-mono text-slate-700">{merchantProfile?.paypal_email || 'merchant@artisanroasters.demo'}</span>
          </div>
        </div>
      </div>

      {/* 4. Database Reset */}
      <div className="bg-white rounded-3xl border border-rose-100 p-6 shadow-[0_4px_20px_rgba(23,43,77,0.03)] space-y-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-rose-600" />
          <h3 className="text-sm font-bold text-[#172B4D]">Reset Demo Data</h3>
        </div>
        <p className="text-xs text-slate-500">
          Restore fresh 65+ realistic transactions, customer orders, and catalog items.
        </p>

        {resetSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Database successfully re-seeded with fresh transactions!</span>
          </div>
        )}

        <button
          onClick={handleReset}
          disabled={isResetting}
          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          <span>{isResetting ? 'Resetting...' : 'Reset Demo Records'}</span>
        </button>
      </div>
    </div>
  );
};
