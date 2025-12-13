import React, { useState, useEffect, useCallback } from 'react';
import { Book, Grid, Search, AlertTriangle, Camera, Settings, ArrowLeft, SaveAll, Plus, ChevronRight } from 'lucide-react';

// --- IMPORTS ---
import { db, auth, storage } from './config/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, User } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { convertToHindi } from './utils/translator';

// Components (Ensure these files exist as .js or .tsx)
import { ToastMessage, ConfirmationModal, EntryRow, NavBtn } from './components/UIComponents';
import ToolsHub from './tools/ToolsHub';

// Pages
import Dashboard from './pages/Dashboard';
import BillsPage from './pages/BillsPage';
import SettingsPage from './pages/SettingsPage';
import AllPagesGrid from './pages/AllPagesGrid';

// --- INTERFACES (Types for TypeScript) ---
interface SettingsType {
  limit: number;
  theme: 'light' | 'dark';
  shopName: string;
  productPassword: string;
  pinnedTools: string[];
}

interface PageItem {
  id: number;
  pageNo: number;
  itemName: string;
}

interface EntryItem {
  id: number;
  pageId: number;
  car: string;
  qty: number;
}

interface BillItem {
  id: number;
  image: string;
  date: string;
  path?: string;
}

interface AppData {
  pages: PageItem[];
  entries: EntryItem[];
  bills: BillItem[];
  settings: SettingsType;
}

