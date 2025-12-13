import React from 'react';
import { Grid } from 'lucide-react';

export default function AllPagesGrid({ data, isDark, t, setView, setActivePageId }) {
  return (
    <div className={`pb-24 p-4 ${isDark ? 'bg-slate-950' : 'bg-gray-100'}`}>
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-4"><Grid/> {t("All Pages")}</h1>
        <div className="flex flex-col gap-3">
            {data.pages.map(page => (
                <div key={page.id} onClick={() => { setActivePageId(page.id); setView('page'); }} className="p-4 rounded-xl border-2 bg-white text-black cursor-pointer">
                    <h3 className="font-bold text-xl">{t(page.itemName)}</h3>
                </div>
            ))}
        </div>
    </div>
  );
}