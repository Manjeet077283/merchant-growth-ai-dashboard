import React from 'react';
import {
  Sparkles,
  ShoppingBag,
  RefreshCw,
  Mic,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { PayPalConfig } from '../../types';

interface HeaderProps {
  businessName: string;
  ownerName?: string;
  payPalConfig?: PayPalConfig;
  isDemoMode?: boolean;
  environment?: string;
  onRefresh: () => void;
  onResetDemo: () => void;
  onOpenStore: () => void;
  onOpenAiVoice: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  businessName,
  ownerName = 'Alex',
  payPalConfig,
  isDemoMode = true,
  environment = 'development',
  onRefresh,
  onResetDemo,
  onOpenStore,
  onOpenAiVoice,
  isRefreshing = false,
}) => {
  return (
    <header className="h-20 bg-white border-b border-slate-100 px-8 flex items-center justify-between z-10 shrink-0">
      {/* Welcome Title & Mode Indicator */}
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#172B4D] tracking-tight">
              Welcome back, {ownerName}!
            </h1>
            {isDemoMode ? (
              <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                Sandbox Demo
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Production
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-medium">
            {businessName} &bull; Merchant Growth Intelligence
          </p>
        </div>
      </div>

      {/* Action Buttons (Inspired by Image 2's clean top-right actions) */}
      <div className="flex items-center gap-3">
        {/* Reset Demo button (only visible in demo mode) */}
        {isDemoMode ? (
          <button
            onClick={onResetDemo}
            title="Reset sample database metrics"
            className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-[#172B4D] hover:bg-slate-50 rounded-xl transition-all border border-slate-200/80 flex items-center gap-1.5 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#0070E0]' : ''}`} />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>
        ) : (
          <button
            onClick={onRefresh}
            title="Refresh database records"
            className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-[#172B4D] hover:bg-slate-50 rounded-xl transition-all border border-slate-200/80 flex items-center gap-1.5 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#0070E0]' : ''}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>
        )}

        {/* Storefront / Checkout action */}
        <button
          onClick={onOpenStore}
          className="px-4 py-2 bg-[#EAF3FC] hover:bg-blue-100/70 text-[#0070E0] rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-blue-200/60 shadow-2xs"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>{isDemoMode ? 'Demo Checkout' : 'Store Checkout'}</span>
        </button>

        {/* Voice Assistant Launcher */}
        <button
          onClick={onOpenAiVoice}
          className="px-4 py-2 bg-[#0070E0] hover:bg-[#005bb8] text-white rounded-xl text-xs font-bold shadow-[0_4px_14px_rgba(0,112,224,0.25)] transition-all flex items-center gap-2 active:scale-[0.98]"
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Voice Assistant</span>
        </button>
      </div>
    </header>
  );
};
