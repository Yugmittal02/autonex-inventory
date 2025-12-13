import React from 'react';
import { Camera, Trash2, Smartphone } from 'lucide-react';

export default function BillsPage({ data, isDark, t, handleBillUpload, handleDeleteBill }) {
  return (
    <div className={`pb-24 min-h-screen p-4 ${isDark ? 'bg-slate-950 text-white' : 'bg-gray-100 text-black'}`}>
         <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold flex items-center gap-2"><Camera/> {t("My Bills")}</h2></div>
         <div className="p-6 rounded-2xl border-2 border-dashed mb-6 flex flex-col items-center justify-center gap-3">
             <label className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold cursor-pointer flex items-center gap-2">
                 <Smartphone size={20}/> {t("Open Camera")}
                 <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleBillUpload} />
             </label>
         </div>
         <div className="grid grid-cols-2 gap-4">
             {data.bills.map(bill => (
                 <div key={bill.id} className="rounded-xl overflow-hidden border relative group">
                     <img src={bill.image} alt="Bill" className="w-full h-40 object-cover" />
                     <button onClick={() => handleDeleteBill(bill)} className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full"><Trash2 size={16}/></button>
                 </div>
             ))}
         </div>
    </div>
  );
}