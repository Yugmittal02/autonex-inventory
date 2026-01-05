import React, { useMemo } from 'react';
import { Layers, Activity, AlertCircle, Ban } from 'lucide-react';

type QuickStatsProps = {
  data: any;
};

export const QuickStats = ({ data }: QuickStatsProps) => {
  const stats = useMemo(() => {
    const entries = data.entries || [];
    const totalItems = entries.length;
    const totalStock = entries.reduce((acc: number, e: any) => acc + (e.qty || 0), 0);
    const lowStock = entries.filter((e: any) => e.qty < (data.settings?.limit || 5)).length;
    const outOfStock = entries.filter((e: any) => e.qty === 0).length;

    return { totalItems, totalStock, lowStock, outOfStock };
  }, [data.entries, data.settings?.limit]);

  return (
    <div className="mx-4 mt-4 grid grid-cols-4 gap-2">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-2xl text-center border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="bg-blue-500 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg shadow-blue-500/30">
          <Layers size={16} className="text-white" />
        </div>
        <p className="text-2xl font-black text-blue-700">{stats.totalItems}</p>
        <p className="text-[10px] font-bold text-blue-500 uppercase">Items</p>
      </div>
      <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-2xl text-center border border-green-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="bg-green-500 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg shadow-green-500/30">
          <Activity size={16} className="text-white" />
        </div>
        <p className="text-2xl font-black text-green-700">{stats.totalStock}</p>
        <p className="text-[10px] font-bold text-green-500 uppercase">Total Pcs</p>
      </div>
      <div className="bg-gradient-to-br from-yellow-50 to-orange-100 p-3 rounded-2xl text-center border border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="bg-yellow-500 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg shadow-yellow-500/30">
          <AlertCircle size={16} className="text-white" />
        </div>
        <p className="text-2xl font-black text-yellow-700">{stats.lowStock}</p>
        <p className="text-[10px] font-bold text-yellow-600 uppercase">Low</p>
      </div>
      <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 rounded-2xl text-center border border-red-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="bg-red-500 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg shadow-red-500/30">
          <Ban size={16} className="text-white" />
        </div>
        <p className="text-2xl font-black text-red-700">{stats.outOfStock}</p>
        <p className="text-[10px] font-bold text-red-500 uppercase">Empty</p>
      </div>
    </div>
  );
};

export default QuickStats;
