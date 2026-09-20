import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { Zap, Calculator, Flame, AlertCircle, CheckCircle2, ChevronRight, TrendingUp } from 'lucide-react';

export default function PulseInsightsCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  async function fetchInsights() {
    try {
      const res = await apiRequest('/student/insights');
      if (res.success) {
        setData(res);
        if (res.recoveryCalculations?.length > 0) {
          setSelectedSubjectId(res.recoveryCalculations[0].subject_id);
        }
      }
    } catch (err) {
      console.error('Fetch insights error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !data) return null;

  const activeCalc = data.recoveryCalculations?.find(c => c.subject_id === Number(selectedSubjectId));

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 rounded-3xl p-6 text-white shadow-xl border border-indigo-500/20 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base leading-tight">Pulse Insights</h3>
            <p className="text-[11px] text-indigo-200">Smart Attendance & Recovery Analytics</p>
          </div>
        </div>

        {/* Streak Counter */}
        <div className="flex items-center space-x-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold rounded-full">
          <Flame className="w-4 h-4 fill-amber-400" />
          <span>{data.streak_count} Class Streak</span>
        </div>
      </div>

      {/* Insights List */}
      {data.insights?.length > 0 && (
        <div className="space-y-2">
          {data.insights.map((ins, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-2xl text-xs flex items-start space-x-2.5 border ${
                ins.type === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
              }`}
            >
              {ins.type === 'warning' ? (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold">{ins.title}</p>
                <p className="text-[11px] mt-0.5 opacity-90 leading-relaxed">{ins.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recovery Calculator Widget */}
      <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs text-indigo-300 font-semibold">
            <Calculator className="w-4 h-4 text-indigo-400" />
            <span>Attendance Recovery Calculator</span>
          </div>

          <select
            value={selectedSubjectId || ''}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="bg-slate-800 text-white text-xs px-2.5 py-1 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {data.recoveryCalculations.map(c => (
              <option key={c.subject_id} value={c.subject_id}>
                {c.subject_code}
              </option>
            ))}
          </select>
        </div>

        {activeCalc && (
          <div className="pt-2 border-t border-slate-800 text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-300">
              <span>Current Attendance:</span>
              <span className={`font-bold ${activeCalc.is_above_threshold ? 'text-emerald-400' : 'text-amber-400'}`}>
                {activeCalc.current_percentage}% ({activeCalc.present_count}/{activeCalc.total_classes})
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span>Required Campus Threshold:</span>
              <span className="font-semibold text-white">{activeCalc.target_threshold}%</span>
            </div>

            <div className="p-3 bg-indigo-950/60 rounded-xl border border-indigo-900/50 flex items-center justify-between text-indigo-100 mt-2">
              <span className="font-medium text-[11px]">Future classes required:</span>
              <span className="font-black text-sm text-indigo-400">
                {activeCalc.required_consecutive_classes === 0 ? (
                  <span className="text-emerald-400 font-bold">Goal Achieved 🎉</span>
                ) : (
                  `${activeCalc.required_consecutive_classes} consecutive classes`
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
