import React, { useMemo } from 'react';
import { Activity } from 'lucide-react';
import { AIEngine } from '../../services/aiEngine';

type SalesPredictionWidgetProps = {
  data: {
    salesEvents?: any[];
    settings?: { aiPredictions?: boolean };
  };
  t: (text: string) => string;
  isDark: boolean;
};

type Prediction = {
  daily: number;
  weekly: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  confidence: number;
};

export const SalesPredictionWidget: React.FC<SalesPredictionWidgetProps> = ({ data, t, isDark }) => {
  const prediction = useMemo<Prediction | null>(() => {
    const events = (data.salesEvents || []).filter((e: any) => e && e.type === 'sale');
    if (!events.length) return null;

    const days = 14;
    const dayKeys: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dayKeys.push(d.toISOString().slice(0, 10));
    }

    const totalsByDay = new Map<string, number>();
    for (const key of dayKeys) totalsByDay.set(key, 0);

    for (const ev of events) {
      const ts = typeof ev.ts === 'number' ? ev.ts : ev.date ? Date.parse(ev.date) : NaN;
      if (!Number.isFinite(ts)) continue;
      const day = new Date(ts).toISOString().slice(0, 10);
      if (!totalsByDay.has(day)) continue;
      const qty = Number(ev.qty || 0);
      if (qty > 0) totalsByDay.set(day, (totalsByDay.get(day) || 0) + qty);
    }

    const series = dayKeys.map((k) => totalsByDay.get(k) || 0);
    const total = series.reduce((a, b) => a + b, 0);
    if (total <= 0) return null;

    const nextDayPrediction = AIEngine.exponentialSmoothing(series, 0.35);
    const weeklyPrediction = nextDayPrediction * 7;

    const recentAvg = series.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const olderAvg = series.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const trend: 'up' | 'down' | 'stable' =
      recentAvg > olderAvg ? 'up' : recentAvg < olderAvg ? 'down' : 'stable';
    const trendPercent = olderAvg > 0 ? Math.abs(Math.round(((recentAvg - olderAvg) / olderAvg) * 100)) : 0;

    const nonZeroDays = series.filter((v) => v > 0).length;
    const confidence = Math.min(95, Math.max(55, Math.round(50 + (nonZeroDays / days) * 45)));

    return {
      daily: Math.max(0, Math.round(nextDayPrediction)),
      weekly: Math.max(0, Math.round(weeklyPrediction)),
      trend,
      trendPercent,
      confidence,
    };
  }, [data.salesEvents]);

  if (!data.settings?.aiPredictions) return null;

  if (!prediction) {
    return (
      <div className="mx-4 mt-4">
        <div
          className={`p-4 rounded-2xl ${
            isDark ? 'bg-slate-800' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'
          } border ${isDark ? 'border-slate-700' : 'border-indigo-200'}`}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Activity size={16} className="text-white" />
            </div>
            <div>
              <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {t('Sales Prediction')}
              </h3>
              <p className="text-[10px] text-gray-500">{t('No sales history yet')}</p>
            </div>
          </div>
          <p className={`mt-3 text-xs ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
            {t('Update stock (sell/restock) to generate real reports.')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-4">
      <div
        className={`p-4 rounded-2xl ${
          isDark ? 'bg-slate-800' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'
        } border ${isDark ? 'border-slate-700' : 'border-indigo-200'}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Activity size={16} className="text-white" />
            </div>
            <div>
              <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {t('Sales Prediction')}
              </h3>
              <p className="text-[10px] text-gray-500">AI-powered forecast</p>
            </div>
          </div>
          <span
            className={`text-[10px] px-2 py-1 rounded-full font-bold ${
              prediction.trend === 'up'
                ? 'bg-green-100 text-green-700'
                : prediction.trend === 'down'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
            }`}
          >
            {prediction.trendPercent}%
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-slate-700' : 'bg-white/60'}`}>
            <p className="text-2xl font-black text-indigo-600">{prediction.daily}</p>
            <p className="text-[10px] text-gray-500 font-bold">TODAY</p>
          </div>
          <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-slate-700' : 'bg-white/60'}`}>
            <p className="text-2xl font-black text-purple-600">{prediction.weekly}</p>
            <p className="text-[10px] text-gray-500 font-bold">WEEK</p>
          </div>
          <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-slate-700' : 'bg-white/60'}`}>
            <p className="text-2xl font-black text-pink-600">{prediction.confidence}%</p>
            <p className="text-[10px] text-gray-500 font-bold">ACCURACY</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesPredictionWidget;
