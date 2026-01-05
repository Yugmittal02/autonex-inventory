import React from 'react';
import { Edit, Minus, Plus } from 'lucide-react';

type EntryRowProps = {
  index: number;
  entry: any;
  t: (text: string) => string;
  isDark: boolean;
  onUpdateBuffer: (id: string, delta: number, originalQty: number) => void;
  onEdit: (entry: any) => void;
  limit: number;
  tempQty?: number;
};

export const EntryRow = React.memo(
  ({ index, entry, t, isDark, onUpdateBuffer, onEdit, limit, tempQty }: EntryRowProps) => {
    const displayQty = tempQty !== undefined ? tempQty : entry.qty;
    const isModified = tempQty !== undefined;
    const isLowStock = displayQty < limit;

    return (
      <div
        className={`flex items-center p-3 border-b ${
          isDark ? 'border-slate-700 text-white' : 'border-red-100'
        } ${isLowStock ? (isDark ? 'bg-red-900/20' : 'bg-red-50') : ''}`}
      >
        <div className="w-6 text-xs text-gray-400 font-mono pl-1">{index + 1}</div>

        <div className="flex-[2] font-semibold text-sm pr-2 truncate">
          <span className={isLowStock ? 'text-red-500' : ''}>{t(entry.car)}</span>
        </div>

        <div className="flex-[1] flex items-center justify-center gap-1">
          <button
            onClick={() => onUpdateBuffer(entry.id, -1, entry.qty)}
            className={`w-7 h-7 rounded-full border flex items-center justify-center active:scale-90 transition-transform ${
              isDark
                ? 'bg-slate-700 border-slate-600 text-red-400'
                : 'bg-red-50 border-red-200 text-red-600'
            }`}
          >
            <Minus size={14} />
          </button>

          <span
            className={`text-lg font-mono font-bold w-8 text-center ${
              isModified ? 'text-blue-500' : isLowStock ? 'text-red-500' : ''
            }`}
          >
            {displayQty}
          </span>

          <button
            onClick={() => onUpdateBuffer(entry.id, 1, entry.qty)}
            className={`w-7 h-7 rounded-full border flex items-center justify-center active:scale-90 transition-transform ${
              isDark
                ? 'bg-slate-700 border-slate-600 text-green-400'
                : 'bg-green-50 border-green-200 text-green-600'
            }`}
          >
            <Plus size={14} />
          </button>
        </div>

        <button
          onClick={() => onEdit(entry)}
          className="ml-3 p-2 text-gray-400 hover:text-blue-500 active:scale-90 transition-transform bg-gray-50 rounded-full border border-gray-100"
        >
          <Edit size={16} />
        </button>
      </div>
    );
  }
);

EntryRow.displayName = 'EntryRow';

export default EntryRow;
