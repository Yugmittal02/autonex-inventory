import React, { useMemo } from 'react';
import { Zap, ChevronRight } from 'lucide-react';

type Insight = {
  type: string;
  title: string;
  message: string;
  priority: number;
  color: 'purple' | 'red' | 'yellow' | 'blue' | 'green' | 'gray' | 'indigo';
};

type AIInsightsWidgetProps = {
  data: {
    entries?: any[];
    pages?: any[];
    settings?: { limit?: number };
  };
  t: (text: string) => string;
  isDark: boolean;
};

const colorClasses: Record<string, string> = {
  purple: 'from-purple-50 to-purple-100 border-purple-200',
  red: 'from-red-50 to-red-100 border-red-200',
  yellow: 'from-yellow-50 to-orange-100 border-yellow-200',
  blue: 'from-blue-50 to-blue-100 border-blue-200',
  green: 'from-green-50 to-green-100 border-green-200',
  gray: 'from-gray-50 to-gray-100 border-gray-200',
  indigo: 'from-indigo-50 to-indigo-100 border-indigo-200',
};

export const AIInsightsWidget: React.FC<AIInsightsWidgetProps> = ({ data, t, isDark }) => {
  const insights = useMemo<Insight[]>(() => {
    const entries = data.entries || [];
    const pages = data.pages || [];
    if (entries.length < 3) return [];

    const results: Insight[] = [];

    // 1. Smart Category Analysis
    const categoryMap = new Map<string, any[]>();
    for (const e of entries) {
      const pid = e.pageId;
      if (!categoryMap.has(pid)) categoryMap.set(pid, []);
      categoryMap.get(pid)!.push(e);
    }

    const inactiveCategories = [...categoryMap.entries()].filter(
      ([_, items]) => items.every((i) => i.qty === 0)
    );
    if (inactiveCategories.length > 0) {
      const page = pages.find((p: any) => p.id === inactiveCategories[0][0]);
      if (page) {
        results.push({
          type: 'category',
          title: 'Category Alert',
          message: `"${page.name}" has all items out of stock.`,
          priority: 1,
          color: 'purple',
        });
      }
    }

    // 2. Low Stock Prediction
    const lowStockItems = entries.filter((e) => e.qty > 0 && e.qty < (data.settings?.limit || 5));
    if (lowStockItems.length > 0) {
      const urgentItems = lowStockItems.filter((e) => e.qty <= 2);
      results.push({
        type: 'reorder',
        title: 'Reorder Alert',
        message:
          urgentItems.length > 0
            ? `${urgentItems.length} items critically low! Reorder immediately.`
            : `${lowStockItems.length} items running low. Plan restocking.`,
        priority: urgentItems.length > 0 ? 0 : 2,
        color: urgentItems.length > 0 ? 'red' : 'yellow',
      });
    }

    // 3. Stock Distribution Analysis
    const totalStock = entries.reduce((sum, e) => sum + e.qty, 0);
    const avgStock = totalStock / (entries.length || 1);
    const overstocked = entries.filter((e) => e.qty > avgStock * 3);
    if (overstocked.length > 0) {
      results.push({
        type: 'overstock',
        title: 'Overstock Detected',
        message: `${overstocked.length} items have excessive stock. Consider promotions.`,
        priority: 3,
        color: 'blue',
      });
    }

    // 4. Dead Stock Analysis
    const deadStock = entries.filter(
      (e) =>
        e.qty > 10 &&
        e.lastUpdated &&
        Date.now() - new Date(e.lastUpdated).getTime() > 30 * 24 * 60 * 60 * 1000
    );
    if (deadStock.length > 0) {
      results.push({
        type: 'dead',
        title: 'Dead Stock Alert',
        message: `${deadStock.length} items haven't moved in 30+ days.`,
        priority: 2,
        color: 'gray',
      });
    }

    // 5. Inventory Health Score
    const outOfStock = entries.filter((e) => e.qty === 0).length;
    const healthScore = Math.round(
      ((entries.length - outOfStock - lowStockItems.length) / (entries.length || 1)) * 100
    );
    results.push({
      type: 'health',
      title: 'Inventory Health',
      message: `Score: ${healthScore}% - ${
        healthScore >= 80 ? 'Excellent!' : healthScore >= 50 ? 'Needs attention' : 'Critical!'
      }`,
      priority: healthScore < 50 ? 1 : 4,
      color: healthScore >= 80 ? 'green' : healthScore >= 50 ? 'yellow' : 'red',
    });

    // 6. Page Organization Suggestion
    if (pages.length > 10 && entries.length > 50) {
      const avgItemsPerPage = entries.length / pages.length;
      if (avgItemsPerPage < 3) {
        results.push({
          type: 'organize',
          title: 'Organization Tip',
          message: 'Consider consolidating pages. Many have few items.',
          priority: 5,
          color: 'indigo',
        });
      }
    }

    return results.sort((a, b) => a.priority - b.priority).slice(0, 4);
  }, [data.entries, data.pages, data.settings?.limit]);

  if (insights.length === 0) return null;

  return (
    <div className="mx-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
          <Zap size={14} className="text-white" />
        </div>
        <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
          {t('AI Insights')}
        </h3>
        <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
          SMART
        </span>
      </div>

      <div className="space-y-2">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-xl bg-gradient-to-r ${colorClasses[insight.color]} border flex items-start gap-3 transition-all hover:scale-[1.01]`}
          >
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm text-gray-800">{insight.title}</h4>
              <p className="text-xs text-gray-600 line-clamp-2">{insight.message}</p>
            </div>
            <ChevronRight size={16} className="text-gray-400 shrink-0 mt-1" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIInsightsWidget;
