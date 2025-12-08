import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Minus, Search, X, Trash2, ArrowLeft, Book, Grid, 
  Mic, Settings, AlertTriangle, Languages, Lock, Bell, 
  Download, ShieldCheck, ShieldAlert, CheckCircle, Smartphone, 
  Edit, SaveAll, FileText, LogOut, Wifi, WifiOff 
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";

// ---------------------------------------------------------
// ✅ AAPKI ORIGINAL FIREBASE CONFIGURATION
// ---------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyDDer9o6DqRuFVSQwRcq0BqvDkc72oKSRk",
  authDomain: "arvindregister-353e5.firebaseapp.com",
  projectId: "arvindregister-353e5",
  storageBucket: "arvindregister-353e5.firebasestorage.app",
  messagingSenderId: "557116649734",
  appId: "1:557116649734:web:822bbad24cca3274012e87",
  measurementId: "G-79C2SNJC56"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const DOC_ID = "main_inventory"; // Database Document Name

// --- DICTIONARY ---
const dictionary = {
  "brake": "ब्रेक", "pads": "पैड्स", "shoe": "शू", "oil": "तेल", "filter": "फिल्टर",
  "light": "लाइट", "headlight": "हेडलाइट", "bumper": "बम्पर", "cover": "कवर",
  "seat": "सीट", "mat": "मैट", "guard": "गार्ड", "horn": "हॉर्न", "mirror": "शीशा",
  "glass": "कांच", "clutch": "क्लच", "wire": "तार", "battery": "बैटरी", "tyre": "टायर",
  "tube": "ट्यूब", "alloy": "अलॉय", "wheel": "व्हील", "cap": "कैप", "door": "दरवाजा",
  "handle": "हैंडल", "lock": "लॉक", "key": "चाबी", "sensor": "सेंसर", "screen": "स्क्रीन",
  "swift": "स्विफ्ट", "thar": "थार", "creta": "क्रेटा", "alto": "आल्टो",
  "page": "पेज", "qty": "मात्रा", "car": "गाड़ी", "search": "खोजें", 
  "index": "विषय सूची", "settings": "सेटिंग्स", "pages": "पेज लिस्ट", 
  "total": "कुल", "delete": "हटाएं", "confirm": "पुष्टि करें", "update": "अपडेट",
  "save changes": "बदलाव सेव करें", "pending": "पेंडिंग", "online": "ऑनलाइन", "offline": "ऑफलाइन"
};

const translateText = (text) => {
  if (!text) return "";
  return text.split(' ').map(word => {
    const lower = word.toLowerCase();
    return dictionary[lower] ? dictionary[lower] : word;
  }).join(' ');
};

// --- VOICE INPUT ---
const VoiceInput = ({ onResult, isDark }) => {
  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN'; 
      recognition.onresult = (e) => onResult(e.results[0][0].transcript);
      try { recognition.start(); } catch (e) { console.error(e); }
    } else { alert("Mic Error"); }
  };
  return (
    <button onClick={startListening} className={`p-3 rounded-full shrink-0 ${isDark ? 'bg-slate-700 text-white' : 'bg-gray-100 text-black hover:bg-gray-200'}`}>
      <Mic size={20}/>
    </button>
  );
};

