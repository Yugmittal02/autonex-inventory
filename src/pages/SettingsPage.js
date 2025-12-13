import React, { useState } from 'react';
import { Settings, Lock, ShieldCheck, LogOut } from 'lucide-react';
import { signOut } from "firebase/auth";
import { auth } from '../config/firebase';

export default function SettingsPage({ data, isDark, t, pushToFirebase, showToast }) {
  const [unlocked, setUnlocked] = useState(false);
  const [pass, setPass] = useState('');

  if (!unlocked) return (
     <div className="p-10 text-center">
        <Lock size={40} className="mx-auto mb-4"/>
        <input type="password" value={pass} onChange={e=>setPass(e.target.value)} className="border p-2 rounded mb-4 text-black" placeholder="Password"/>
        <button onClick={()=>{ if(pass===(data.settings.productPassword || '0000')) setUnlocked(true); else showToast("Wrong Pass", "error");}} className="bg-blue-600 text-white px-6 py-2 rounded">Unlock</button>
     </div>
  );

  return (
    <div className={`p-4 pb-24 ${isDark ? 'text-white' : 'text-black'}`}>
       <h2 className="text-2xl font-bold mb-6">Settings</h2>
       <div className="mb-6 border p-4 rounded-xl">
           <label>Shop Name</label>
           <input className="w-full p-2 border rounded mt-2 text-black" value={data.settings.shopName} onChange={e=>pushToFirebase({...data, settings: {...data.settings, shopName: e.target.value}})} />
       </div>
       <button onClick={()=>signOut(auth)} className="w-full py-3 bg-red-100 text-red-600 rounded font-bold flex items-center justify-center gap-2"><LogOut size={20}/> Logout</button>
    </div>
  );
}