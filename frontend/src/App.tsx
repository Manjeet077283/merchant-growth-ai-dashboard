import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import {
  DashboardMetricsResponse,
  TransactionListResponse,
  Transaction,
  PayPalConfig,
  RecommendationsResponse,
  MerchantProfile,
  ActionItem,
  RecommendationItem
} from './types';

// Layout
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

// Dashboard Components
import { KpiCard } from './components/dashboard/KpiCard';
import { RevenueChart } from './components/dashboard/RevenueChart';
import { RecentActivityCard } from './components/dashboard/RecentActivityCard';

// Views and Modals
import { TransactionTable } from './components/transactions/TransactionTable';
import { TransactionDetailModal } from './components/transactions/TransactionDetailModal';
import { VoiceAiAssistant } from './components/ai/VoiceAiAssistant';
import { AiChatDrawer } from './components/ai/AiChatDrawer';
import { RecommendationsView } from './components/recommendations/RecommendationsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { StorefrontDemo } from './components/checkout/StorefrontDemo';
import { SettingsView } from './components/settings/SettingsView';

// Icons
import {
  DollarSign,
  CheckCircle2,
  ShoppingCart,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Lightbulb,
  Zap,
  ShoppingBag
} from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<DashboardMetricsResponse | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(null);
  const [merchantProfile, setMerchantProfile] = useState<MerchantProfile | undefined>(undefined);
  const [payPalConfig, setPayPalConfig] = useState<PayPalConfig | undefined>(undefined);
  const [geminiConfigured, setGeminiConfigured] = useState<boolean>(false);

  // Transactions State
  const [transactionsData, setTransactionsData] = useState<TransactionListResponse | null>(null);
  const [txnPage, setTxnPage] = useState<number>(1);
  const [txnStatusFilter, setTxnStatusFilter] = useState<string>('ALL');
  const [txnSearchQuery, setTxnSearchQuery] = useState<string>('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Analytics State
  const [analyticsDays, setAnalyticsDays] = useState<number>(30);

  // UI Modals & Drawers
  const [isVoiceDrawerOpen, setIsVoiceDrawerOpen] = useState<boolean>(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch all core dashboard datasets
  const fetchDashboardData = useCallback(async (days = 30) => {
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      const [health, metricsData, recsData, profileData, ppConfig] = await Promise.all([
        api.getHealth(),
        api.getMetricsSummary(days),
        api.getRecommendations(),
        api.getMerchantProfile(),
        api.getPayPalConfig(),
      ]);

      setGeminiConfigured(health.gemini_configured);
      setMetrics(metricsData);
      setRecommendations(recsData);
      setMerchantProfile(profileData);
      setPayPalConfig(ppConfig);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to connect to backend service');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch transactions table data
  const fetchTransactions = useCallback(async (page = 1, status = 'ALL', query = '') => {
    try {
      const data = await api.getTransactions(page, 10, status, query);
      setTransactionsData(data);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(analyticsDays);
    fetchTransactions(txnPage, txnStatusFilter, txnSearchQuery);
  }, [fetchDashboardData, fetchTransactions, analyticsDays, txnPage, txnStatusFilter, txnSearchQuery]);

  // Handle transaction refund
  const handleRefundTransaction = async (transactionId: string, reason: string, amount?: number) => {
    await api.refundTransaction(transactionId, reason, amount);
    await Promise.all([
      fetchDashboardData(analyticsDays),
      fetchTransactions(txnPage, txnStatusFilter, txnSearchQuery),
    ]);
    if (selectedTransaction && selectedTransaction.transaction_id === transactionId) {
      const updated = await api.getTransaction(transactionId);
      setSelectedTransaction(updated);
    }
  };

  // Handle Demo Reset
  const handleResetDemo = async () => {
    await api.resetDemoData();
    await Promise.all([
      fetchDashboardData(analyticsDays),
      fetchTransactions(1, 'ALL', ''),
    ]);
  };

  // Handle newly captured checkout order
  const handleOrderCompleted = async () => {
    await Promise.all([
      fetchDashboardData(analyticsDays),
      fetchTransactions(1, 'ALL', ''),
    ]);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F5F7FA] font-sans text-[#172B4D]">
      {/* 1. Left Clean White Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* 2. Main Content Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Clean Header */}
        <Header
          businessName={merchantProfile?.business_name || 'Artisan Coffee Roasters & Co.'}
          ownerName={merchantProfile?.owner_name?.split(' ')[0] || 'Alex'}
          payPalConfig={payPalConfig}
          onRefresh={() => fetchDashboardData(analyticsDays)}
          onResetDemo={handleResetDemo}
          onOpenStore={() => setIsStoreModalOpen(true)}
          onOpenAiVoice={() => setIsVoiceDrawerOpen(true)}
          isRefreshing={isRefreshing}
        />

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="bg-rose-50 border-b border-rose-200 px-8 py-2.5 text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}. Ensure the FastAPI backend is running on <code>http://127.0.0.1:8000</code>.</span>
            </div>
            <button
              onClick={() => fetchDashboardData(analyticsDays)}
              className="font-bold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Scrollable Main Views Area */}
        <main className="flex-1 overflow-y-auto p-8 space-y-7">
          {isLoading && !metrics ? (
            <div className="flex flex-col items-center justify-center h-96 text-slate-400 space-y-3">
              <div className="w-8 h-8 border-3 border-[#0070E0] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-[#6B7A90]">Loading merchant intelligence metrics...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: MINIMAL & CLEAN DASHBOARD (Inspired by Image 2) */}
              {currentTab === 'dashboard' && metrics && (
                <div className="space-y-7">
                  {/* Row 1: 4 Prominent KPI Cards (Strictly Inspired by Image 4) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <KpiCard
                      title="Total Revenue"
                      value={`$${metrics.kpis.gross_sales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      changePct={metrics.kpis.sales_growth_pct}
                      periodLabel="vs last month"
                      icon={DollarSign}
                    />
                    <KpiCard
                      title="Successful Payments"
                      value={`$${metrics.kpis.captured_payments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      subtitle={`${metrics.kpis.captured_order_count} captured orders`}
                      icon={CheckCircle2}
                    />
                    <KpiCard
                      title="Revenue"
                      value={`$${metrics.kpis.gross_sales.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                      changePct={metrics.kpis.sales_growth_pct}
                      sparklineType="line"
                    />
                    <KpiCard
                      title="Orders"
                      value={metrics.kpis.order_count.toString()}
                      changePct={metrics.kpis.order_growth_pct}
                      subtitle={`${metrics.kpis.captured_order_count} captured`}
                      sparklineType="bars"
                    />
                  </div>

                  {/* Row 2: Overview Chart (60%) + Recent Activity with Vertical Bars (40%) (Image 4 Match) */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <RevenueChart data={metrics.revenue_trends} title="Overview" />
                    </div>
                    <div>
                      <RecentActivityCard
                        transactions={metrics.recent_transactions}
                        onSelectTransaction={(txn) => setSelectedTransaction(txn)}
                        onViewAll={() => setCurrentTab('transactions')}
                      />
                    </div>
                  </div>

                  {/* Row 3: PayPal Action Cards (Inspired by Image 3) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Blue Action Card 1: Send / Checkout */}
                    <div className="bg-gradient-to-br from-[#003087] to-[#0070E0] rounded-3xl p-6 text-white shadow-[0_10px_30px_rgba(0,112,224,0.18)] flex flex-col justify-between">
                      <div>
                        <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center mb-4">
                          <ShoppingBag className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-extrabold tracking-tight mb-1">Send & Capture Payments</h3>
                        <p className="text-xs text-blue-100 font-medium leading-relaxed">
                          Test sandbox customer checkout. Verifies server-side order creation and records ledger captures.
                        </p>
                      </div>
                      <div className="pt-6">
                        <button
                          onClick={() => setIsStoreModalOpen(true)}
                          className="w-full py-3 bg-white text-[#003087] hover:bg-blue-50 font-bold text-xs rounded-2xl transition-all shadow-md active:scale-[0.98]"
                        >
                          Launch Demo Checkout
                        </button>
                      </div>
                    </div>

                    {/* Blue Action Card 2: Voice AI Copilot */}
                    <div className="bg-gradient-to-br from-[#00256C] to-[#005BB8] rounded-3xl p-6 text-white shadow-[0_10px_30px_rgba(0,48,135,0.18)] flex flex-col justify-between">
                      <div>
                        <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center mb-4">
                          <Sparkles className="w-5 h-5 text-amber-300" />
                        </div>
                        <h3 className="text-lg font-extrabold tracking-tight mb-1">Voice AI Copilot</h3>
                        <p className="text-xs text-blue-100 font-medium leading-relaxed">
                          Query SQLite metrics in English or हिन्दी. Answers are strictly grounded in real transaction figures.
                        </p>
                      </div>
                      <div className="pt-6">
                        <button
                          onClick={() => setIsVoiceDrawerOpen(true)}
                          className="w-full py-3 bg-white text-[#003087] hover:bg-blue-50 font-bold text-xs rounded-2xl transition-all shadow-md active:scale-[0.98]"
                        >
                          Ask Voice Copilot
                        </button>
                      </div>
                    </div>

                    {/* Clean White Card 3: PayPal Balance (Image 3 Inspiration) */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_10px_30px_rgba(23,43,77,0.03)] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-[#5E6C84]">PayPal balance</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <div className="text-3xl font-extrabold text-[#172B4D] tracking-tight">
                          ${metrics.kpis.captured_payments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <span className="text-xs text-slate-400 font-medium">Available in Sandbox</span>
                      </div>
                      <div className="pt-6">
                        <button
                          onClick={() => alert(`Simulated transfer of $${metrics.kpis.captured_payments.toFixed(2)} to primary business checking account.`)}
                          className="w-full py-3 bg-[#EAF3FC] hover:bg-blue-100 text-[#0070E0] font-bold text-xs rounded-2xl transition-all border border-blue-200/50"
                        >
                          Transfer Funds
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: AI-generated Growth Insights */}
                  {recommendations && (
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_4px_20px_rgba(23,43,77,0.03)] space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#EAF3FC] text-[#0070E0] flex items-center justify-center">
                            <Lightbulb className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-[#172B4D]">AI-Generated Growth Insights</h3>
                            <p className="text-xs text-slate-400">Actionable recommendations grounded in your database metrics</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setCurrentTab('recommendations')}
                          className="text-xs font-bold text-[#0070E0] hover:text-[#005bb8] flex items-center gap-1"
                        >
                          <span>View All Insights</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {recommendations.recommendations.slice(0, 3).map((rec) => (
                          <div
                            key={rec.id}
                            className="p-4 bg-[#F5F7FA] rounded-2xl border border-slate-100 flex flex-col justify-between hover:bg-blue-50/40 transition-colors"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                  {rec.category}
                                </span>
                                <span className="text-[11px] font-extrabold text-emerald-600">
                                  {rec.impact_estimate}
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-[#172B4D] mb-1 leading-snug">
                                {rec.title}
                              </h4>
                              <p className="text-[11px] text-slate-500 line-clamp-2 mb-3">
                                {rec.description}
                              </p>
                            </div>

                            <button
                              onClick={() => {
                                alert(`Action Applied: ${rec.title}\nProjected Value: ${rec.impact_estimate}`);
                              }}
                              className="text-[11px] font-bold text-[#0070E0] hover:text-[#005bb8] flex items-center gap-1 pt-2 border-t border-slate-200/60"
                            >
                              <Zap className="w-3 h-3" />
                              <span>{rec.action_cta}</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Row 4: Recent Transactions Table Preview */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#172B4D]">
                        Recent Transactions
                      </h3>
                      <button
                        onClick={() => setCurrentTab('transactions')}
                        className="text-xs font-bold text-[#0070E0] hover:text-[#005bb8] flex items-center gap-1"
                      >
                        <span>View Full Ledger</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <TransactionTable
                      transactions={metrics.recent_transactions}
                      total={metrics.recent_transactions.length}
                      page={1}
                      pageSize={10}
                      onPageChange={() => {}}
                      onSearch={(q) => {
                        setTxnSearchQuery(q);
                        setCurrentTab('transactions');
                      }}
                      onStatusFilter={(s) => {
                        setTxnStatusFilter(s);
                        setCurrentTab('transactions');
                      }}
                      onSelectTransaction={(txn) => setSelectedTransaction(txn)}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: TRANSACTIONS TABLE */}
              {currentTab === 'transactions' && transactionsData && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-[#172B4D] tracking-tight">Transactions Ledger</h2>
                      <p className="text-xs text-[#6B7A90]">
                        Verified SQLite payment records with server-side capture status
                      </p>
                    </div>

                    {/* Small action button for Demo Checkout inside Transactions */}
                    <button
                      onClick={() => setIsStoreModalOpen(true)}
                      className="px-4 py-2 bg-[#0070E0] hover:bg-[#005bb8] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Test Sandbox Payment</span>
                    </button>
                  </div>

                  <TransactionTable
                    transactions={transactionsData.transactions}
                    total={transactionsData.total}
                    page={txnPage}
                    pageSize={transactionsData.page_size}
                    onPageChange={(p) => setTxnPage(p)}
                    onSearch={(q) => {
                      setTxnSearchQuery(q);
                      setTxnPage(1);
                    }}
                    onStatusFilter={(s) => {
                      setTxnStatusFilter(s);
                      setTxnPage(1);
                    }}
                    onSelectTransaction={(txn) => setSelectedTransaction(txn)}
                  />
                </div>
              )}

              {/* TAB 3: SALES ANALYTICS */}
              {currentTab === 'analytics' && (
                <AnalyticsView
                  metrics={metrics}
                  selectedDays={analyticsDays}
                  onDaysChange={(d) => {
                    setAnalyticsDays(d);
                    fetchDashboardData(d);
                  }}
                  onOpenAiChat={() => setIsVoiceDrawerOpen(true)}
                />
              )}

              {/* TAB 4: GROWTH INSIGHTS */}
              {currentTab === 'recommendations' && (
                <RecommendationsView
                  recommendationsData={recommendations}
                  onOpenStore={() => setIsStoreModalOpen(true)}
                  onOpenAiChat={() => setIsVoiceDrawerOpen(true)}
                  onSelectAction={(rec) => {
                    alert(`Strategy Activated: "${rec.title}"\nProjected Impact: ${rec.impact_estimate}`);
                  }}
                />
              )}

              {/* TAB 5: AI VOICE & BUSINESS ASSISTANT */}
              {currentTab === 'ai' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#172B4D] tracking-tight">AI Business Assistant</h2>
                    <p className="text-xs text-[#6B7A90]">
                      Voice-enabled business copilot grounded in actual SQLite metrics
                    </p>
                  </div>
                  <VoiceAiAssistant
                    isStandalonePage={true}
                    onActionTrigger={(act) => {
                      alert(`Applying Action: ${act.title}\n\n${act.action}`);
                    }}
                  />
                </div>
              )}

              {/* TAB 6: SETTINGS */}
              {currentTab === 'settings' && (
                <SettingsView
                  payPalConfig={payPalConfig}
                  merchantProfile={merchantProfile}
                  geminiConfigured={geminiConfigured}
                  onResetDemo={handleResetDemo}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* MODAL 1: Transaction Detail & Refund Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onRefund={handleRefundTransaction}
      />

      {/* MODAL 2: Demo Checkout Modal */}
      {isStoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <StorefrontDemo
              onOrderCompleted={handleOrderCompleted}
              payPalConfig={payPalConfig}
              onClose={() => setIsStoreModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* DRAWER: Slide-out AI Voice Assistant */}
      <AiChatDrawer
        isOpen={isVoiceDrawerOpen}
        onClose={() => setIsVoiceDrawerOpen(false)}
        onActionTrigger={(action: ActionItem) => {
          alert(`Applying Action: ${action.title}\n\n${action.action}`);
        }}
      />
    </div>
  );
};
