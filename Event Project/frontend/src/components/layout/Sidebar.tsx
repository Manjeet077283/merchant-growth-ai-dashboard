import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  TrendingUp,
  Lightbulb,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Bot
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'analytics', label: 'Sales Analytics', icon: TrendingUp },
    { id: 'recommendations', label: 'Growth Insights', icon: Lightbulb },
    { id: 'ai', label: 'AI Assistant', icon: Sparkles, highlightBadge: 'Voice' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`bg-white border-r border-slate-100 flex flex-col shrink-0 select-none transition-all duration-300 z-20 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-20 px-6 flex items-center justify-between border-b border-slate-100">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#003087] to-[#0070E0] flex items-center justify-center text-white font-black text-xl shadow-sm">
              M
            </div>
            <div>
              <div className="text-base font-extrabold text-[#172B4D] tracking-tight flex items-center gap-1.5">
                Merchant AI
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Growth Intelligence</p>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 mx-auto rounded-2xl bg-gradient-to-tr from-[#003087] to-[#0070E0] flex items-center justify-center text-white font-black text-xl shadow-sm">
            M
          </div>
        )}

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors hidden md:block"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-[#0070E0] text-white shadow-[0_4px_16px_rgba(0,112,224,0.25)]'
                  : 'text-[#6B7A90] hover:bg-[#F5F7FA] hover:text-[#172B4D]'
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />

              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between text-left">
                  <span>{item.label}</span>
                  {item.highlightBadge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[#EAF3FC] text-[#0070E0]'
                      }`}
                    >
                      {item.highlightBadge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Assistant Trigger Card (if not collapsed) */}
      {!isCollapsed ? (
        <div className="p-4 m-3 bg-[#F5F7FA] rounded-2xl border border-slate-100/80">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 rounded-xl bg-[#EAF3FC] flex items-center justify-center text-[#0070E0]">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#172B4D]">Voice Assistant</div>
              <div className="text-[10px] text-slate-400">English &amp; Hindi speech</div>
            </div>
          </div>
          <button
            onClick={() => onSelectTab('ai')}
            className="w-full py-2 px-3 bg-white hover:bg-[#EAF3FC] text-[#0070E0] border border-blue-100 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Voice Agent</span>
          </button>
        </div>
      ) : (
        <div className="p-3 text-center">
          <button
            onClick={() => onSelectTab('ai')}
            className="w-10 h-10 mx-auto rounded-2xl bg-[#EAF3FC] text-[#0070E0] flex items-center justify-center shadow-2xs hover:bg-blue-100 transition-colors"
            title="Open Voice Assistant"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>
      )}
    </aside>
  );
};
