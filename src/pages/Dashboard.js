import React from 'react';
import { Search, Wifi, WifiOff, Edit } from 'lucide-react';
import { VoiceInput } from '../components/UIComponents';

export default function Dashboard({ data, isDark, isOnline, t, setIndexSearchTerm, indexSearchTerm, setView, setActivePageId }) {
  const filteredPages = data.pages.filter(p => p.itemName.toLowerCase().includes(indexSearchTerm.toLowerCase()));
  return (
    <div className="pb-24">
      <div className={`p-6 border-b-4 sticky top-0 z-10 ${isDark ? 'bg-slate-800' : 'bg-yellow-100'}`}>
        <div className="flex justify-between items-center"><h1 className="text-2xl font-extrabold">{data.settings.shopName}</h1>{isOnline ? <Wifi className="text-green-600"/> : <WifiOff className="text-red-500"/>}</div>
        <div className="flex gap-2 mt-3"><input value={indexSearchTerm} onChange={e => setIndexSearchTerm(e.target.value)} placeholder={t("Search Index...")} className="w-full p-2 rounded border"/><VoiceInput onResult={setIndexSearchTerm} isDark={isDark} /></div>
      </div>
      <div className="p-2">
         {filteredPages.map(page => (
            <div key={page.id} onClick={() => { setActivePageId(page.id); setView('page'); }} className={`p-4 border-b flex justify-between cursor-pointer ${isDark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
                <span>{page.pageNo}. {t(page.itemName)}</span>
            </div>
         ))}
      </div>
    </div>
  );
}