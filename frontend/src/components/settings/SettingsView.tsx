import React, { useState, useEffect } from 'react';
import { PayPalConfig, MerchantProfile, HealthResponse } from '../../types';
import {
  Key,
  Database,
  RefreshCw,
  CheckCircle2,
  Lock,
  Store,
  Cpu,
  Server,
  Trash2,
  Save,
  AlertTriangle
} from 'lucide-react';

interface SettingsViewProps {
  payPalConfig?: PayPalConfig;
  merchantProfile?: MerchantProfile;
  geminiConfigured?: boolean;
  healthData?: HealthResponse;
  onResetDemo: () => Promise<void>;
  onClearDemo: () => Promise<void>;
  onUpdateProfile: (profile: Partial<MerchantProfile>) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  payPalConfig,
  merchantProfile,
  geminiConfigured = false,
  healthData,
  onResetDemo,
  onClearDemo,
  onUpdateProfile,
}) => {
  const [isResetting, setIsResetting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Editable Profile State
  const [businessName, setBusinessName] = useState(merchantProfile?.business_name || '');
  const [ownerName, setOwnerName] = useState(merchantProfile?.owner_name || '');
  const [category, setCategory] = useState(merchantProfile?.category || '');
  const [monthlyTarget, setMonthlyTarget] = useState(merchantProfile?.monthly_target?.toString() || '25000');
  const [paypalEmail, setPaypalEmail] = useState(merchantProfile?.paypal_email || '');

  useEffect(() => {
    if (merchantProfile) {
      setBusinessName(merchantProfile.business_name || '');
      setOwnerName(merchantProfile.owner_name || '');
      setCategory(merchantProfile.category || '');
      setMonthlyTarget(merchantProfile.monthly_target?.toString() || '25000');
      setPaypalEmail(merchantProfile.paypal_email || '');
    }
  }, [merchantProfile]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  const handleReset = async () => {
    if (window.confirm('Load fresh realistic 30-day demo transactions and order records into the database?')) {
      setIsResetting(true);
      try {
        await onResetDemo();
        showNotification('success', 'Database successfully populated with 30-day sample demo records!');
      } catch (err: any) {
        showNotification('error', err.message || 'Failed to populate demo records');
      } finally {
        setIsResetting(false);
      }
    }
  };

  const handleClearDemo = async () => {
    if (window.confirm('Purge all synthetic demo transactions? Your database will switch to an authentic production ledger.')) {
      setIsClearing(true);
      try {
        await onClearDemo();
        showNotification('success', 'Demo transactions purged. Database is now running on authentic production ledger.');
      } catch (err: any) {
        showNotification('error', err.message || 'Failed to purge demo data');
      } finally {
        setIsClearing(false);
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await onUpdateProfile({
        business_name: businessName.trim(),
        owner_name: ownerName.trim(),
        category: category.trim(),
        monthly_target: parseFloat(monthlyTarget) || 25000,
        paypal_email: paypalEmail.trim()
      });
      showNotification('success', 'Merchant profile settings saved successfully!');
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to save profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-[#172B4D] tracking-tight">Settings &amp; Configuration</h2>
        <p className="text-xs text-[#6B7A90]">
          Manage production environment, PayPal credentials, AI provider settings, and merchant profile.
        </p>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Live System Architecture Card */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_4px_20px_rgba(23,43,77,0.03)] space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-50">
          <div className="w-9 h-9 rounded-2xl bg-[#EAF3FC] text-[#0070E0] flex items-center justify-center font-bold">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#172B4D]">Live System Architecture &amp; Connectivity</h3>
            <p className="text-xs text-slate-400">Current runtime environment and database specifications</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-[#F5F7FA] rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-400 block font-medium">Environment</span>
            <span className="font-mono font-bold text-[#172B4D] uppercase">
              {healthData?.environment || 'development'}
            </span>
          </div>

          <div className="p-4 bg-[#F5F7FA] rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-400 block font-medium">Operational Mode</span>
            <span className="font-mono font-bold text-[#172B4D]">
              {healthData?.demo_mode ? 'Sandbox Simulator' : 'Live Production Ledger'}
            </span>
          </div>

          <div className="p-4 bg-[#F5F7FA] rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-400 block font-medium">Database Backend</span>
            <span className="font-mono font-bold text-[#172B4D]">
              {healthData?.database_type || 'SQLite (merchant_growth.db)'}
            </span>
          </div>
        </div>
      </div>

      {/* 1. PayPal REST API Credentials */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_4px_20px_rgba(23,43,77,0.03)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#EAF3FC] text-[#0070E0] flex items-center justify-center font-black">
              P
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172B4D]">PayPal REST API Gateway</h3>
              <p className="text-xs text-slate-400">Server-side payment capture and fee reconciliation</p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              payPalConfig?.client_id_configured
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {payPalConfig?.client_id_configured ? 'Live PayPal Connected' : 'Simulator Active (Credentials Missing)'}
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
            <span>How to connect your PayPal Developer Sandbox or Live Credentials:</span>
          </div>
          <p className="text-slate-600">
            Configure these environment variables in your Render Web Service dashboard under <strong>Environment</strong>:
          </p>
          <pre className="p-3 bg-[#172B4D] text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto">
PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here
PAYPAL_MODE=sandbox
          </pre>
          <p className="text-[11px] text-slate-400">
            <em>Obtain these keys from developer.paypal.com &gt; Apps &amp; Credentials &gt; Create App.</em>
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
              <h3 className="text-sm font-bold text-[#172B4D]">AI Business Intelligence Engine</h3>
              <p className="text-xs text-slate-400">Natural language voice &amp; text reasoning</p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              geminiConfigured
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {geminiConfigured ? 'Gemini 2.5 Flash Live' : 'Deterministic Grounded Engine Active'}
          </span>
        </div>

        <div className="p-4 bg-[#F5F7FA] rounded-2xl border border-slate-100 text-xs space-y-2">
          <div className="font-bold text-[#172B4D] flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-[#0070E0]" />
            <span>Enable Generative AI with Google Gemini API:</span>
          </div>
          <p className="text-slate-600">
            Set your Gemini API key in Render Environment to unlock advanced reasoning:
          </p>
          <pre className="p-3 bg-[#172B4D] text-indigo-300 rounded-xl font-mono text-[11px] overflow-x-auto">
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
          </pre>
          <p className="text-[11px] text-slate-400">
            <em>Obtain a free API key from aistudio.google.com. No paid tier required.</em>
          </p>
        </div>
      </div>

      {/* 3. Merchant Profile & Target */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_4px_20px_rgba(23,43,77,0.03)] space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-50">
          <div className="w-9 h-9 rounded-2xl bg-[#F5F7FA] text-[#172B4D] flex items-center justify-center">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#172B4D]">Merchant Profile Settings</h3>
            <p className="text-xs text-slate-400">Custom business name, monthly target, and facilitator email</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F5F7FA] border border-slate-200/80 rounded-xl font-medium text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#0070E0]"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Owner Name</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F5F7FA] border border-slate-200/80 rounded-xl font-medium text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#0070E0]"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Business Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F5F7FA] border border-slate-200/80 rounded-xl font-medium text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#0070E0]"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Monthly Revenue Target (USD $)</label>
              <input
                type="number"
                value={monthlyTarget}
                onChange={(e) => setMonthlyTarget(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F5F7FA] border border-slate-200/80 rounded-xl font-medium text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#0070E0]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-500 font-semibold mb-1">PayPal Merchant Email</label>
              <input
                type="email"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F5F7FA] border border-slate-200/80 rounded-xl font-medium text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#0070E0]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-5 py-2.5 bg-[#0070E0] hover:bg-[#005bb8] text-white rounded-xl font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. Production Database Ledger Management */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_4px_20px_rgba(23,43,77,0.03)] space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
          <Database className="w-4 h-4 text-[#0070E0]" />
          <h3 className="text-sm font-bold text-[#172B4D]">Database Ledger Operations</h3>
        </div>
        <p className="text-xs text-slate-500">
          Control demo transactions and switch between the sandbox simulation testbed and a clean production ledger.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 mb-1">
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Switch to Real Production Ledger</span>
              </div>
              <p className="text-[11px] text-rose-700/80 leading-relaxed">
                Purges all synthetic demo records so that every metric on your dashboard is 100% grounded in authentic customer checkouts.
              </p>
            </div>
            <button
              onClick={handleClearDemo}
              disabled={isClearing}
              className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isClearing ? 'Purging...' : 'Purge Demo Records'}</span>
            </button>
          </div>

          <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#003087] mb-1">
                <RefreshCw className="w-3.5 h-3.5 text-[#0070E0]" />
                <span>Load 30-Day Demo Records</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Restores 65+ realistic orders, customer accounts, and sales curves for hackathon presentations or zero-data testing.
              </p>
            </div>
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="px-4 py-2 bg-white hover:bg-blue-50 text-[#0070E0] border border-blue-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span>{isResetting ? 'Populating...' : 'Load Sample Demo Records'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

