import React, { useState } from 'react';
import { Camera, Trash2, Smartphone } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from '../config/firebase';
import { compressImage } from '../utils/helpers';
import ImageModal from '../components/ImageModal';

const BillsPage = ({ data, isDark, t, pushToFirebase, user, showToast }) => {
  const [viewImage, setViewImage] = useState(null);

  const handleBillUpload = async (e) => {
    if(data.bills.length >= 50) return alert("Storage Limit Reached (Max 50 Photos)");
    const file = e.target.files[0];
    if(!file) return;
    
    showToast("Processing & Uploading...");
    
    try {
        const compressedBlob = await compressImage(file);
        const timestamp = Date.now();
        const storagePath = `bills/${user.uid}/${timestamp}.jpg`;
        const storageRef = ref(storage, storagePath);
        
        await uploadBytes(storageRef, compressedBlob);
        const downloadUrl = await getDownloadURL(storageRef);

        const newBill = { id: timestamp, date: new Date().toISOString(), image: downloadUrl, path: storagePath };
        const newData = { ...data, bills: [newBill, ...(data.bills || [])] };
        await pushToFirebase(newData);
        showToast("Bill Saved!");
    } catch (err) {
        showToast("Upload Failed", "error");
    }
  };

  return (
    <div className={`pb-24 min-h-screen p-4 ${isDark ? 'bg-slate-950 text-white' : 'bg-gray-100 text-black'}`}>
         {viewImage && <ImageModal src={viewImage} onClose={()=>setViewImage(null)} onDelete={() => { alert("Use delete button on card"); setViewImage(null); }} />}

         <div className="flex justify-between items-center mb-6">
             <h2 className="text-2xl font-bold flex items-center gap-2"><Camera/> {t("My Bills")}</h2>
         </div>

         <div className={`p-6 rounded-2xl border-2 border-dashed mb-6 flex flex-col items-center justify-center gap-3 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-300 bg-white'}`}>
             <div className="bg-blue-100 p-4 rounded-full text-blue-600"><Camera size={32} /></div>
             <p className="font-bold text-center">{t("Take Photo of Bill")}</p>
             <label className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg active:scale-95 cursor-pointer flex items-center gap-2">
                 <Smartphone size={20}/> {t("Open Camera")}
                 <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleBillUpload} />
             </label>
         </div>

         <h3 className="font-bold mb-4 opacity-70 uppercase text-xs tracking-widest">{t("Recent Bills")} (Max 50)</h3>
         
         <div className="grid grid-cols-2 gap-4">
             {(!data.bills || data.bills.length === 0) && <p className="col-span-2 text-center opacity-50 italic">No bills uploaded yet.</p>}
             {(data.bills || []).sort((a,b) => +new Date(b.date) - +new Date(a.date)).map(bill => (
                 <div key={bill.id} onClick={() => setViewImage(bill.image ? bill.image : bill)} className={`rounded-xl overflow-hidden border shadow-sm relative group cursor-pointer ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                     <img src={bill.image ? bill.image : bill} alt="Bill" className="w-full h-40 object-cover" />
                     <div className="p-2"><p className="text-[10px] opacity-70">{new Date(bill.date || Date.now()).toLocaleDateString()}</p></div>
                 </div>
             ))}
         </div>
    </div>
  );
};
export default BillsPage;