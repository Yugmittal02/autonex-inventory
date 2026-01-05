import React from 'react';
import {
  Book,
  ChevronRight,
  Languages,
  Minus,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';

type Props = {
  isDark: boolean;
  isHindi: boolean;
  t: (text: any) => string;

  data: any;
  filteredStock: any[];
  displayLimit: number;
  setDisplayLimit: (updater: any) => void;

  stockSearchTerm: string;
  setStockSearchTerm: (val: string) => void;

  isSafeMode: boolean;
  setIsSafeMode: (val: boolean) => void;

  setActiveToolId: (id: string) => void;
  setView: (view: any) => void;

  setActivePageId: (id: any) => void;
  setPageSearchTerm: (val: string) => void;

  updateQtyBuffer: (entryId: string, delta: number, originalQty: number) => void;
  tempChanges: Record<string, any>;

  VoiceInput: any;
};

export default function StockSearchView(props: Props) {
  const {
    isDark,
    isHindi,
    t,
    data,
    filteredStock,
    displayLimit,
    setDisplayLimit,
    stockSearchTerm,
    setStockSearchTerm,
    isSafeMode,
    setIsSafeMode,
    setActiveToolId,
    setView,
    setActivePageId,
    setPageSearchTerm,
    updateQtyBuffer,
    tempChanges,
    VoiceInput,
  } = props;

  const visibleStock = (filteredStock || []).slice(0, displayLimit);

  return (
    <div className={`pb-24 min-h-screen p-4 ${isDark ? 'bg-slate-950' : 'bg-gray-100'}`}>
      <div className="mb-4 sticky top-0 z-10 pt-2 pb-2 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-4">
          <h1 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            <Search /> {t('Global Search')}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setIsSafeMode(!isSafeMode)}
              className={`p-1 rounded-full border ${
                isSafeMode
                  ? 'bg-green-100 text-green-700 border-green-500'
                  : 'bg-gray-200 text-gray-400'
              }`}
              type="button"
            >
              {isSafeMode ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              className={`w-full pl-9 p-3 rounded-xl border outline-none shadow-sm ${
                isDark
                  ? 'bg-slate-800 border-slate-600 text-white'
                  : 'bg-white border-gray-300 text-black'
              }`}
              placeholder={t('Type Car Name (e.g. Swift)...')}
              value={stockSearchTerm}
              onChange={(e) => setStockSearchTerm((e.target as HTMLInputElement).value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            {stockSearchTerm && (
              <button
                onClick={() => setStockSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                type="button"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <VoiceInput onResult={setStockSearchTerm} isDark={isDark} lang={isHindi ? 'hi-IN' : 'en-IN'} />
        </div>

        {/* Quick actions */}
        <div className="mt-3">
          <button
            onClick={() => {
              setActiveToolId('translator');
              setView('tools');
            }}
            className={`w-full p-3 rounded-xl border shadow-sm flex items-center justify-between font-bold ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-800'
            }`}
            type="button"
          >
            <span className="inline-flex items-center gap-2">
              <Languages size={18} className="text-pink-600" />
              {t('Translator')}
            </span>
            <ChevronRight size={18} className={isDark ? 'text-slate-400' : 'text-gray-400'} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {!stockSearchTerm && (
          <div className="flex flex-col items-center justify-center mt-20 opacity-40">
            <Search size={48} className="mb-4" />
            <p className="font-bold">{t('Type above to search...')}</p>
          </div>
        )}

        {visibleStock.map((entry: any) => {
          const p = (data?.pages || []).find((page: any) => page.id === entry.pageId);
          return (
            <div
              key={entry.id}
              className={`p-4 rounded-xl border-l-4 shadow-sm flex items-center justify-between ${
                isDark
                  ? 'bg-slate-800 border-l-blue-500 border-slate-700 text-white'
                  : 'bg-white border-l-blue-500 border-gray-200 text-black'
              }`}
            >
              <div className="flex-1">
                <h3 className="font-bold text-xl">{t(p?.itemName || 'Unknown Item')}</h3>
                <p className="text-sm mt-1 font-semibold opacity-70">
                  {t('For')}: {t(entry.car)}
                </p>
                <div
                  onClick={() => {
                    if (p) {
                      setActivePageId(p.id);
                      setView('page');
                      setPageSearchTerm(stockSearchTerm);
                    }
                  }}
                  className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded mt-2 cursor-pointer hover:underline border ${
                    isDark
                      ? 'bg-slate-700 text-blue-300 border-slate-600'
                      : 'bg-gray-100 text-blue-700 border-gray-300'
                  }`}
                >
                  <Book size={10} /> {t('Go to Page')} <ChevronRight size={10} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateQtyBuffer(entry.id, -1, entry.qty)}
                  className="w-8 h-8 rounded-full border bg-gray-100 text-red-600 flex items-center justify-center active:scale-90 transition-transform"
                  type="button"
                >
                  <Minus size={16} />
                </button>

                <span
                  className={`text-xl font-mono font-bold w-8 text-center ${
                    tempChanges?.[entry.id] ? 'text-blue-500' : ''
                  }`}
                >
                  {tempChanges?.[entry.id] !== undefined ? tempChanges?.[entry.id] : entry.qty}
                </span>

                <button
                  onClick={() => updateQtyBuffer(entry.id, 1, entry.qty)}
                  className="w-8 h-8 rounded-full border bg-gray-100 text-green-600 flex items-center justify-center active:scale-90 transition-transform"
                  type="button"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          );
        })}

        {stockSearchTerm && (filteredStock || []).length === 0 && (
          <div className="text-center mt-10 opacity-50 font-bold">{t('No Items Found')}</div>
        )}

        {(filteredStock || []).length > displayLimit && (
          <button
            onClick={() => setDisplayLimit((prev: number) => prev + 50)}
            className="w-full py-4 text-blue-500 font-bold opacity-70"
            type="button"
          >
            {t('Load More')}... ({t('Showing')} {visibleStock.length} {t('of')} {(filteredStock || []).length})
          </button>
        )}
      </div>
    </div>
  );
}