export default function App() {
  // --- STATE ---
  const defaultData: AppData = { 
    pages: [], 
    entries: [], 
    bills: [], 
    settings: { limit: 5, theme: 'light', shopName: 'My Shop', productPassword: '0000', pinnedTools: [] } 
  };

  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<AppData>(defaultData);
  const [view, setView] = useState<string>('generalIndex');
  const [activePageId, setActivePageId] = useState<number | null>(null);
  const [indexSearchTerm, setIndexSearchTerm] = useState<string>('');
  
  // Stock Save Logic
  const [tempChanges, setTempChanges] = useState<Record<number, number>>({});
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [savePassInput, setSavePassInput] = useState<string>('');
  
  // UI Helpers
  const [isHindi, setIsHindi] = useState<boolean>(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [editingEntry, setEditingEntry] = useState<EntryItem | null>(null); 

  // Auth State
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  const isDark = data.settings.theme === 'dark';
  const t = useCallback((text: string) => isHindi ? convertToHindi(text) : text, [isHindi]);

  // --- FIREBASE CONNECTION ---
  useEffect(() => {
     const unsub = onAuthStateChanged(auth, (u) => {
         setUser(u);
         if(u) {
             const unsubDb = onSnapshot(doc(db, "appData", u.uid), (docSnap) => {
                 if (docSnap.exists()) {
                     // @ts-ignore - Merging data safely
                     setData({ ...defaultData, ...docSnap.data() });
                 } else {
                     setDoc(doc(db, "appData", u.uid), defaultData);
                 }
             });
             return () => unsubDb();
         }
     });
     return () => unsub();
  }, []);

  // --- FUNCTIONS ---

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => setToast({ message: msg, type });
  
  const pushToFirebase = async (newData: AppData) => {
      if(!user) return;
      try { await setDoc(doc(db, "appData", user.uid), newData); return true; } 
      catch (e: any) { showToast("Save Failed: " + e.message, "error"); return false; }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!email || !password) return showToast("Enter details", "error");
    try {
      if(isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch(err: any) { showToast(err.message, 'error'); }
  };

  const handleBillUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(!file || !user) return;
    showToast("Uploading...");
    try {
        const storageRef = ref(storage, `bills/${user.uid}/${Date.now()}.jpg`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        const newBill: BillItem = { id: Date.now(), image: url, date: new Date().toISOString() };
        pushToFirebase({ ...data, bills: [newBill, ...(data.bills || [])] });
        showToast("Bill Saved!");
    } catch(err) { showToast("Upload Failed", "error"); }
  };

  const handleDeleteBill = async (bill: BillItem) => {
      const newData = { ...data, bills: data.bills.filter(b => b.id !== bill.id) };
      pushToFirebase(newData);
      showToast("Bill Deleted");
  };

  const updateQtyBuffer = useCallback((id: number, amount: number, currentQty: number) => {
      setTempChanges(prev => ({ 
          ...prev, 
          [id]: Math.max(0, (prev[id] !== undefined ? prev[id] : currentQty) + amount) 
      }));
  }, []);

  const executeSave = async () => {
      if (savePassInput !== data.settings.productPassword && savePassInput !== '0000') {
          return showToast("Wrong Password", "error");
      }
      const updatedEntries = data.entries.map(e => 
          tempChanges[e.id] !== undefined ? { ...e, qty: tempChanges[e.id] } : e
      );
      if(await pushToFirebase({ ...data, entries: updatedEntries })) {
          setTempChanges({}); 
          setIsSaveModalOpen(false); 
          setSavePassInput('');
          showToast("Stock Updated!");
      }
  };

  // --- LOGIN SCREEN ---
  if (!user) return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white">
        <form onSubmit={handleAuth} className="bg-slate-800 p-8 rounded-xl w-full max-w-sm space-y-4 shadow-2xl">
            <h1 className="text-2xl font-bold text-center text-blue-400">Dukan Register</h1>
            <input type="email" placeholder="Email" className="w-full p-3 rounded bg-slate-900 border border-slate-700 outline-none focus:border-blue-500" value={email} onChange={e=>setEmail(e.target.value)} />
            <input type="password" placeholder="Password" className="w-full p-3 rounded bg-slate-900 border border-slate-700 outline-none focus:border-blue-500" value={password} onChange={e=>setPassword(e.target.value)} />
            <button className="w-full bg-blue-600 py-3 rounded font-bold hover:bg-blue-500 transition">{isRegistering ? "Create Account" : "Login"}</button>
            <p onClick={()=>setIsRegistering(!isRegistering)} className="text-center text-slate-400 text-sm cursor-pointer hover:text-white">
                {isRegistering ? "Already have an account? Login" : "New here? Create Account"}
            </p>
        </form>
        {toast && <ToastMessage message={toast.message} type={toast.type} onClose={()=>setToast(null)}/>}
      </div>
  );

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-white text-black'}`}>
        {toast && <ToastMessage message={toast.message} type={toast.type} onClose={()=>setToast(null)}/>}
        
        {/* === VIEW ROUTING === */}
        
        {view === 'generalIndex' && (
            <Dashboard 
                data={data} isDark={isDark} isOnline={navigator.onLine} t={t} 
                setIndexSearchTerm={setIndexSearchTerm} indexSearchTerm={indexSearchTerm} 
                setView={setView} setActivePageId={setActivePageId} 
            />
        )}

        {view === 'pagesGrid' && (
            <AllPagesGrid data={data} isDark={isDark} t={t} setView={setView} setActivePageId={setActivePageId} />
        )}

        {view === 'bills' && (
            <BillsPage data={data} isDark={isDark} t={t} handleBillUpload={handleBillUpload} handleDeleteBill={handleDeleteBill} />
        )}

        {view === 'settings' && (
            <SettingsPage data={data} isDark={isDark} t={t} pushToFirebase={pushToFirebase} showToast={showToast} />
        )}

        {view === 'tools' && (
            <ToolsHub onBack={()=>setView('settings')} t={t} isDark={isDark} shopDetails={data.settings} pinnedTools={data.settings.pinnedTools} onTogglePin={()=>{/* Pin logic */}} />
        )}
        
        {/* SINGLE PAGE VIEW */}
        {view === 'page' && activePageId && (
           <div className="pb-24">
               <div className={`p-4 border-b flex gap-2 items-center sticky top-0 z-10 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white'}`}>
                   <button onClick={()=>setView('generalIndex')} className="p-2 rounded hover:bg-gray-200/20"><ArrowLeft/></button> 
                   <div className="flex-1">
                       <h2 className="font-bold text-lg uppercase">{data.pages.find(p=>p.id===activePageId)?.itemName}</h2>
                       <p className="text-xs opacity-60">Page View</p>
                   </div>
                   <button onClick={()=>setIsHindi(!isHindi)} className="text-xs border p-1 rounded font-bold">{isHindi ? 'ENG' : 'HIN'}</button>
               </div>
               
               <div className="flex flex-col">
                   {data.entries.filter(e => e.pageId === activePageId).map((entry, idx) => (
                       <EntryRow 
                           key={entry.id} 
                           index={idx} 
                           entry={entry} 
                           t={t} 
                           isDark={isDark} 
                           onUpdateBuffer={updateQtyBuffer} 
                           tempQty={tempChanges[entry.id]} 
                           limit={data.settings.limit}
                           onEdit={setEditingEntry} 
                       />
                   ))}
               </div>
               
               <button className="fixed bottom-24 right-6 bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-20" onClick={()=>showToast("Add Item Logic Here")}>
                   <Plus size={28}/>
               </button>
           </div>
        )}

        {/* === SAVE BUTTON === */}
        {Object.keys(tempChanges).length > 0 && (
           <button onClick={()=>setIsSaveModalOpen(true)} className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-4 rounded-full shadow-2xl z-50 animate-bounce flex items-center gap-2 border-2 border-white">
               <SaveAll size={20}/> <span>Save ({Object.keys(tempChanges).length})</span>
           </button>
        )}

        {/* === SECURITY MODAL === */}
        {isSaveModalOpen && (
           <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4">
               <div className={`w-full max-w-sm rounded-xl p-6 ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-black'}`}>
                   <h3 className="font-bold mb-4 text-lg">Security Check</h3>
                   <p className="mb-4 text-sm opacity-70">Enter Password to save changes:</p>
                   <input 
                       autoFocus type="password" placeholder="****" 
                       className={`w-full p-3 rounded border mb-4 text-center font-bold text-lg tracking-widest ${isDark ? 'bg-slate-900 border-slate-700' : 'border-gray-300'}`} 
                       value={savePassInput} onChange={e=>setSavePassInput(e.target.value)} 
                   />
                   <div className="flex gap-2">
                       <button onClick={()=>{setIsSaveModalOpen(false); setSavePassInput('')}} className="flex-1 bg-gray-500/20 p-3 rounded font-bold">Cancel</button>
                       <button onClick={executeSave} className="flex-1 bg-green-600 text-white p-3 rounded font-bold">Confirm</button>
                   </div>
               </div>
           </div>
        )}

        {/* === BOTTOM MENU === */}
        <div className={`fixed bottom-0 w-full border-t flex justify-between p-2 pb-safe z-50 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
           <NavBtn icon={Book} label="Index" active={view==='generalIndex'} onClick={()=>{setView('generalIndex'); setActivePageId(null)}} isDark={isDark}/>
           <NavBtn icon={Grid} label="Pages" active={view==='pagesGrid'} onClick={()=>{setView('pagesGrid'); setActivePageId(null)}} isDark={isDark}/>
           <NavBtn icon={Camera} label="Bills" active={view==='bills'} onClick={()=>setView('bills')} isDark={isDark}/>
           <NavBtn icon={Settings} label="Settings" active={view==='settings'} onClick={()=>setView('settings')} isDark={isDark}/>
        </div>
    </div>
  );
}