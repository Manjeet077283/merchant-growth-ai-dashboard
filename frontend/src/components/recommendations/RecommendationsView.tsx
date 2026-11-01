import React, { useState } from 'react';
import { RecommendationsResponse, RecommendationItem } from '../../types';
import {
  Lightbulb,
  Sparkles,
  Zap,
  Target,
  ArrowRight,
  CheckCircle2,
  Filter
} from 'lucide-react';

interface RecommendationsViewProps {
  recommendationsData: RecommendationsResponse | null;
  onOpenStore: () => void;
  onOpenAiChat: () => void;
  onSelectAction?: (rec: RecommendationItem) => void;
}

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({
  recommendationsData,
  onOpenStore,
  onOpenAiChat,
  onSelectAction,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [appliedActions, setAppliedActions] = useState<Set<string>>(new Set());

  if (!recommendationsData) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-slate-400">
        <Sparkles className="w-8 h-8 animate-spin mx-auto mb-2 text-[#0070E0]" />
        Generating grounded merchant growth recommendations...
      </div>
    );
  }

  const { overall_health_score, summary, recommendations } = recommendationsData;

  const categories = ['ALL', ...Array.from(new Set(recommendations.map((r) => r.category)))];

  const filteredRecs =
    selectedCategory === 'ALL'
      ? recommendations
      : recommendations.filter((r) => r.category === selectedCategory);

  const handleApply = (id: string, rec: RecommendationItem) => {
    setAppliedActions((prev) => new Set(prev).add(id));
    if (onSelectAction) onSelectAction(rec);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-tr from-[#003087] via-[#005bb8] to-[#0070E0] text-white rounded-3xl p-7 shadow-[0_4px_25px_rgba(0,112,224,0.15)] flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-3 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-100" />
              <span>Grounded Growth Intelligence</span>
            </div>
            <h2 className="text-xl font-black tracking-tight mb-2">
              Merchant Action Plan
            </h2>
            <p className="text-xs text-blue-100 leading-relaxed max-w-xl">
              {summary}
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-white/15 flex items-center justify-between text-xs">
            <span className="text-blue-200">
              Grounded in live SQLite sales &amp; refund transactions
            </span>
            <button
              onClick={onOpenAiChat}
              className="text-white hover:text-blue-100 font-bold flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-all"
            >
              <span>Consult AI Assistant</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Business Health Score Card */}
        <div className="bg-white rounded-3xl border border-slate-100/90 p-7 shadow-[0_4px_20px_rgba(23,43,77,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#6B7A90] uppercase tracking-wider">
                Store Health Score
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                Strong
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-[#172B4D] tracking-tight">
                {overall_health_score}
              </span>
              <span className="text-sm font-bold text-slate-400">/ 100</span>
            </div>
            <div className="w-full bg-[#F5F7FA] rounded-full h-2.5 mt-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#0070E0] to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${overall_health_score}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-50 text-xs text-[#6B7A90]">
            Primary performance drivers: Healthy checkout conversion, low refund rate (&lt;3.5%), and strong specialty product margins.
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-bold text-[#172B4D] shrink-0">Focus:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#0070E0] text-white shadow-xs'
                  : 'bg-white text-[#6B7A90] border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {cat === 'ALL' ? 'All Levers' : cat}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 shrink-0">
          Showing {filteredRecs.length} high-impact recommendations
        </span>
      </div>

      {/* Recommendations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredRecs.map((rec) => {
          const isApplied = appliedActions.has(rec.id);

          return (
            <div
              key={rec.id}
              className={`bg-white rounded-3xl border transition-all p-6 shadow-[0_4px_20px_rgba(23,43,77,0.03)] hover:shadow-hover flex flex-col justify-between ${
                isApplied ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-100/90'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-[#F5F7FA] px-2.5 py-0.5 rounded-full">
                      {rec.category}
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EAF3FC] text-[#0070E0]">
                      {rec.impact_level} Impact
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {rec.effort_level}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-400">
                    {rec.confidence_score}% Confidence
                  </div>
                </div>

                <h3 className="text-base font-bold text-[#172B4D] mb-2 leading-snug">
                  {rec.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {rec.description}
                </p>

                <div className="p-3.5 bg-[#F5F7FA] rounded-2xl border border-slate-100 mb-4 text-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 flex items-center gap-1">
                    <Target className="w-3 h-3 text-[#0070E0]" />
                    <span>Transaction Metric Evidence</span>
                  </div>
                  <div className="text-[#172B4D] font-medium">
                    {rec.metric_evidence}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-semibold text-slate-400">Projected Lift</div>
                  <div className="text-sm font-extrabold text-emerald-600">
                    {rec.impact_estimate}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isApplied ? (
                    <span className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Applied
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApply(rec.id, rec)}
                      className="px-4 py-2 bg-[#0070E0] hover:bg-[#005bb8] text-white rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{rec.action_cta}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