export default function ArvindRegister() {
  // Default Data Structure
  const defaultData = { 
    pages: [], 
    entries: [], 
    settings: { limit: 5, theme: 'light', password: '123', productPassword: '0000' } 
  };

  const [data, setData] = useState(defaultData);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // UI States
  const [view, setView] = useState('generalIndex'); 
  const [activePage, setActivePage] = useState(null);
  const [pageSearchTerm, setPageSearchTerm] = useState(''); 
  const [indexSearchTerm, setIndexSearchTerm] = useState(''); 
  const [stockSearchTerm, setStockSearchTerm] = useState(''); 
  const [isHindi, setIsHindi] = useState(false);
  const [isSafeMode, setIsSafeMode] = useState(true); 
  const [tempChanges, setTempChanges] = useState({}); 

  // Security States
  const [settingsUnlocked, setSettingsUnlocked] = useState(false);
  const [settingsPassInput, setSettingsPassInput] = useState('');
  const [isAppUnlocked, setIsAppUnlocked] = useState(() => {
     if (typeof window !== 'undefined') return localStorage.getItem('arvind-app-unlocked') === 'true';
     return false;
  });
  
  // Inputs
  const [loginPassInput, setLoginPassInput] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newProductPass, setNewProductPass] = useState(''); 
  const [isNewPageOpen, setIsNewPageOpen] = useState(false);
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null); 
  const [input, setInput] = useState({ itemName: '', carName: '', qty: '' });
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [notifPermission, setNotifPermission] = useState('default');
  const audioRef = useRef(null);

  // --- FIREBASE REAL-TIME SYNC ---
  useEffect(() => {
    // Connection Status
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));

    // Database Listener
    const unsub = onSnapshot(doc(db, "appData", DOC_ID), (docSnapshot) => {
        if (docSnapshot.exists()) {
            const cloudData = docSnapshot.data();
            // Ensure data integrity
            if(!cloudData.settings.productPassword) cloudData.settings.productPassword = '0000';
            setData(cloudData);
        } else {
            // First time run: Create document
            setDoc(doc(db, "appData", DOC_ID), defaultData);
        }
        setLoading(false);
    }, (error) => {
        console.error("Firebase Error:", error);
        // Silent fail or alert based on preference, removed alert to be less annoying
    });

    return () => unsub();
  }, []);

  // --- SAVE TO FIREBASE FUNCTION ---
  const pushToFirebase = async (newData) => {
      try {
          await setDoc(doc(db, "appData", DOC_ID), newData);
          return true;
      } catch (e) {
          alert("Save Failed! Check Internet or Firebase Rules. Error: " + e.message);
          return false;
      }
  };

  // --- OTHER EFFECTS ---
  useEffect(() => {
    if (view !== 'settings') { setSettingsUnlocked(false); setSettingsPassInput(''); }
  }, [view]);

  useEffect(() => {
    const handlePopState = () => { if (view !== 'generalIndex') { setView('generalIndex'); setActivePage(null); }};
    window.history.pushState({ view }, '', '');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [view]);

  useEffect(() => {
    const metaTags = [{ name: "theme-color", content: data.settings.theme === 'dark' ? '#0f172a' : '#ffffff' }];
    metaTags.forEach(tag => {
        let meta = document.querySelector(`meta[name="${tag.name}"]`);
        if (!meta) { meta = document.createElement('meta'); meta.name = tag.name; document.head.appendChild(meta); }
        meta.content = tag.content;
    });
  }, [data.settings.theme]);

  useEffect(() => {
    if ("Notification" in window) setNotifPermission(Notification.permission);
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); setDeferredPrompt(e); });
  }, []);

  // --- HANDLERS ---
  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => { if (choiceResult.outcome === 'accepted') setDeferredPrompt(null); });
    } else { alert("Browser Menu -> Install App"); }
  };

  const requestNotificationPermission = () => {
    if (!("Notification" in window)) return;
    Notification.requestPermission().then((permission) => {
      setNotifPermission(permission);
      if (permission === "granted") playAlertSound();
    });
  };

  const playAlertSound = () => {
    if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().catch(e => console.log(e)); }
  };

  const triggerLowStockNotification = (itemCount) => {
      if (notifPermission === 'granted' && itemCount > 0) {
          playAlertSound();
          if("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
          new Notification("Low Stock Warning!", { body: `${itemCount} items are below stock limit!`, icon: "/icon.png" });
      }
  };

  const isDark = data.settings.theme === 'dark';
  const t = (txt) => isHindi ? translateText(txt) : txt;

  const handleAppUnlock = () => {
    if (loginPassInput === data.settings.password) { setIsAppUnlocked(true); localStorage.setItem('arvind-app-unlocked', 'true'); setLoginPassInput(''); } 
    else { alert("Wrong App Password!"); setLoginPassInput(''); }
  };

  const handleAppLock = () => { if(window.confirm("Lock App?")) { setIsAppUnlocked(false); localStorage.removeItem('arvind-app-unlocked'); } };

  const handleSettingsUnlock = () => {
      const currentPass = data.settings.productPassword || '0000';
      if(settingsPassInput === currentPass || settingsPassInput === '0000' || settingsPassInput === '123456') {
          setSettingsUnlocked(true);
          if(settingsPassInput !== currentPass) pushToFirebase({ ...data, settings: { ...data.settings, productPassword: '0000' } });
      } else { alert("Wrong Product Password!"); }
  };

  // --- CRUD OPERATIONS (Now Pushing to Firebase) ---
  const handleDeletePage = async (e, pageId) => {
    e.stopPropagation(); 
    if (window.confirm(t("Delete this page?"))) {
        const newData = { 
            ...data, 
            pages: data.pages.filter(p => p.id !== pageId),
            entries: data.entries.filter(ent => ent.pageId !== pageId)
        };
        await pushToFirebase(newData);
    }
  };

  const handleDeleteEntry = async () => {
      if(window.confirm(t("Delete this item permanently?"))) {
          const newData = { ...data, entries: data.entries.filter(e => e.id !== editingEntry.id) };
          await pushToFirebase(newData);
          setEditingEntry(null);
      }
  };

  const handleEditEntrySave = async () => {
      if (!editingEntry || !editingEntry.car) return;
      const newData = { 
          ...data, 
          entries: data.entries.map(e => e.id === editingEntry.id ? { ...e, car: editingEntry.car, qty: parseInt(editingEntry.qty) || 0 } : e)
      };
      await pushToFirebase(newData);
      setEditingEntry(null); 
  };

  const handleAddPage = async () => {
    if (!input.itemName) return;
    const newPage = { id: Date.now(), pageNo: data.pages.length + 1, itemName: input.itemName };
    await pushToFirebase({ ...data, pages: [...data.pages, newPage] });
    setInput({ ...input, itemName: '' });
    setIsNewPageOpen(false);
  };

  const handleAddEntry = async () => {
    if (!input.carName) return;
    const newEntry = { id: Date.now(), pageId: activePage.id, car: input.carName, qty: parseInt(input.qty) || 0 };
    await pushToFirebase({ ...data, entries: [newEntry, ...data.entries] });
    setInput({ ...input, carName: '', qty: '' });
    setIsNewEntryOpen(false);
  };

  // --- BUFFER UPDATE LOGIC ---
  const updateQtyBuffer = (id, amount, currentRealQty) => {
    const currentBufferVal = tempChanges[id] !== undefined ? tempChanges[id] : currentRealQty;
    const newQty = Math.max(0, currentBufferVal + amount);
    setTempChanges({ ...tempChanges, [id]: newQty });
  };

  const saveAllChanges = async () => {
      const pass = prompt(t("Enter Product Password to Update:"));
      if (pass !== data.settings.productPassword && pass !== '0000' && pass !== '123456') {
          alert("Wrong Product Password!");
          return;
      }
      let lowStockTriggered = 0;
      const updatedEntries = data.entries.map(e => {
          if (tempChanges[e.id] !== undefined) {
              const finalQty = tempChanges[e.id];
              if (finalQty < data.settings.limit) lowStockTriggered++;
              return { ...e, qty: finalQty };
          }
          return e;
      });

      const success = await pushToFirebase({ ...data, entries: updatedEntries });
      if(success) {
          setTempChanges({}); 
          if (lowStockTriggered > 0) triggerLowStockNotification(lowStockTriggered);
          else alert("Database Synced Successfully!");
      }
  };

  // --- RENDER HELPERS ---
  const globalSearchResults = useMemo(() => {
    if (!indexSearchTerm) return { pages: data.pages, items: [] };
    const safeTerm = indexSearchTerm.toLowerCase();
    const filteredPages = data.pages.filter(p => p.itemName.toLowerCase().includes(safeTerm));
    const filteredItems = data.entries.filter(e => e.car.toLowerCase().includes(safeTerm));
    const itemsGrouped = filteredItems.reduce((acc, item) => {
        const p = data.pages.find(page => page.id === item.pageId);
        if (p) { if (!acc[p.itemName]) acc[p.itemName] = []; acc[p.itemName].push(item); }
        return acc;
    }, {});
    return { pages: filteredPages, items: itemsGrouped };
  }, [data.pages, data.entries, indexSearchTerm]);

  const TranslateBtn = () => (
    <button onClick={() => setIsHindi(!isHindi)} className={`p-2 rounded-full border ${isDark ? 'bg-slate-700 border-slate-500' : 'bg-white/50 border-black/10'}`}> <Languages size={20}/> </button>
  );

  const renderSaveButton = () => {
      const count = Object.keys(tempChanges).length;
      if (count === 0) return null;
      return (
          <button onClick={saveAllChanges} className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-4 rounded-full shadow-2xl border-2 border-white flex items-center gap-3 z-50 animate-bounce">
            <SaveAll size={24} /> <span className="font-bold text-lg">{t("Update")} ({count})</span>
          </button>
      );
  };

  // --- MAIN RENDER ---
  if (!isAppUnlocked) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-6 text-white">
            <div className="w-full max-w-sm text-center">
                <div className="bg-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-900/50"><Lock size={40} /></div>
                <h1 className="text-3xl font-bold mb-2">Arvind Register</h1>
                <input type="password" placeholder="App Password" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-center text-2xl tracking-widest outline-none focus:border-blue-500 mb-4" value={loginPassInput} onChange={(e) => setLoginPassInput(e.target.value)}/>
                <button onClick={handleAppUnlock} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl text-lg active:scale-95">UNLOCK APP</button>
                <p className="mt-6 text-xs text-slate-600">Default: 123</p>
            </div>
        </div>
    );
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-bold text-xl animate-pulse">Connecting to Database...</div>;

  const renderGeneralIndex = () => (
    <div className="pb-24">
      <div className={`p-6 border-b-4 border-double sticky top-0 z-10 ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-yellow-100 border-yellow-400'}`}>
        <div className="flex justify-between items-center mb-2">
          <h1 className={`text-2xl font-extrabold uppercase tracking-widest ${isDark ? 'text-white' : 'text-yellow-900'} underline decoration-2 decoration-red-400`}>{t("Arvind Index")}</h1>
          <div className="flex gap-2">
              {isOnline ? <Wifi className="text-green-600"/> : <WifiOff className="text-red-500 animate-pulse"/>}
              <TranslateBtn />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
            <div className="relative flex-1">
                <input className={`w-full pl-9 p-2 rounded border outline-none ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-yellow-500 text-black'}`} placeholder={t("Search Index...")} value={indexSearchTerm} onChange={e => setIndexSearchTerm(e.target.value)}/>
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                {indexSearchTerm && <button onClick={() => setIndexSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2"><X size={16}/></button>}
            </div>
            <VoiceInput onResult={setIndexSearchTerm} isDark={isDark} />
        </div>
      </div>
      <div className={`m-2 border-2 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-black bg-white'}`}>
        <div className={`flex border-b-2 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-black bg-gray-100'} p-2`}>
          <div className="w-12 font-bold text-center border-r border-gray-400">No.</div>
          <div className="flex-1 font-bold pl-3 border-r border-gray-400">{t("Particulars")}</div>
          <div className="w-16 font-bold text-center border-r border-gray-400">{t("Page")}</div>
          <div className="w-10 font-bold text-center">Del</div>
        </div>
        <div className="min-h-[20vh]">
          {globalSearchResults.pages.map((page, idx) => (
            <div key={page.id} onClick={() => { setActivePage(page); setView('page'); setPageSearchTerm(''); }} className={`flex border-b border-gray-300 cursor-pointer hover:bg-blue-50 transition-colors h-14 items-center ${isDark ? 'text-white hover:bg-slate-800' : 'text-black'}`}>
              <div className="w-12 text-center font-bold text-red-600 border-r border-gray-300 h-full flex items-center justify-center text-sm">{idx + 1}</div>
              <div className="flex-1 pl-3 font-semibold text-lg border-r border-gray-300 h-full flex items-center truncate">{t(page.itemName)}</div>
              <div className="w-16 text-center font-bold text-blue-700 h-full flex items-center justify-center underline border-r border-gray-300">{page.pageNo}</div>
              <div className="w-10 flex items-center justify-center h-full">
                <button onClick={(e) => handleDeletePage(e, page.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-full"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
          {globalSearchResults.pages.length === 0 && <div className="p-2 text-center text-gray-400 text-sm">No Pages Found</div>}
        </div>
      </div>
      <button onClick={() => setIsNewPageOpen(true)} className="fixed bottom-24 right-6 bg-yellow-500 text-black w-16 h-16 rounded-full shadow-xl border-4 border-white flex items-center justify-center active:scale-95 z-20"><Plus size={32} strokeWidth={3}/></button>
    </div>
  );

  const renderPagesGrid = () => (
    <div className={`pb-24 min-h-screen p-4 ${isDark ? 'bg-slate-950' : 'bg-gray-100'}`}>
        <div className="mb-4 sticky top-0 z-10 pt-2 pb-2 backdrop-blur-sm flex justify-between items-center">
            <h1 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}><Grid/> {t("All Pages")}</h1>
            <TranslateBtn />
        </div>
        <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
                <input className={`w-full pl-9 p-3 rounded-xl border outline-none shadow-sm ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300 text-black'}`} placeholder={t("Find Page...")} value={indexSearchTerm} onChange={e => setIndexSearchTerm(e.target.value)}/>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
            </div>
            <VoiceInput onResult={setIndexSearchTerm} isDark={isDark} />
        </div>
        <div className="grid grid-cols-2 gap-3">
            {globalSearchResults.pages.map(page => {
                 const totalItems = data.entries.filter(e => e.pageId === page.id).reduce((a,b)=>a+b.qty,0);
                 return (
                    <div key={page.id} onClick={() => { setActivePage(page); setView('page'); setPageSearchTerm(''); }} className={`relative p-4 rounded-xl border-2 shadow-sm cursor-pointer active:scale-95 transition-all flex flex-col justify-between h-36 ${isDark ? 'bg-slate-800 border-slate-600 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-500'}`}>
                        <div>
                            <div className="flex justify-between items-start"><span className="text-xs font-bold px-2 py-1 rounded bg-gray-200 text-gray-800">Pg {page.pageNo}</span><button onClick={(e) => handleDeletePage(e, page.id)} className="p-1 text-red-300 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button></div>
                            <h3 className={`font-bold text-lg mt-2 leading-tight ${isDark ? 'text-white' : 'text-gray-800'}`}>{t(page.itemName)}</h3>
                        </div>
                        <div className="text-right"><span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{totalItems} Pcs</span></div>
                    </div>
                 )
            })}
        </div>
        <button onClick={() => setIsNewPageOpen(true)} className="fixed bottom-24 right-6 bg-blue-600 text-white w-14 h-14 rounded-full shadow-xl border-2 border-white flex items-center justify-center active:scale-95 z-20"><Plus size={28}/></button>
    </div>
  );

  const renderStockSearch = () => {
      const filteredStock = data.entries.filter(e => stockSearchTerm && e.car.toLowerCase().includes(stockSearchTerm.toLowerCase()));
      return (
        <div className={`pb-24 min-h-screen p-4 ${isDark ? 'bg-slate-950' : 'bg-gray-100'}`}>
            <div className="mb-4 sticky top-0 z-10 pt-2 pb-2 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-4">
                    <h1 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}><Search/> {t("Global Search")}</h1>
                    <div className="flex gap-2">
                        <button onClick={() => setIsSafeMode(!isSafeMode)} className={`p-1 rounded-full border ${isSafeMode ? 'bg-green-100 text-green-700 border-green-500' : 'bg-gray-200 text-gray-400'}`}>{isSafeMode ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}</button>
                        <TranslateBtn />
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input className={`w-full pl-9 p-3 rounded-xl border outline-none shadow-sm ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300 text-black'}`} placeholder={t("Type Car Name (e.g. Swift)...")} value={stockSearchTerm} onChange={e => setStockSearchTerm(e.target.value)}/>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                        {stockSearchTerm && <button onClick={() => setStockSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2"><X size={16}/></button>}
                    </div>
                    <VoiceInput onResult={setStockSearchTerm} isDark={isDark} />
                </div>
            </div>
            <div className="space-y-3">
                {filteredStock.map(entry => {
                    const p = data.pages.find(page => page.id === entry.pageId);
                    const displayQty = tempChanges[entry.id] !== undefined ? tempChanges[entry.id] : entry.qty;
                    const isChanged = tempChanges[entry.id] !== undefined;
                    return (
                        <div key={entry.id} className={`p-4 rounded-xl border-l-4 shadow-sm flex items-center justify-between ${isDark ? 'bg-slate-800 border-l-blue-500 border-slate-700 text-white' : 'bg-white border-l-blue-500 border-gray-200 text-black'}`}>
                            <div className="flex-1">
                                <h3 className="font-bold text-xl">{t(p?.itemName || "Unknown Item")}</h3>
                                <p className={`text-sm mt-1 font-semibold opacity-70`}>{t("For")}: {t(entry.car)}</p>
                                <div onClick={() => { setActivePage(p); setView('page'); setPageSearchTerm(stockSearchTerm); }} className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded mt-2 cursor-pointer hover:underline border ${isDark ? 'bg-slate-700 text-blue-300 border-slate-600' : 'bg-gray-100 text-blue-700 border-gray-300'}`}><Book size={10}/> {t("Go to Page")} <ChevronRight size={10}/></div>
                            </div>
                            <div className="flex items-center gap-3">
                               <button onClick={() => updateQtyBuffer(entry.id, -1, entry.qty)} className="w-8 h-8 rounded-full border bg-gray-100 text-red-600 flex items-center justify-center active:scale-90 transition-transform"><Minus size={16}/></button>
                               <span className={`text-xl font-mono font-bold w-8 text-center ${isChanged ? 'text-blue-500' : ''}`}>{displayQty}</span>
                               <button onClick={() => updateQtyBuffer(entry.id, 1, entry.qty)} className="w-8 h-8 rounded-full border bg-gray-100 text-green-600 flex items-center justify-center active:scale-90 transition-transform"><Plus size={16}/></button>
                            </div>
                        </div>
                    );
                })}
                {stockSearchTerm && filteredStock.length === 0 && <div className="text-center mt-10 opacity-50 font-bold">No Items Found</div>}
            </div>
        </div>
      );
  };

  const renderPage = () => {
    const pageEntries = data.entries.filter(e => e.pageId === activePage.id);
    const filtered = pageEntries.filter(e => e.car.toLowerCase().includes(pageSearchTerm.toLowerCase()));
    const grandTotal = pageEntries.reduce((acc, curr) => { const val = tempChanges[curr.id] !== undefined ? tempChanges[curr.id] : curr.qty; return acc + val; }, 0);
    return (
      <div className={`pb-24 min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-white text-black'}`}>
        <div className={`sticky top-0 z-10 border-b-2 shadow-sm ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-red-200'}`}>
           <div className={`flex items-center p-3 ${isDark ? 'bg-slate-800' : 'bg-red-50'}`}>
              <button onClick={() => setView('generalIndex')} className="mr-2 p-2"><ArrowLeft/></button>
              <div className="flex-1">
                 <div className="flex justify-between items-start">
                    <p className={`text-xs font-bold uppercase ${isDark ? 'text-slate-400' : 'text-red-400'}`}>{t("Page No")}: {activePage.pageNo}</p>
                    <div className="flex gap-2">
                        <button onClick={() => setIsSafeMode(!isSafeMode)} className={`p-1 rounded-full border ${isSafeMode ? 'bg-green-100 text-green-700 border-green-500' : 'bg-gray-200 text-gray-400'}`}>{isSafeMode ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}</button>
                        <TranslateBtn />
                    </div>
                 </div>
                 <h2 className="text-2xl font-black uppercase">{t(activePage.itemName)}</h2>
                 <div className="text-xs font-bold opacity-70 mt-1">{t("Total")} {t("Items")}: {grandTotal}</div>
              </div>
           </div>
           <div className={`p-2 flex gap-2 border-t ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
              <div className="relative flex-1">
                 <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                 <input className={`w-full pl-8 py-2 rounded border outline-none ${isDark ? 'bg-slate-900 border-slate-600' : 'bg-gray-50 border-gray-300'}`} placeholder={t("Search Item...")} value={pageSearchTerm} onChange={e => setPageSearchTerm(e.target.value)}/>
              </div>
              <VoiceInput onResult={setPageSearchTerm} isDark={isDark}/>
           </div>
           <div className={`flex p-2 text-xs font-bold uppercase ${isDark ? 'bg-slate-700' : 'bg-red-100 text-red-900'}`}>
             <div className="flex-[2]">{t("Car Name")}</div>
             <div className="flex-[1] text-center">{t("Qty")}</div>
             <div className="w-8"></div> 
           </div>
        </div>
        <div style={isDark ? {} : { backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '100% 3.5rem' }}>
          {filtered.map(entry => {
             const displayQty = tempChanges[entry.id] !== undefined ? tempChanges[entry.id] : entry.qty;
             const isChanged = tempChanges[entry.id] !== undefined;
             return (
             <div key={entry.id} className={`flex items-center px-4 h-14 border-b ${isDark ? 'border-slate-800' : 'border-transparent'}`}>
                <div className="flex-[2] text-lg font-bold truncate">{t(entry.car)}</div>
                <div className="flex-[1] flex items-center justify-center gap-2">
                   <button onClick={() => updateQtyBuffer(entry.id, -1, entry.qty)} className="w-7 h-7 rounded-full border bg-gray-100 text-red-600 flex items-center justify-center active:scale-90 transition-transform"><Minus size={14}/></button>
                   <span className={`text-xl font-mono font-bold ${isChanged ? 'text-blue-500' : (displayQty < data.settings.limit ? 'text-red-500 animate-pulse' : '')}`}>{displayQty}</span>
                   <button onClick={() => updateQtyBuffer(entry.id, 1, entry.qty)} className="w-7 h-7 rounded-full border bg-gray-100 text-green-600 flex items-center justify-center active:scale-90 transition-transform"><Plus size={14}/></button>
                </div>
                <div className="w-8 flex justify-end"><button onClick={() => setEditingEntry(entry)} className="text-gray-400 hover:text-blue-500"><Edit size={18}/></button></div>
             </div>
             )
          })}
        </div>
        <button onClick={() => setIsNewEntryOpen(true)} className="fixed bottom-24 right-6 bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg border-2 border-white flex items-center justify-center z-20"><Plus size={28}/></button>
      </div>
    );
  };

  const renderAlerts = () => (
     <div className={`p-4 pb-24 min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-gray-50 text-black'}`}>
        <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold text-red-500 flex items-center gap-2"><AlertTriangle/> {t("Low Stock")}</h2><TranslateBtn /></div>
        {data.entries.filter(e => e.qty < data.settings.limit).length === 0 && <div className="text-center mt-10 opacity-50">Stock Full</div>}
        {data.entries.filter(e => e.qty < data.settings.limit).map(e => {
           const p = data.pages.find(page => page.id === e.pageId);
           return (
              <div key={e.id} className="p-4 border-l-4 border-red-500 bg-white text-black shadow mb-2 rounded flex justify-between items-center" onClick={() => {setActivePage(p); setView('page')}}>
                 <div><h3 className="font-bold">{t(e.car)}</h3><p className="text-xs">{t(p?.itemName)}</p></div>
                 <span className="text-2xl font-bold text-red-600">{e.qty}</span>
              </div>
           )
        })}
     </div>
  );

  const renderSettings = () => {
    if (!settingsUnlocked) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${isDark ? 'bg-slate-900 text-white' : 'bg-gray-50 text-black'}`}>
                 <div className="bg-red-100 text-red-600 w-20 h-20 rounded-full flex items-center justify-center mb-4 border-2 border-red-200"><Lock size={40} /></div>
                 <h2 className="text-xl font-bold mb-4">{t("Security Check")}</h2>
                 <p className="mb-4 text-center opacity-70">Enter Product Password to Access Settings</p>
                 <input type="password" placeholder="Product Password" className={`w-full max-w-xs p-3 text-center text-xl rounded border mb-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'}`} value={settingsPassInput} onChange={e => setSettingsPassInput(e.target.value)} />
                 <button onClick={handleSettingsUnlock} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg active:scale-95 transition-all">UNLOCK SETTINGS</button>
                 <div className="mt-8 text-xs opacity-50">Default: 0000 | Master Key: 123456</div>
            </div>
        )
    }

    return (
    <div className={`p-4 pb-24 min-h-screen ${isDark ? 'bg-slate-900 text-white' : 'bg-gray-50 text-black'}`}>
       <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold flex items-center gap-2"><Settings/> {t("Settings")}</h2><TranslateBtn /></div>
       
       <div className={`p-4 rounded-xl border mb-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white`}>
          <div className="flex justify-between items-center">
             <div><h3 className="font-bold text-lg">{t("Install App")}</h3><p className="text-xs opacity-80">{deferredPrompt ? "Tap to Install" : "Add to Home Screen"}</p></div>
             <button onClick={handleInstallClick} className="bg-white text-blue-800 px-4 py-2 rounded-lg font-bold flex items-center gap-2 active:scale-95 transition-transform">{deferredPrompt ? <Download size={18}/> : <Smartphone size={18}/>}{deferredPrompt ? "Install" : "Guide"}</button>
          </div>
       </div>

       <div className={`p-4 rounded-xl border mb-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'}`}>
          <div className="flex justify-between items-center">
             <div><h3 className="font-bold">{t("Notifications")}</h3><p className="text-xs opacity-70">{notifPermission === 'granted' ? "Alerts are Active" : "Allow sound & popups"}</p></div>
             {notifPermission === 'granted' ? <button className="bg-green-100 text-green-700 border border-green-500 px-4 py-2 rounded font-bold flex items-center gap-2 cursor-default"><CheckCircle size={18}/> Active</button> : <button onClick={requestNotificationPermission} className="bg-green-600 text-white px-4 py-2 rounded font-bold flex items-center gap-2 active:scale-95 transition-transform"><Bell size={18}/> Enable</button>}
          </div>
       </div>

       <div className={`p-4 rounded-xl border mb-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'}`}>
          <label className="font-bold block mb-2">{t("Low Stock Limit Alert")}</label>
          <div className="flex items-center gap-4"><input type="range" min="1" max="20" value={data.settings.limit} onChange={(e) => { if(window.confirm("Change limit?")) setData({...data, settings: {...data.settings, limit: parseInt(e.target.value)}})}} className="flex-1"/><span className="text-2xl font-bold">{data.settings.limit}</span></div>
       </div>
       
       <div className={`p-4 rounded-xl border mb-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'}`}>
          <label className="font-bold block mb-2">{t("Theme")}</label>
          <div className="flex gap-2"><button onClick={() => { if(window.confirm("Change Theme?")) setData({...data, settings: {...data.settings, theme: 'light'}})}} className="flex-1 py-2 border rounded font-bold">Light</button><button onClick={() => { if(window.confirm("Change Theme?")) setData({...data, settings: {...data.settings, theme: 'dark'}})}} className="flex-1 py-2 border bg-slate-700 text-white rounded font-bold">Dark</button></div>
       </div>

       <div className={`p-4 rounded-xl border mb-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'}`}>
           <label className="font-bold block mb-2 text-gray-500 uppercase text-xs">Data Safety</label>
           <button onClick={() => {
               const dataStr = JSON.stringify(data);
               const blob = new Blob([dataStr], {type: "application/json"});
               const url = URL.createObjectURL(blob);
               const link = document.createElement('a');
               link.href = url;
               link.download = `arvind_backup_${new Date().toISOString().slice(0,10)}.json`;
               document.body.appendChild(link);
               link.click();
               document.body.removeChild(link);
           }} className="w-full py-2 bg-gray-200 text-black font-bold rounded flex items-center justify-center gap-2"><FileText size={18}/> Download Backup Copy</button>
       </div>

       <div className={`p-4 rounded-xl border mb-4 border-red-300 ${isDark ? 'bg-slate-800' : 'bg-red-50'}`}>
          <label className="font-bold block mb-2 text-red-600">{t("Change App Password (Login)")}</label>
          <input type="text" placeholder="New App Password" className="w-full p-2 border rounded mb-2 text-black" value={newPass} onChange={e => setNewPass(e.target.value)}/>
          <button onClick={() => { if(window.confirm("Change Login Password?")) { setData({...data, settings: {...data.settings, password: newPass}}); setNewPass(''); alert("Login Password Updated!"); }}} className="w-full py-2 bg-red-600 text-white font-bold rounded">Update Login Pass</button>
       </div>

       <div className={`p-4 rounded-xl border mb-4 border-blue-300 ${isDark ? 'bg-slate-800' : 'bg-blue-50'}`}>
          <label className="font-bold block mb-2 text-blue-600">{t("Change Product Password (Update)")}</label>
          <input type="text" placeholder="New Product Password" className="w-full p-2 border rounded mb-2 text-black" value={newProductPass} onChange={e => setNewProductPass(e.target.value)}/>
          <button onClick={() => { if(window.confirm("Change Product Password?")) { setData({...data, settings: {...data.settings, productPassword: newProductPass}}); setNewProductPass(''); alert("Product Password Updated!"); }}} className="w-full py-2 bg-blue-600 text-white font-bold rounded">Update Product Pass</button>
       </div>

       <button onClick={handleAppLock} className="w-full py-3 border-2 border-gray-400 rounded-lg font-bold text-gray-500 flex items-center justify-center gap-2"><LogOut size={20}/> Lock App Now</button>
    </div>
    );
  };

  return (
    <div className={`min-h-screen font-sans ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
      <audio ref={audioRef} src="https://actions.google.com/sounds/v1/alarms/beep_short.ogg" preload="auto"></audio>

      {view === 'generalIndex' && renderGeneralIndex()}
      {view === 'pagesGrid' && renderPagesGrid()}
      {view === 'stockSearch' && renderStockSearch()} 
      {view === 'page' && renderPage()}
      {view === 'alerts' && renderAlerts()}
      {view === 'settings' && renderSettings()}
      
      {renderSaveButton()}

      <div className={`fixed bottom-0 w-full border-t flex justify-between px-2 p-2 pb-safe z-50 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-300'}`}>
         <NavBtn icon={Book} label={t("Index")} active={view === 'generalIndex'} onClick={() => setView('generalIndex')} isDark={isDark}/>
         <NavBtn icon={Grid} label={t("Pages")} active={view === 'pagesGrid'} onClick={() => { setView('pagesGrid'); setIndexSearchTerm(''); }} isDark={isDark}/>
         <NavBtn icon={Search} label={t("Search")} active={view === 'stockSearch'} onClick={() => { setView('stockSearch'); setStockSearchTerm(''); }} isDark={isDark}/>
         <NavBtn icon={AlertTriangle} label={t("Alerts")} active={view === 'alerts'} onClick={() => setView('alerts')} alert={data.entries.some(e => e.qty < data.settings.limit)} isDark={isDark}/>
         <NavBtn icon={Settings} label={t("Settings")} active={view === 'settings'} onClick={() => setView('settings')} isDark={isDark}/>
      </div>

      {isNewPageOpen && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 text-black">{t("New Page")}</h3>
            <div className="flex gap-2 mb-4">
                <input autoFocus className="flex-1 border-2 border-black rounded-lg p-3 text-lg font-bold text-black" placeholder="Item Name" value={input.itemName} onChange={e => setInput({...input, itemName: e.target.value})} />
                <VoiceInput onResult={(txt) => setInput(prev => ({...prev, itemName: txt}))} isDark={false} />
            </div>
            <div className="flex gap-3">
               <button onClick={() => setIsNewPageOpen(false)} className="flex-1 py-3 bg-gray-200 rounded font-bold text-black">Cancel</button>
               <button onClick={handleAddPage} className="flex-1 py-3 bg-yellow-500 text-black rounded font-bold">Add</button>
            </div>
          </div>
        </div>
      )}

      {editingEntry && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 text-black">{t("Edit Entry")}</h3>
            <div className="space-y-4">
               <div>
                   <label className="text-xs font-bold text-gray-500">Car Name</label>
                   <input className="w-full border-2 border-black rounded p-2 font-bold text-black" value={editingEntry.car} onChange={e => setEditingEntry({...editingEntry, car: e.target.value})} />
               </div>
               <div>
                   <label className="text-xs font-bold text-gray-500">Quantity</label>
                   <input type="number" className="w-full border-2 border-black rounded p-2 font-bold text-black" value={editingEntry.qty} onChange={e => setEditingEntry({...editingEntry, qty: e.target.value})} />
               </div>
            </div>
            <div className="flex gap-2 mt-6">
               <button onClick={handleDeleteEntry} className="flex-1 py-3 bg-red-100 text-red-600 rounded font-bold flex items-center justify-center gap-2"><Trash2 size={18}/> Delete</button>
               <button onClick={handleEditEntrySave} className="flex-[2] py-3 bg-blue-600 text-white rounded font-bold">Update</button>
            </div>
            <button onClick={() => setEditingEntry(null)} className="w-full mt-2 py-2 text-gray-500 font-bold">Cancel</button>
          </div>
        </div>
      )}

      {isNewEntryOpen && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl p-6">
            <h3 className="text-xl font-bold mb-1 text-black">{t("New Entry")}</h3>
            <p className="text-sm font-bold opacity-50 mb-4 text-black">{activePage?.itemName}</p>
            <div className="space-y-4">
              <div className="flex gap-2">
                 <div className="flex-1">
                     <input autoFocus className="w-full border-2 border-black rounded p-3 text-lg font-bold text-black" placeholder="Car (e.g. Swift & Alto)" value={input.carName} onChange={e => setInput({...input, carName: e.target.value})} />
                     <p className="text-[10px] text-gray-500 mt-1">Tip: Use "Swift & Alto" for shared items.</p>
                 </div>
                 <VoiceInput onResult={(txt) => setInput(prev => ({...prev, carName: txt}))} isDark={false} />
              </div>
              {input.carName && (() => {
                const existing = data.entries.filter(e => e.pageId === activePage.id && e.car.toLowerCase().includes(input.carName.toLowerCase())).reduce((a,b) => a+b.qty, 0);
                return existing > 0 ? <div className="p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-sm font-bold text-center">Already have {existing} in stock!</div> : null;
              })()}
              <input type="number" className="w-full border-2 border-black rounded p-3 text-lg font-bold text-black" placeholder="Qty" value={input.qty} onChange={e => setInput({...input, qty: e.target.value})} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setIsNewEntryOpen(false)} className="flex-1 py-3 bg-gray-200 rounded font-bold text-black">Cancel</button>
              <button onClick={handleAddEntry} className="flex-1 py-3 bg-blue-600 text-white rounded font-bold">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const NavBtn = ({ icon: Icon, label, active, onClick, alert, isDark }) => (
  <button onClick={onClick} className={`relative flex-1 flex flex-col items-center p-2 rounded-xl transition-all ${active ? 'text-blue-600 bg-blue-50 dark:bg-slate-800 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'}`}>
    <Icon size={24} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] font-bold mt-1 text-center leading-none">{label}</span>
    {alert && <span className="absolute top-1 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-bounce"></span>}
  </button>
);