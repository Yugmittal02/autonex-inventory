import React, { useMemo } from 'react';
import { PackageX, TrendingDown, ChevronDown } from 'lucide-react';

type DeadStockAlertProps = {
  data: any;
  onNavigate?: (pageId: string) => void;
};

export const DeadStockAlert = ({ data, onNavigate }: DeadStockAlertProps) => {
  const DEAD_DAYS_THRESHOLD = 180; // 6 Months

  const deadStockStats = useMemo(() => {
    if (!data.entries || data.entries.length === 0) return { count: 0, totalQty: 0, items: [] };

    const now = Date.now();
    const msInDay = 1000 * 60 * 60 * 24;

    // Find items older than 180 days that still have stock
    const deadItems = data.entries.filter((item: any) => {
      const itemTime = item.lastUpdated || item.id;
      const diffDays = (now - itemTime) / msInDay;
      return diffDays > DEAD_DAYS_THRESHOLD && item.qty > 0;
    });

    // Calculate total pieces
    const totalQty = deadItems.reduce((acc: number, curr: any) => acc + curr.qty, 0);

    return {
      count: deadItems.length,
      totalQty: totalQty,
      items: deadItems,
    };
  }, [data.entries]);

  if (deadStockStats.count === 0) return null;

  return (
    <div className="mx-4 mt-4 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 p-2.5 rounded-full text-red-600 shadow-sm">
            <PackageX size={22} />
          </div>
          <div>
            <h3 className="font-bold text-red-800 text-lg">Dead Stock Alert</h3>
            <p className="text-xs text-red-600 font-semibold opacity-80">
              {deadStockStats.count} items stuck &gt; 6 Months
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase font-bold text-red-500 tracking-wider">Stuck Inventory</p>
          <h2 className="text-2xl font-black text-red-700">
            {deadStockStats.totalQty} <span className="text-sm font-bold">Units</span>
          </h2>
        </div>
      </div>

      <details className="group">
        <summary className="cursor-pointer text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 mt-2 select-none border-t border-red-200 pt-2 list-none">
          <TrendingDown size={14} /> View Dead Stock List
          <ChevronDown size={14} className="ml-auto group-open:rotate-180 transition-transform" />
        </summary>

        <div className="mt-3 space-y-2 max-h-60 overflow-y-auto pr-1">
          {deadStockStats.items.map((item: any) => {
            const page = data.pages.find((p: any) => p.id === item.pageId);
            const daysSinceUpdate = Math.floor(
              (Date.now() - (item.lastUpdated || item.id)) / (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={item.id}
                onClick={() => onNavigate && onNavigate(item.pageId)}
                className="bg-white p-3 rounded-lg border border-red-100 flex justify-between items-center shadow-sm cursor-pointer hover:bg-red-50 transition-colors"
              >
                <div>
                  <p className="font-bold text-gray-800">{item.car}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                      {page?.itemName || 'Unknown'}
                    </span>
                    <span className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                      {daysSinceUpdate} days old
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-xl font-bold text-red-600">{item.qty}</span>
                  <span className="text-[9px] text-red-400">Pcs</span>
                </div>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
};

export default DeadStockAlert;
