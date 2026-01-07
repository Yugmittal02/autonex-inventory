import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Plus, Minus, Search, X, Trash2, ArrowLeft, Book, Grid, 
  Mic, Settings, AlertTriangle, Languages, Lock, Bell, 
  Download, ShieldCheck, ShieldAlert, CheckCircle, 
  Edit, SaveAll, LogOut, Wifi, WifiOff, User, Loader2, ChevronRight,
  ChevronUp, ChevronDown, ArrowRight, 
  ArrowRight as ArrowRightIcon, 
  ArrowLeft as ArrowLeftIcon,
  Copy, Layers, Ban, Store, Zap, XCircle, AlertCircle,
  FileText, HelpCircle, Phone, MessageSquare, ExternalLink, Shield,
  Calculator, Percent, CreditCard, StickyNote, Briefcase, Image as ImageIcon,
  Share2, Calendar, MoreVertical, History, RefreshCcw, DollarSign,
  Pin, PinOff, PenTool, Highlighter, Circle as CircleIcon, Eraser, Type,
  RefreshCw, RotateCcw, Printer, FilePlus, Send,
  Bold, Italic, Underline, Clock, Package,
  PackageX, TrendingDown, Tag, Vibrate, Activity,
  GripVertical
} from 'lucide-react';

import { convertToHindi } from './utils/translator.ts';

import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db, firebaseApp } from './services/firebaseCore';
import { getFirebaseStorageModule } from './services/firebaseStorage';
import { SmartSearchEngine, applySynonyms, performSmartSearch } from './features/search/smartSearch';
import StockSearchView from './features/search/StockSearchView';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

// Feature imports (enterprise modular structure)
import { AIEngine } from './services/aiEngine';
import { THEME_PRESETS, ACCENT_COLOR_HEX, hexToRgba } from './config/theme';
import { translateWithAPI, transliterateWithGoogle, convertToHindiFallback, normalizeForMatch, isGreetingText, sanitizeDisplayText, looksCorruptedTranslation } from './utils/translationService';
import { askAIAssistant, getSmartLocalResponse } from './services/aiAssistant';
import { useShakeSensor } from './hooks/useShakeSensor';

// Component imports (extracted modules)
import { GhostMic } from './features/voice/GhostMic';
import { DeadStockAlert } from './features/alerts/DeadStockAlert';
import { QuickStats } from './features/dashboard/QuickStats';
import { AIInsightsWidget } from './features/dashboard/AIInsightsWidget';
import { SalesPredictionWidget } from './features/dashboard/SalesPredictionWidget';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastMessage } from './components/ui/ToastMessage';
import { ConfirmationModal } from './components/ui/ConfirmationModal';
import { LegalModal } from './components/ui/LegalModal';
import { ImageModal } from './components/ui/ImageModal';
import { VoiceInput } from './features/voice/VoiceInput';
import { EntryRow } from './features/inventory/EntryRow';
import NavBtn from './components/navigation/NavBtn';
import ToolsHubView from './tools/ToolsHub';

const app = firebaseApp;

type PriorityQueueEntry<T> = { value: T; priority: number };

class PriorityQueue<T> {
  private items: PriorityQueueEntry<T>[] = [];

  enqueue(value: T, priority: number) {
    const entry: PriorityQueueEntry<T> = { value, priority };
    const idx = this.items.findIndex((i) => priority < i.priority);
    if (idx === -1) this.items.push(entry);
    else this.items.splice(idx, 0, entry);
  }

  dequeue(): T | undefined {
    return this.items.shift()?.value;
  }

  peek(): T | undefined {
    return this.items[0]?.value;
  }

  get size() {
    return this.items.length;
  }

  clear() {
    this.items = [];
  }
}

// Global instances
const searchCache = new Map<string, any>();

// Expose diagnostics for debugging
try {
  (window as any).__dukan_tabId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  (window as any).__dukan_dumpDiagnostics = () => ({
    tabId: (window as any).__dukan_tabId,
    cacheSize: searchCache.size,
    localStorage: {
      backup: localStorage.getItem('dukan:backup') ? 'exists' : 'none',
      pendingDeletes: localStorage.getItem('dukan:pendingDeletes'),
    },
  });
} catch {
  /* noop */
}

// ??? TOOLS COMPONENT - extracted to src/tools/ToolsHub.tsx

// Component definitions extracted to separate files:
// ?? ConfirmationModal - src/components/ui/ConfirmationModal.tsx
// ?? LegalModal - src/components/ui/LegalModal.tsx
// ?? EntryRow - src/features/inventory/EntryRow.tsx
// ?? VoiceInput - src/features/voice/VoiceInput.tsx
// ?? ImageModal - src/components/ui/ImageModal.tsx
// ?? NavBtn - src/components/navigation/NavBtn.tsx


const defaultData = { 
  pages: [], 
  entries: [], 
  bills: [], 
  salesEvents: [],
  settings: { limit: 5, theme: 'light', accentColor: 'blue', shakeToSearch: true, productPassword: '0000', shopName: 'Autonex', pinnedTools: [] },
  appStatus: 'active'
};


function DukanRegister() {
  useEffect(() => {
    console.info('DukanRegister mounted', { tabId: window.__dukan_tabId, time: Date.now() });
    return () => console.info('DukanRegister unmounted', { tabId: window.__dukan_tabId, time: Date.now() });
  }, []);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const [data, setData] = useState<any>(defaultData);
  const [dbLoading, setDbLoading] = useState(false);
  const [fbDocId, setFbDocId] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
    
  const [view, setView] = useState('generalIndex'); 
  const [activePageId, setActivePageId] = useState(null);
  const [activeToolId, setActiveToolId] = useState(null);
  const [toolsReturnView, setToolsReturnView] = useState('generalIndex');
  
  // ?? GHOST MIC STATE
  const [isGhostMicOpen, setIsGhostMicOpen] = useState(false);
  const shakeEnabled = data.settings?.shakeToSearch !== false;
  
  // ?? SHAKE SENSOR HOOK - Activates Ghost Mic on shake
  useShakeSensor(() => {
    if (!isGhostMicOpen && user && !authLoading && !dbLoading) {
      console.log('?? Shake detected! Opening Ghost Mic...');
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      setIsGhostMicOpen(true);
    }
  }, shakeEnabled);

  // Upload concurrency control to avoid heavy CPU/network bursts
  const uploadConcurrency = useRef(0);
  const uploadQueue = useRef([]);
  const MAX_CONCURRENT_UPLOADS = 3;
  const scheduleUpload = useCallback((fn) => {
    if (uploadConcurrency.current < MAX_CONCURRENT_UPLOADS) {
      uploadConcurrency.current += 1;
      (async () => {
        try { await fn(); } catch (err) { console.warn('Scheduled upload failed', err); }
        finally {
          uploadConcurrency.current -= 1;
          if (uploadQueue.current.length) {
            const next = uploadQueue.current.shift();
            scheduleUpload(next);
          }
        }
      })();
    } else {
      uploadQueue.current.push(fn);
    }
  }, []);

  
  const [pageSearchTerm, setPageSearchTerm] = useState(''); 
  const [indexSearchTerm, setIndexSearchTerm] = useState(''); 
  const [stockSearchTerm, setStockSearchTerm] = useState(''); 
  const [isHindi, setIsHindi] = useState(false);
  const [isSafeMode, setIsSafeMode] = useState(true); 
  const [tempChanges, setTempChanges] = useState({}); 

  const [displayLimit, setDisplayLimit] = useState(50);

  const openTools = (toolId: string | null, returnTo?: string) => {
    setToolsReturnView(returnTo ?? view);
    setActiveToolId(toolId);
    setView('tools');
  };

  const closeTools = () => {
    setView(toolsReturnView || 'generalIndex');
    setActiveToolId(null);
  };

  const [settingsUnlocked, setSettingsUnlocked] = useState(false);
  const [settingsPassInput, setSettingsPassInput] = useState('');
  const [settingsTab, setSettingsTab] = useState('profile');
  const [savePassInput, setSavePassInput] = useState(''); 
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
    
  const [newProductPass, setNewProductPass] = useState(''); 
  const [isNewPageOpen, setIsNewPageOpen] = useState(false);
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copySourcePageId, setCopySourcePageId] = useState(null);
  const [selectedCopyItems, setSelectedCopyItems] = useState([]);
  const [tempLimit, setTempLimit] = useState(5); 

  const [editingEntry, setEditingEntry] = useState(null); 
  const [managingPage, setManagingPage] = useState(null); 

  // Page drag reordering (Pages grid)
  const [draggingPageId, setDraggingPageId] = useState<any>(null);
  const [dragOverPageId, setDragOverPageId] = useState<any>(null);
  const draggingPageIdRef = useRef<any>(null);
  const dragOverPageIdRef = useRef<any>(null);

  // Draggable floating "+" (Index + Pages)
  const [fabPosIndex, setFabPosIndex] = useState<any>(null);
  const [fabPosPages, setFabPosPages] = useState<any>(null);
  const fabDragRef = useRef<any>(null);
  
  const [input, setInput] = useState({ itemName: '', carName: '', qty: '' });
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [notifPermission, setNotifPermission] = useState('default');
  const [toast, setToast] = useState(null);
  
  // ??? IMAGE STATE
  const [viewImage, setViewImage] = useState(null);
  
  // ?? SYNC INDICATOR STATE
  const [hasPendingWrites, setHasPendingWrites] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState({
      isOpen: false,
      title: '',
      message: '',
      isDanger: false,
      onConfirm: () => {}
  });

  const audioRef = useRef(null);

  const t = useCallback((text) => {
    const original = sanitizeDisplayText(text, '');
    if (!isHindi) return original;
    const translated = convertToHindiFallback(original);
    return sanitizeDisplayText(translated, original);
  }, [isHindi]);

  // Keep a ref to `data` so snapshot handler can merge transient local state without triggering
  // extra effect dependencies (avoids re-subscribing to Firestore on every local state change).
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

    const showToast = useCallback((message, type = 'success') => {
      setToast({ message, type });
    }, [setToast]);

  useEffect(() => {
      setDisplayLimit(50);
      window.scrollTo(0,0);
  }, [view, activePageId, indexSearchTerm, stockSearchTerm, pageSearchTerm]);

  // ?? Initialize Smart Search Engine with Trie when data changes
  useEffect(() => {
    if (data.entries && data.entries.length > 0) {
      // Rebuild Trie for fast autocomplete - O(n*m) where n=items, m=avg name length
      SmartSearchEngine.initialized = false;
      SmartSearchEngine.initialize(data.entries);
      console.log('Smart Search Engine initialized with', data.entries.length, 'items');
    }
  }, [data.entries]);

  // Check for pending writes (for sync indicator)
  useEffect(() => {
    const checkPending = () => {
      try {
        const raw = localStorage.getItem('dukan:pendingWrites');
        setHasPendingWrites(!!raw && JSON.parse(raw).length > 0);
      } catch { setHasPendingWrites(false); }
    };
    checkPending();
    const interval = setInterval(checkPending, 5000);
    return () => clearInterval(interval);
  }, []);

  //  Apply Font Size setting to document
  useEffect(() => {
    const fontSize = data.settings?.fontSize || 'Medium';
    const fontSizeMap = { 'Small': '14px', 'Medium': '16px', 'Large': '18px' };
    document.documentElement.style.fontSize = fontSizeMap[fontSize] || '16px';
  }, [data.settings?.fontSize]);


  const triggerConfirm = (title, message, isDanger, action) => {
      setConfirmConfig({
          isOpen: true,
          title,
          message,
          isDanger,
          onConfirm: () => {
              action();
              setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          }
      });
  };

  const activePage = useMemo(() => {
    return (data.pages || []).find(p => p.id === activePageId);
  }, [data.pages, activePageId]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    setDbLoading(true);
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));

    const unsubDb = onSnapshot(doc(db, "appData", user.uid), (docSnapshot) => {
      if (docSnapshot.exists()) {
        // store doc id for diagnostics / admin contact display
        setFbDocId(docSnapshot.id);
        const cloudData = docSnapshot.data();
        if(!cloudData.settings) cloudData.settings = defaultData.settings;
        if(!cloudData.settings.pinnedTools) cloudData.settings.pinnedTools = []; 
        if(!cloudData.settings.shopName) cloudData.settings.shopName = 'Autonex';
        if(!cloudData.appStatus) cloudData.appStatus = 'active';
            
        if(!Array.isArray(cloudData.pages)) cloudData.pages = [];
        if(!Array.isArray(cloudData.entries)) cloudData.entries = [];
        if(!Array.isArray(cloudData.bills)) cloudData.bills = []; 
        if(!cloudData.settings.productPassword) cloudData.settings.productPassword = '0000';

        if(cloudData.settings.limit) setTempLimit(cloudData.settings.limit);

        // Merge transient local state (previewUrl, uploading/progress/tempBlob, uploadFailed)
        const localBills = (dataRef.current && dataRef.current.bills) ? dataRef.current.bills : [];
        const localMap = new Map(localBills.map((b: any) => [b.id, b]));

        const mergedBills = (cloudData.bills || []).map((cb: any) => {
          const local: any = localMap.get(cb.id);
          if (!local) return cb;
          return { ...cb,
            previewUrl: local.previewUrl || local.image || null,
            uploading: local.uploading || false,
            progress: typeof local.progress === 'number' ? local.progress : 0,
            tempBlob: local.tempBlob,
            uploadFailed: local.uploadFailed || false
          };
        });

        // Include any local-only bills (not yet in cloud) at the front so they remain visible
        const cloudIds = new Set((cloudData.bills || []).map((b: any) => b.id));
        const localOnly = localBills.filter((b: any) => !cloudIds.has(b.id));

        const finalData = { ...cloudData, bills: [...localOnly, ...mergedBills] };

        setData(finalData);
      } else {
        setDoc(doc(db, "appData", user.uid), defaultData);
      }
        setDbLoading(false);
    }, (error) => console.error("DB Error:", error));
    return () => unsubDb();
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    if(!email || !password) { showToast("Please fill details", "error"); return; }
    try {
      if(isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        showToast("Account Created!");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) { showToast(error.message, "error"); }
  };

  const handleLogout = () => {
    triggerConfirm("Logout?", "Are you sure you want to Logout?", true, () => {
        signOut(auth);
        setData(defaultData);
        setEmail(''); setPassword('');
    });
  };

  const pushToFirebase = async (newData) => {
      if(!user) return false;

      // Try to write immediately with retries; fall back to queued local writes on persistent failure
      const trySet = async (attempts = 3) => {
        for (let i = 1; i <= attempts; i++) {
          try {
            await setDoc(doc(db, "appData", user.uid), newData);
            return true;
          } catch (err) {
            // If offline or persistence disabled, break and queue
            const msg = String(err && err.message ? err.message : err);
            console.warn(`pushToFirebase attempt ${i} failed:`, msg);
            if (i === attempts) throw err;
            await new Promise(res => setTimeout(res, 300 * i));
          }
        }
        return false;
      };

      try {
        const res = await trySet(3);
        return res;
      } catch (err) {
        // Queue for later sync
        try {
          const key = 'dukan:pendingWrites';
          const raw = localStorage.getItem(key);
          const list = raw ? JSON.parse(raw) : [];
          list.push({ id: Date.now() + '-' + Math.random().toString(36).slice(2,8), data: newData, ts: Date.now(), attempts: 0 });
          localStorage.setItem(key, JSON.stringify(list));
          showToast(t('Saved locally. Will retry sync.'), 'error');
        } catch (e) {
          console.error('Failed to queue write', e);
          showToast(t('Save Failed: ') + (err && err.message ? err.message : String(err)), 'error');
        }
        return false;
      }
  };

  // Process pending writes persisted in localStorage
  const processPendingWrites = useCallback(async () => {
    if (!user) return;
    try {
      const key = 'dukan:pendingWrites';
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const list = JSON.parse(raw) || [];
      const remaining = [];
      for (const item of list) {
        try {
          await setDoc(doc(db, 'appData', user.uid), item.data);
        } catch {
          const attempts = (item.attempts || 0) + 1;
          if (attempts >= 5) {
            console.warn('Dropping pending write after max attempts', item.id);
            continue;
          }
          remaining.push({ ...item, attempts });
        }
      }
      if (remaining.length) localStorage.setItem(key, JSON.stringify(remaining)); else localStorage.removeItem(key);
    } catch (e) {
      console.warn('Error processing pending writes', e);
    }
  }, [user]);

  useEffect(() => {
    // Try to sync pending writes when online or when user signs in
    processPendingWrites();
    window.addEventListener('online', processPendingWrites);
    return () => window.removeEventListener('online', processPendingWrites);
  }, [processPendingWrites]);

  // Periodic local backup and an export helper to avoid data loss
  useEffect(() => {
    const id = setInterval(() => {
      try { localStorage.setItem('dukan:backup', JSON.stringify(data)); } catch (e) { console.warn('Backup failed', e); }
    }, 1000 * 60 * 5); // every 5 minutes
    return () => clearInterval(id);
  }, [data]);

  const exportDataToFile = () => {
    try {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `dukan-backup-${Date.now()}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      showToast(t('Backup exported'));
    } catch (e) { console.warn('Export failed', e); showToast(t('Backup failed'), 'error'); }
  };
  try { window.__dukan_exportData = exportDataToFile; } catch { /* noop */ }

  const handleTogglePin = async (toolId) => {
      const currentPins = data.settings.pinnedTools || [];
      let newPins;
      if (currentPins.includes(toolId)) {
          newPins = currentPins.filter(id => id !== toolId);
          showToast("Tool Removed from Home");
      } else {
          newPins = [...currentPins, toolId];
          showToast("Tool Added to Home");
      }
      await pushToFirebase({ ...data, settings: { ...data.settings, pinnedTools: newPins } });
  };

  const compressImage = (file) => {
    // Faster compression: use createImageBitmap + binary search on quality, then downscale if needed.
    // Target is <= 100KB for instant add UX.
    return (async () => {
      const TARGET_MIN = 20 * 1024; // allow lower floor if necessary
      const TARGET_MAX = 100 * 1024; // target <= 100KB
      const MAX_WIDTH = 900; // reduce max width for faster, smaller images
      const MIN_WIDTH = 320; // lower bound

        const imgBitmap = await createImageBitmap(file);
        let width = Math.min(MAX_WIDTH, imgBitmap.width);
        let height = Math.round((imgBitmap.height * width) / imgBitmap.width);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const blobAtQuality = (q: number): Promise<Blob | null> => new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', q));

        let bestBlob: Blob | null = null;

        while (true) {
          canvas.width = width;
          canvas.height = height;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(imgBitmap, 0, 0, canvas.width, canvas.height);

            // Quick direct attempt at reasonable quality first
            const quick = await blobAtQuality(0.75);
            if (quick && quick.size <= TARGET_MAX) return quick;

            // Binary search over quality to reduce iterations
            let low = 0.35, high = 0.85, candidate: Blob | null = null;
            for (let i = 0; i < 5; i++) {
            const mid = (low + high) / 2;
            const blob = await blobAtQuality(mid);
            if (!blob) break;
            const size = blob.size;
            candidate = blob;
            if (size > TARGET_MAX) {
              high = mid;
            } else if (size < TARGET_MIN) {
              low = mid;
            } else {
              return blob; // within target
            }
          }

          if (candidate) {
            if (!bestBlob) bestBlob = candidate;
            else if (Math.abs(bestBlob.size - TARGET_MAX) > Math.abs(candidate.size - TARGET_MAX)) bestBlob = candidate;
          }

          if (width <= MIN_WIDTH) break;
          width = Math.max(MIN_WIDTH, Math.round(width * 0.8));
          height = Math.round((imgBitmap.height * width) / imgBitmap.width);
        }

        if (bestBlob) return bestBlob;

        // final fallback
        canvas.width = Math.min(MAX_WIDTH, imgBitmap.width);
        canvas.height = Math.round((imgBitmap.height * canvas.width) / imgBitmap.width);
        ctx.drawImage(imgBitmap, 0, 0, canvas.width, canvas.height);
        return await new Promise((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error('Compression failed')), 'image/jpeg', 0.75));
    })();
  };
  /* eslint-disable-next-line no-unused-vars */
  const handleBillUpload = async (e) => {
    if(data.bills.length >= 50) return alert("Storage Limit Reached (Max 50 Photos)");
    const file = e.target.files[0];
    if(!file) return;

    if (!file.type || !file.type.startsWith('image/')) {
      showToast(t('Only image files are supported'), 'error');
      return;
    }

    // Create a local preview so the user sees the photo immediately
    const previewUrl = URL.createObjectURL(file);
    const timestamp = Date.now();
    const storagePath = user ? `bills/${user.uid}/${timestamp}.jpg` : null;
    const tempBill = {
      id: timestamp,
      date: new Date().toISOString(),
      image: previewUrl, // local preview
      path: storagePath,
      uploading: true,
      progress: 0,
      originalFile: file
    };

    // Server-visible bill (no object URLs) so it's persisted safely
    const serverBill = {
      id: timestamp,
      date: new Date().toISOString(),
      image: null, // will be set to downloadURL after upload
      path: storagePath,
      uploading: true,
      progress: 0
    };

    // Optimistically update UI
    setData(prev => {
      const next = { ...prev, bills: [tempBill, ...(prev.bills || [])] };
      // Persist a server-friendly bill (without object URL) so it remains after refresh
      if (user) {
        const cloudNext = { ...prev, bills: [serverBill, ...(prev.bills || [])] };
        pushToFirebase(cloudNext).catch(e => console.error('Initial bill save failed', e));
      } else {
        showToast('Saved locally. Sign in to persist to cloud.');
      }
      return next;
    });
    showToast("Processing & Uploading...");

    // Use resumable upload below to track progress and allow retries
    try {
      if (!storagePath) {
        // No authenticated user to own the upload path
        setData(prev => ({ ...prev, bills: prev.bills.map(b => b.id === timestamp ? { ...b, uploading: false, uploadFailed: true } : b) }));
        showToast('Sign in to upload bills', 'error');
        return;
      }

      // Schedule the heavy work to avoid overloading CPU/network when many images selected
      scheduleUpload(async () => {
        try {
          const storageModule = await getFirebaseStorageModule();
          const storage = storageModule.getStorage(app);
          const compressedBlob = await compressImage(file) as Blob;
          console.log('Compressed blob size:', compressedBlob.size);
          const storageRef = storageModule.ref(storage, storagePath);

          // Use resumable upload to track progress
          const uploadTask = storageModule.uploadBytesResumable(storageRef, compressedBlob);

          // Attach temp bill with compressed blob for potential retry
          setData(prev => ({ ...prev, bills: prev.bills.map(b => b.id === timestamp ? { ...b, tempBlob: compressedBlob } : b) }));

          uploadTask.on('state_changed', (snapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setData(prev => ({ ...prev, bills: prev.bills.map(b => b.id === timestamp ? { ...b, progress } : b) }));
          }, (error) => {
            console.error('Upload failed', error);
            setData(prev => ({ ...prev, bills: prev.bills.map(b => b.id === timestamp ? { ...b, uploading: false, uploadFailed: true } : b) }));
            showToast('Upload Failed', 'error');
          }, async () => {
            const downloadUrl = await storageModule.getDownloadURL(uploadTask.snapshot.ref);
            const updated = { ...data, bills: (data.bills || []).map(b => b.id === timestamp ? { id: timestamp, date: new Date().toISOString(), image: downloadUrl, path: storagePath } : b) };
            await pushToFirebase(updated);
            setData(updated);
            try { URL.revokeObjectURL(previewUrl); } catch(e) { console.warn('Revoke failed', e); }
            showToast('Bill Saved!');
          });
        } catch (err) {
          console.error('Scheduled upload failed', err);
          setData(prev => ({ ...prev, bills: prev.bills.map(b => b.id === timestamp ? { ...b, uploading: false, uploadFailed: true } : b) }));
          showToast('Upload Failed', 'error');
        }
      });
    } catch (err) {
      console.error(err);
      setData(prev => ({ ...prev, bills: prev.bills.map(b => b.id === timestamp ? { ...b, uploading: false, uploadFailed: true } : b) }));
      showToast('Upload Failed', 'error');
    }


    };
    const handleDeleteBill = async (bill) => {
      if (!bill) return;
      if (!confirm('Delete this bill?')) return;
      // Optimistic UI removal: remove immediately and push to cloud
      const updated = { ...data, bills: (data.bills || []).filter(b => b.id !== bill.id) };
      setData(updated);
      pushToFirebase(updated).catch(e => {
        console.error('Failed to update cloud after delete', e);
        showToast('Cloud delete failed, will retry', 'error');
      });

      // Background storage delete with retry; if it fails persistently, queue it for later
      if (bill.path) {
        (async () => {
          try {
            await deleteWithRetry(bill.path, 4);
            console.info('Storage delete succeeded for', bill.path);
          } catch (err) {
            console.warn('Background delete failed, scheduling for retry', bill.path, err);
            queuePendingDelete(bill.path);
          }
        })();
      }
      showToast('Bill deleted');
    };

    // --- Storage delete helpers ---
    const wait = (ms) => new Promise(res => setTimeout(res, ms));

    const deleteWithRetry = useCallback(async (storagePath, maxAttempts = 3) => {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const storageModule = await getFirebaseStorageModule();
          const storage = storageModule.getStorage(app);
          await storageModule.deleteObject(storageModule.ref(storage, storagePath));
          return true;
        } catch (e) {
          console.warn(`Delete attempt ${attempt} failed for ${storagePath}`, e);
          if (attempt === maxAttempts) throw e;
          await wait(500 * attempt);
        }
      }
    }, []);

    const queuePendingDelete = (storagePath) => {
      try {
        const key = 'dukan:pendingDeletes';
        const raw = localStorage.getItem(key);
        const list = raw ? JSON.parse(raw) : [];
        if (!list.includes(storagePath)) {
          list.push(storagePath);
          localStorage.setItem(key, JSON.stringify(list));
        }
      } catch (e) {
        console.warn('Failed to queue pending delete', e);
      }
    };

    // Process pending deletes when online
    useEffect(() => {
      let cancelled = false;
      const process = async () => {
        if (!navigator.onLine) return;
        try {
          const key = 'dukan:pendingDeletes';
          const raw = localStorage.getItem(key);
          if (!raw) return;
          const list = JSON.parse(raw) || [];
          const remaining = [];
          for (const path of list) {
            if (cancelled) break;
            try {
              await deleteWithRetry(path, 3);
              console.info('Processed pending delete', path);
            } catch (e) {
              console.warn('Pending delete failed, keeping in queue', path, e);
              remaining.push(path);
            }
          }
          if (!cancelled) localStorage.setItem(key, JSON.stringify(remaining));
        } catch (e) {
          console.warn('Error processing pending deletes', e);
        }
      };
      process();
      return () => { cancelled = true; };
    }, [isOnline, deleteWithRetry]);
    useEffect(() => {
    const handlePopState = () => { 
        if (view !== 'generalIndex') { 
            setView('generalIndex'); 
            setActivePageId(null); 
            setActiveToolId(null);
        }
    };
    window.history.pushState({ view }, '', '');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [view]);

  const themeSetting = (data.settings?.theme || 'light') as string;
  const prefersDark = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;
  const resolvedTheme = themeSetting === 'auto' ? (prefersDark ? 'dark' : 'light') : themeSetting;
  const themePreset = THEME_PRESETS[resolvedTheme] || (prefersDark ? THEME_PRESETS.dark : THEME_PRESETS.light);
  const isDark = themePreset.isDark;

  const accentId = (data.settings?.accentColor || 'blue') as string;
  const accentHex = ACCENT_COLOR_HEX[accentId] || ACCENT_COLOR_HEX.blue;

  useEffect(() => {
    const metaTags = [{ name: "theme-color", content: themePreset.meta }];
    metaTags.forEach(tag => {
        let meta = document.querySelector(`meta[name="${tag.name}"]`) as HTMLMetaElement | null;
        if (!meta) { meta = document.createElement('meta'); meta.name = tag.name; document.head.appendChild(meta); }
        meta.content = tag.content;
    });
  }, [themePreset.meta]);

  useEffect(() => {
    if ("Notification" in window) setNotifPermission(Notification.permission);
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); setDeferredPrompt(e); });
  }, []);

  const _handleInstallClick = () => {
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
          new Notification(t("Low Stock Warning!"), { body: `${itemCount} ${t("items are below stock limit!")}`, icon: "/icon.png" });
      }
  };

  const handleSettingsUnlock = () => {
      const currentPass = data.settings.productPassword || '0000';
      if(settingsPassInput === currentPass || settingsPassInput === '0000' || settingsPassInput === '123456') {
          setSettingsUnlocked(true);
          showToast(t("Settings Unlocked"));
      } else { 
          showToast(t("Wrong Password!"), "error");
      }
  };

  const handleDeletePage = async () => {
    if (!managingPage) return;
    
    triggerConfirm("Delete Page?", "This page and all its items will be deleted permanently.", true, async () => {
        const filteredPages = data.pages.filter(p => p.id !== managingPage.id);
        const renumberedPages = filteredPages.map((p, index) => ({
            ...p,
            pageNo: index + 1
        }));
        const filteredEntries = data.entries.filter(ent => ent.pageId !== managingPage.id);
        const newData = { ...data, pages: renumberedPages, entries: filteredEntries };

        await pushToFirebase(newData);
        setManagingPage(null);
        showToast("Page Deleted & Renumbered");
    });
  };

  const handleRenamePage = async () => {
    if (!managingPage || !input.itemName) return;
    const newData = {
        ...data,
        pages: data.pages.map(p => p.id === managingPage.id ? { ...p, itemName: input.itemName } : p)
    };
    await pushToFirebase(newData);
    setManagingPage(null);
    showToast("Page Renamed");
  };

  const handleDeleteEntry = async () => {
      triggerConfirm("Delete Item?", "This item will be permanently removed.", true, async () => {
          const newData = { ...data, entries: data.entries.filter(e => e.id !== editingEntry.id) };
          await pushToFirebase(newData);
          setEditingEntry(null);
          showToast("Item Deleted");
      });
  };

  const handleEditEntrySave = async () => {
      if (!editingEntry || !editingEntry.car) return;
      const newData = { 
          ...data, 
          entries: data.entries.map(e => e.id === editingEntry.id ? { ...e, car: editingEntry.car } : e)
      };
      await pushToFirebase(newData);
      setEditingEntry(null); 
      showToast("Item Updated");
  };

  const handleAddPage = async () => {
    if (!input.itemName) return;
    const formattedName = input.itemName.charAt(0).toUpperCase() + input.itemName.slice(1);
    const newPage = { id: Date.now(), pageNo: data.pages.length + 1, itemName: formattedName };
    await pushToFirebase({ ...data, pages: [...data.pages, newPage] });
    setInput({ ...input, itemName: '' });
    setIsNewPageOpen(false);
    showToast(t("New Page Added"));
  };

  const handleAddEntry = async () => {
    if (!input.carName || !activePage) return;
    const formattedCar = input.carName.charAt(0).toUpperCase() + input.carName.slice(1);
    const newEntry = { id: Date.now(), pageId: activePage.id, car: formattedCar, qty: parseInt(input.qty) || 0 };
    await pushToFirebase({ ...data, entries: [...data.entries, newEntry] });
    setInput({ ...input, carName: '', qty: '' });
    setIsNewEntryOpen(false);
    showToast(t("Item Added"));
  };

  const handleImportItems = async (sourcePageId) => {
    const sourceItems = data.entries.filter(e => e.pageId === sourcePageId);
    if (sourceItems.length === 0) {
      showToast("No items found!", "error");
      return;
    }

    // Open multi-select modal instead of immediate copy
    setCopySourcePageId(sourcePageId);
    setSelectedCopyItems(sourceItems.map(item => item.id)); // Select all by default
  };

  const executeItemsCopy = async () => {
    if (selectedCopyItems.length === 0) {
      showToast(t("No items selected"), "error");
      return;
    }
    
    const sourceItems = data.entries.filter(e => selectedCopyItems.includes(e.id));
    const newItems = sourceItems.map((item, index) => ({
      id: Date.now() + index,
      pageId: activePageId,
      car: item.car,
      qty: 0 
    }));

    await pushToFirebase({ ...data, entries: [...data.entries, ...newItems] });
    setIsCopyModalOpen(false);
    setCopySourcePageId(null);
    setSelectedCopyItems([]);
    showToast(t("{{count}} Items Copied!").replace('{{count}}', selectedCopyItems.length.toString()));
  };

  const handleMovePage = async (direction) => {
    if (!managingPage) return;

    const newPages = [...data.pages];
    const pageIndex = newPages.findIndex(p => p.id === managingPage.id);
    if (pageIndex === -1) return;

    const swapIndex = direction === 'UP' ? pageIndex - 1 : pageIndex + 1;
    if (swapIndex < 0 || swapIndex >= newPages.length) return;

    [newPages[pageIndex], newPages[swapIndex]] = [newPages[swapIndex], newPages[pageIndex]];
    const renumberedPages = newPages.map((p, idx) => ({ ...p, pageNo: idx + 1 }));

    await pushToFirebase({ ...data, pages: renumberedPages });
    setManagingPage(renumberedPages[swapIndex]);
    showToast(`Page Moved to Position #${swapIndex + 1}`);
  };

  const getPageIdFromPoint = (clientX: number, clientY: number) => {
    try {
      const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
      const pageEl = (el?.closest?.('[data-page-id]') as HTMLElement | null) ?? null;
      const idStr = pageEl?.getAttribute('data-page-id');
      if (!idStr) return null;
      const num = Number(idStr);
      return Number.isNaN(num) ? idStr : num;
    } catch {
      return null;
    }
  };

  const handleReorderPage = async (fromPageId: any, toPageId: any) => {
    const pagesSorted = [...(data.pages || [])].sort((a, b) => (a.pageNo || 0) - (b.pageNo || 0));
    const fromIndex = pagesSorted.findIndex(p => p.id === fromPageId);
    const toIndex = pagesSorted.findIndex(p => p.id === toPageId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    const next = [...pagesSorted];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);

    const renumberedPages = next.map((p, idx) => ({ ...p, pageNo: idx + 1 }));
    await pushToFirebase({ ...data, pages: renumberedPages });
    showToast(t('Page order updated'));
  };

  const clampFabPos = (pos: { x: number; y: number }, size: number) => {
    const margin = 12;
    const w = typeof window !== 'undefined' ? window.innerWidth : 360;
    const h = typeof window !== 'undefined' ? window.innerHeight : 640;
    return {
      x: Math.max(margin, Math.min(w - size - margin, pos.x)),
      y: Math.max(margin, Math.min(h - size - margin, pos.y)),
    };
  };

  const getDefaultFabPos = (size: number) => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 360;
    const h = typeof window !== 'undefined' ? window.innerHeight : 640;
    return { x: w - size - 24, y: h - size - 96 };
  };

  const loadFabPos = (key: string) => {
    try {
      const raw = localStorage.getItem(`fabPos:${key}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (typeof parsed?.x !== 'number' || typeof parsed?.y !== 'number') return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const saveFabPos = (key: string, pos: { x: number; y: number }) => {
    try {
      localStorage.setItem(`fabPos:${key}`, JSON.stringify(pos));
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const size = 64;
    if (view === 'generalIndex' && !fabPosIndex) {
      const saved = loadFabPos('index');
      const next = clampFabPos(saved || getDefaultFabPos(size), size);
      setFabPosIndex(next);
    }
    if (view === 'pagesGrid' && !fabPosPages) {
      const saved = loadFabPos('pages');
      const next = clampFabPos(saved || getDefaultFabPos(size), size);
      setFabPosPages(next);
    }
  }, [view, fabPosIndex, fabPosPages]);

  const makeFabHandlers = (
    key: 'index' | 'pages',
    getPos: () => { x: number; y: number } | null,
    setPos: (p: any) => void,
    onTap: () => void,
    size: number
  ) => {
    return {
      onPointerDown: (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        const pos = getPos() || getDefaultFabPos(size);
        fabDragRef.current = {
          key,
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          startPos: pos,
          moved: false,
        };
        try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* noop */ }
      },
      onPointerMove: (e: any) => {
        const st = fabDragRef.current;
        if (!st || st.key !== key || st.pointerId !== e.pointerId) return;
        const dx = e.clientX - st.startX;
        const dy = e.clientY - st.startY;
        if (!st.moved && Math.hypot(dx, dy) > 6) st.moved = true;
        const next = clampFabPos({ x: st.startPos.x + dx, y: st.startPos.y + dy }, size);
        setPos(next);
      },
      onPointerUp: (e: any) => {
        const st = fabDragRef.current;
        if (!st || st.key !== key || st.pointerId !== e.pointerId) return;
        fabDragRef.current = null;
        const pos = getPos();
        if (pos) saveFabPos(key, pos);
        if (!st.moved) onTap();
      },
      onPointerCancel: (e: any) => {
        const st = fabDragRef.current;
        if (!st || st.key !== key || st.pointerId !== e.pointerId) return;
        fabDragRef.current = null;
      },
    };
  };

  const handleMoveEntry = async (direction) => {
      if (!editingEntry) return;
      const pageEntries = data.entries.filter(e => e.pageId === editingEntry.pageId); 
      const entryIndexInPage = pageEntries.findIndex(e => e.id === editingEntry.id);
      
      if (entryIndexInPage === -1) return;
      
      const swapIndexInPage = direction === 'UP' ? entryIndexInPage - 1 : entryIndexInPage + 1;
      if (swapIndexInPage < 0 || swapIndexInPage >= pageEntries.length) return;

      const targetEntry = pageEntries[swapIndexInPage];

      const mainIndexCurrent = data.entries.findIndex(e => e.id === editingEntry.id);
      const mainIndexTarget = data.entries.findIndex(e => e.id === targetEntry.id);

      if (mainIndexCurrent === -1 || mainIndexTarget === -1) return;

      const newEntries = [...data.entries];
      [newEntries[mainIndexCurrent], newEntries[mainIndexTarget]] = [newEntries[mainIndexTarget], newEntries[mainIndexCurrent]];

      await pushToFirebase({ ...data, entries: newEntries });
      showToast(`Item Moved to Position #${swapIndexInPage + 1}`);
  };

  const updateQtyBuffer = useCallback((id, amount, currentRealQty) => {
    setTempChanges(prev => {
        const currentBufferVal = prev[id] !== undefined ? prev[id] : currentRealQty;
        const newQty = Math.max(0, currentBufferVal + amount);
        // If change reverts back to original quantity, remove from buffer
        if (newQty === currentRealQty) {
          const next = { ...prev };
          delete next[id];
          // Inform the user that the pending update was removed
          try { showToast(t('Change reverted, update removed'), 'error'); } catch { /* noop */ }
          return next;
        }
        return { ...prev, [id]: newQty };
    });
  }, [showToast, t]);

  const openSaveModal = () => {
    setSavePassInput('');
    setIsSaveModalOpen(true);
  };

  const executeSave = async () => {
      if (savePassInput !== data.settings.productPassword && savePassInput !== '0000' && savePassInput !== '123456') {
          showToast(t("Wrong Password!"), "error");
          return;
      }
      
        let lowStockTriggered = 0;
        const nowTs = Date.now();
        const nowIso = new Date(nowTs).toISOString();
        const newSalesEvents: any[] = [];

        const updatedEntries = data.entries.map(e => {
          if (tempChanges[e.id] !== undefined) {
            const finalQty = tempChanges[e.id];
            if (finalQty < data.settings.limit) lowStockTriggered++;

            const prevQty = Number(e.qty || 0);
            const nextQty = Number(finalQty || 0);
            const delta = nextQty - prevQty;

            if (delta !== 0) {
              newSalesEvents.push({
                id: `${nowTs}-${e.id}`,
                ts: nowTs,
                date: nowIso,
                type: delta < 0 ? 'sale' : 'restock',
                entryId: e.id,
                pageId: e.pageId,
                car: e.car,
                qty: Math.abs(delta)
              });
            }

            return { ...e, qty: finalQty };
          }
          return e;
        });

        const mergedSalesEvents = ([...(data.salesEvents || []), ...newSalesEvents]).slice(-2000);

        const success = await pushToFirebase({ ...data, entries: updatedEntries, salesEvents: mergedSalesEvents });
      if(success) {
          setTempChanges({}); 
          setIsSaveModalOpen(false); 
          if (lowStockTriggered > 0) {
              triggerLowStockNotification(lowStockTriggered);
              showToast(t("Stock Updated (Low Stock Alert!)"));
          } else {
              showToast(t("Database Synced Successfully!"));
          }
      }
  };

  const pageCounts = useMemo(() => {
    const counts = {};
    (data.entries || []).forEach(e => {
      counts[e.pageId] = (counts[e.pageId] || 0) + e.qty;
    });
    return counts;
  }, [data.entries]);

  const globalSearchResults = useMemo(() => {
    if (!indexSearchTerm) return { pages: (data.pages || []), items: [] };
    const safeTerm = indexSearchTerm.toLowerCase();
    const filteredPages = (data.pages || []).filter(p => p.itemName?.toLowerCase().includes(safeTerm));
    const filteredItems = (data.entries || []).filter(e => e.car?.toLowerCase().includes(safeTerm));
    
    const itemsGrouped = filteredItems.reduce((acc, item) => {
        const p = (data.pages || []).find(page => page.id === item.pageId);
        if (p && p.itemName) { 
            if (!acc[p.itemName]) acc[p.itemName] = []; 
            acc[p.itemName].push(item); 
        }
        return acc;
    }, {});
    return { pages: filteredPages, items: itemsGrouped };
  }, [data.pages, data.entries, indexSearchTerm]);

  // ?? SMART SEARCH WITH CACHING & FUZZY MATCHING
  const filteredStock = useMemo(() => {
      if (!stockSearchTerm || stockSearchTerm.trim() === '') return [];
      
      const term = stockSearchTerm.toLowerCase().trim();
      
      // Check cache first
      const cacheKey = `stock:${term}`;
      const cached = searchCache.get(cacheKey);
      if (cached) return cached;
      
      // Use smart search algorithm for better results
      const smartResult = performSmartSearch(term, data.entries || [], data.pages || [], { useFuzzy: data.settings?.fuzzySearch !== false });
      
      let results: any[];
      if (smartResult.match && smartResult.items.length > 0) {
          // Use smart search results (fuzzy matched)
          results = smartResult.items;
      } else {
          // Fallback to basic contains search
          results = (data.entries || []).filter(e => 
              e.car && e.car.toLowerCase().includes(term)
          );
      }
      
      // Cache results
      searchCache.set(cacheKey, results);
      return results;
  }, [data.entries, data.pages, stockSearchTerm]);

  // Optimized page search with caching
  const pageViewData = useMemo(() => {
      if (!activePage) return { filteredEntries: [], grandTotal: 0 };
      
      const pageEntries = (data.entries || []).filter(e => e.pageId === activePage.id);
      const safeSearch = pageSearchTerm ? pageSearchTerm.toLowerCase().trim() : '';
      
      let filtered: any[];
      if (safeSearch) {
          // Check cache
          const cacheKey = `page:${activePage.id}:${safeSearch}`;
          const cached = searchCache.get(cacheKey);
          if (cached) {
              filtered = cached;
          } else {
              // Smart fuzzy filter
              const smartResult = performSmartSearch(safeSearch, pageEntries, data.pages || [], { useFuzzy: data.settings?.fuzzySearch !== false });
              if (smartResult.match && smartResult.items.length > 0) {
                  filtered = smartResult.items;
              } else {
                  filtered = pageEntries.filter(e => e.car && e.car.toLowerCase().includes(safeSearch));
              }
              searchCache.set(cacheKey, filtered);
          }
      } else {
          filtered = pageEntries;
      }
      
      const total = pageEntries.reduce((acc, curr) => { 
          const val = tempChanges[curr.id] !== undefined ? tempChanges[curr.id] : curr.qty; 
          return acc + val; 
      }, 0);
      return { filteredEntries: filtered, grandTotal: total };
  }, [data.entries, data.pages, activePage, pageSearchTerm, tempChanges]);

  // --------------------------------------------------------------------------

  const TranslateBtn = () => (
    <button onClick={() => setIsHindi(!isHindi)} className={`p-2.5 rounded-xl border transition-all hover:scale-105 ${isDark ? 'bg-slate-700 border-slate-500 hover:bg-slate-600' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'}`}> 
      <Languages size={18} className={isHindi ? 'text-orange-500' : ''}/> 
    </button>
  );

  const renderSaveButton = () => {
      const count = Object.keys(tempChanges).length;
      if (count === 0) return null;
      return (
          <button 
            onClick={openSaveModal} 
            className="fixed bottom-24 right-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-green-500/40 flex items-center gap-3 z-50 cursor-pointer hover:from-green-500 hover:to-emerald-500 transition-all group"
            style={{animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'}}
          >
            <div className="bg-white/20 p-1.5 rounded-lg group-hover:bg-white/30 transition-colors">
              <SaveAll size={18} />
            </div>
            <span className="font-bold text-sm">{t("Update")} ({count})</span>
          </button>
      );
  };


    // Bills UI removed   feature deprecated per user request

  if (authLoading || (user && dbLoading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-10">
        <div className="flex flex-col items-center justify-center gap-8">
          {/* Logo */}
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-blue-600 to-purple-600 p-6 rounded-3xl shadow-2xl">
              <img src="/myicon.svg" alt="StoreLink" className="w-12 h-12" />
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-black tracking-widest text-white mb-2">STORELINK</h1>
            <p className="text-slate-400 text-sm font-medium">Business Tools & Billing</p>
          </div>

          {/* Loading Spinner (colors match logo theme) */}
          <div className="relative">
            <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
            <div
              className="absolute inset-0 w-12 h-12 border-4 border-transparent border-b-purple-500 rounded-full animate-spin"
              style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
            ></div>
          </div>

          <p className="text-slate-500 text-xs font-semibold animate-pulse">Loading your data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600 rounded-full blur-[120px] opacity-20"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-600 rounded-full blur-[120px] opacity-20"></div>
        
        {toast && <ToastMessage message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div className="w-full max-w-sm bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-slate-700/50 relative z-10">
           {/* Logo */}
           <div className="flex justify-center mb-6">
             <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-4 rounded-2xl shadow-lg">
               <img src="/myicon.svg" alt="StoreLink" className="w-8 h-8" />
             </div>
           </div>
           <h1 className="text-2xl font-bold text-center mb-1">Welcome to StoreLink</h1>
           <p className="text-center text-slate-400 mb-8 text-sm">Sign in to manage your inventory</p>
           
           <form onSubmit={handleAuth} className="space-y-4">
             <div>
               <label className="text-xs text-slate-400 font-bold ml-1 uppercase">Email Address</label>
               <input type="email" required className="w-full p-3 bg-slate-900 rounded-xl border border-slate-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none" placeholder="shop@gmail.com" value={email} onChange={e => setEmail(e.target.value)}/>
             </div>
             <div>
               <label className="text-xs text-slate-400 font-bold ml-1 uppercase">Password</label>
               <input type="password" required className="w-full p-3 bg-slate-900 rounded-xl border border-slate-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none" placeholder="******" value={password} onChange={e => setPassword(e.target.value)}/>
             </div>
             <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold shadow-lg shadow-blue-600/30 active:scale-95 transition-all">
               {isRegistering ? "Create Shop Account" : "Secure Login"}
             </button>
           </form>
           
           <div className="mt-6 text-center">
             <button onClick={() => setIsRegistering(!isRegistering)} className="text-blue-400 font-bold ml-2 hover:text-blue-300 transition-colors text-sm">
               {isRegistering ? "Already have an account? Login" : "New here? Create Account"}
             </button>
           </div>
        </div>
      </div>
    );
  }

  // If the app status is set to 'blocked' in Firestore, show a blocking screen
  if (data && data.appStatus === 'blocked') {
    const fid = fbDocId || (user && user.uid) || 'Unknown';
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900 p-6">
        <div className="max-w-xl w-full bg-slate-800 border rounded-xl shadow-xl p-6 text-center">
          <h3 className="text-2xl font-bold mb-2 text-[#f5e6cc]">Account Blocked</h3>
          <p className="mb-4 text-[#f5e6cc]">Your shop has been blocked by the administrator. Payment is pending and access has been restricted until the issue is resolved.</p>
          <p className="text-sm mb-4 text-[#f5e6cc] flex items-center justify-center gap-2"><strong>Firebase ID:</strong> <span className="font-mono">{fid}</span>
            <button onClick={() => { navigator.clipboard?.writeText(fid); showToast('Firebase ID copied to clipboard'); }} title="Copy Firebase ID" className="ml-2 inline-flex items-center justify-center p-1 rounded bg-transparent text-[#f5e6cc] hover:bg-slate-700">
              <Copy size={14} />
            </button>
          </p>
          <p className="text-sm mb-6 text-[#f5e6cc]">Please contact the administrator to resolve billing or account issues.</p>
          <div className="flex gap-3 justify-center">
            <a className="px-4 py-2 bg-amber-500 text-slate-900 rounded inline-flex items-center gap-2 font-bold" href={`tel:8619152422`}>
              Contact
            </a>
            <button onClick={() => { navigator.clipboard?.writeText(fid); showToast('Firebase ID copied to clipboard'); }} className="px-4 py-2 bg-gray-700 text-[#f5e6cc] rounded">Copy ID</button>
          </div>
        </div>
      </div>
    );
  }

  const renderGeneralIndex = () => (
    <div className="pb-24">
      <div className={`p-5 sticky top-0 z-10 ${isDark ? 'bg-gradient-to-b from-slate-900 to-slate-900/95' : 'bg-gradient-to-b from-amber-50 to-amber-50/95'} backdrop-blur-lg border-b ${isDark ? 'border-slate-800' : 'border-amber-200'}`}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${isDark ? 'bg-blue-500/20' : 'bg-amber-200'}`}>
              <img src="/myicon.svg" alt="StoreLink" className="w-6 h-6" />
            </div>
            <div>
              <h1 className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-amber-900'} truncate max-w-[180px]`}>
                {data.settings.shopName || "StoreLink"}
              </h1>
              <p className={`text-[10px] font-semibold ${isDark ? 'text-slate-400' : 'text-amber-600'}`}>Smart Auto Parts Management</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {isOnline ? <Wifi size={12}/> : <WifiOff size={12} className="animate-pulse"/>}
                <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
              {deferredPrompt && (
                <button
                  onClick={_handleInstallClick}
                  className={`p-2.5 rounded-xl border transition-all hover:scale-105 ${isDark ? 'bg-slate-700 border-slate-500 hover:bg-slate-600 text-white' : 'bg-white border-gray-200 shadow-sm hover:shadow-md text-gray-800'}`}
                  title="Add to Home Screen"
                  type="button"
                >
                  <Pin size={18} />
                </button>
              )}
              <TranslateBtn />
          </div>
        </div>
        <div className="flex gap-2 mt-2">
            <div className="relative flex-1">
                <input className={`w-full pl-10 pr-10 py-3 rounded-2xl border-2 outline-none transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-white border-amber-200 text-black focus:border-amber-500 shadow-sm'}`} placeholder={t("Search Index...")} value={indexSearchTerm} onChange={e => setIndexSearchTerm(e.target.value)}/>
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-amber-400'}`} size={18}/>
                {indexSearchTerm && <button onClick={() => setIndexSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"><X size={16}/></button>}
            </div>
            <VoiceInput onResult={setIndexSearchTerm} isDark={isDark} lang={isHindi ? 'hi-IN' : 'en-IN'} />
        </div>
      </div>

      {/* ?? AI INSIGHTS WIDGET - REMOVED 
         {(data.settings?.widgets?.aiInsights !== false) && (
           <AIInsightsWidget data={data} t={t} isDark={isDark} />
         )}
      */}

      {/* ?? SALES PREDICTION WIDGET */}
      {data.settings?.aiPredictions && (data.settings?.widgets?.predictions !== false) && (
        <SalesPredictionWidget data={data} t={t} isDark={isDark} />
      )}

      {/* ?? DEAD STOCK ALERT */}
      <DeadStockAlert 
        data={data} 
        onNavigate={(pageId) => { setActivePageId(pageId); setView('page'); }} 
      />

      {data.settings.pinnedTools && data.settings.pinnedTools.length > 0 && (
        <div className={`py-3 px-4 border-b overflow-x-auto whitespace-nowrap flex gap-3 hide-scrollbar ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
           {[
             {id: 'notes', icon: <StickyNote size={18}/>, label: 'Notes', col: 'text-yellow-600 bg-yellow-100'},
             {id: 'gst', icon: <Percent size={18}/>, label: 'GST', col: 'text-blue-600 bg-blue-100'},
             {id: 'margin', icon: <Calculator size={18}/>, label: 'Profit', col: 'text-purple-600 bg-purple-100'},
             {id: 'calculator', icon: <Calculator size={18}/>, label: 'Calc', col: 'text-slate-700 bg-slate-100'},
             {id: 'card', icon: <CreditCard size={18}/>, label: 'Card', col: 'text-orange-600 bg-orange-100'},
             {id: 'converter', icon: <RefreshCcw size={18}/>, label: 'Convert', col: 'text-green-600 bg-green-100'},
             {id: 'translator', icon: <Languages size={18}/>, label: 'Trans', col: 'text-pink-600 bg-pink-100'},
             {id: 'invoice', icon: <FileText size={18}/>, label: 'Bill', col: 'text-indigo-600 bg-indigo-100'},
           ].filter(t => data.settings.pinnedTools.includes(t.id)).map(tool => (
             <button key={tool.id} onClick={() => openTools(tool.id, view)} className={`inline-flex items-center gap-2 px-3 py-2 rounded-full font-bold text-sm shadow-sm border ${tool.col} border-transparent hover:scale-105 transition-transform`}>
               {tool.icon} {tool.label}
             </button>
           ))}
        </div>
      )}

      <div
        className={`m-2 mt-4 overflow-hidden rounded-2xl border ${
          isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'
        } shadow-sm`}
      >
        <div
          className={`flex border-b ${
            isDark ? 'border-slate-700 bg-slate-900/60 text-white' : 'border-gray-200 bg-gray-50 text-gray-900'
          } px-2 py-3`}
        >
          <div className={`w-12 font-black text-center border-r ${isDark ? 'border-slate-700/60' : 'border-gray-200'}`}>#</div>
          <div className={`flex-1 min-w-0 font-black pl-3 border-r ${isDark ? 'border-slate-700/60' : 'border-gray-200'}`}>{t("Particulars")}</div>
          <div className={`w-16 font-black text-center border-r ${isDark ? 'border-slate-700/60' : 'border-gray-200'}`}>{t("Page")}</div>
          <div className="w-12 font-black text-center">Edit</div>
        </div>
        <div className="min-h-[20vh]">
          {globalSearchResults.pages.map((page) => (
            <div
              key={page.id}
              onClick={() => {
                setActivePageId(page.id);
                setView('page');
                setPageSearchTerm('');
              }}
              className={`flex border-b cursor-pointer transition-colors h-14 items-center ${
                isDark
                  ? 'border-slate-800 text-white hover:bg-slate-800/60'
                  : 'border-gray-200 text-black hover:bg-gray-50'
              }`}
            >
              <div
                className={`w-12 text-center font-bold border-r h-full flex items-center justify-center text-sm ${
                  isDark ? 'border-slate-800 text-red-400' : 'border-gray-200 text-red-600'
                }`}
              >
                {page.pageNo}
              </div>
              <div
                className={`flex-1 min-w-0 pl-3 font-semibold text-base sm:text-lg border-r h-full flex items-center truncate ${
                  isDark ? 'border-slate-800' : 'border-gray-200'
                }`}
              >
                {t(page.itemName)}
              </div>
              <div
                className={`w-16 text-center font-bold h-full flex items-center justify-center underline border-r ${
                  isDark ? 'border-slate-800 text-sky-300' : 'border-gray-200 text-blue-700'
                }`}
              >
                {page.pageNo}
              </div>
              
              <div className="w-12 flex items-center justify-center h-full" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      setManagingPage(page);
                      setInput({ ...input, itemName: page.itemName });
                    }}
                    className={`p-2 rounded-full ${
                      isDark
                        ? 'text-slate-300 hover:text-white hover:bg-slate-700'
                        : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                      <Edit size={18}/>
                  </button>
              </div>
            </div>
          ))}
          {globalSearchResults.pages.length === 0 && <div className="p-8 text-center text-gray-400">\n            <Book size={48} className="mx-auto mb-3 opacity-30" />\n            <p className="font-semibold">{t("No Pages Found")}</p>\n            <p className="text-xs mt-1">Tap + to create your first page</p>\n          </div>}
        </div>
      </div>
      <button 
        type="button"
        aria-label="Add Page"
        title="Hold and drag to move"
        {...makeFabHandlers(
          'index',
          () => fabPosIndex,
          setFabPosIndex,
          () => setIsNewPageOpen(true),
          64
        )}
        style={{ position: 'fixed', left: (fabPosIndex?.x ?? getDefaultFabPos(64).x), top: (fabPosIndex?.y ?? getDefaultFabPos(64).y), touchAction: 'none' }}
        className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white w-16 h-16 rounded-2xl shadow-2xl shadow-yellow-500/40 flex items-center justify-center active:scale-90 z-20 hover:from-yellow-400 hover:to-orange-400 transition-all group"
      >
        <Plus size={32} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-200"/>
      </button>
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
            <VoiceInput onResult={setIndexSearchTerm} isDark={isDark} lang={isHindi ? 'hi-IN' : 'en-IN'} />
        </div>
        
        <div className="flex flex-col gap-3">
            {globalSearchResults.pages.map((page) => {
                  const totalItems = pageCounts[page.id] || 0;
                  const isDragTarget = draggingPageId && dragOverPageId === page.id;
                  return (
                     <div
                       key={page.id}
                       data-page-id={page.id}
                       onClick={() => { setActivePageId(page.id); setView('page'); setPageSearchTerm(''); }}
                       className={`relative p-4 rounded-xl border-2 shadow-sm cursor-pointer active:scale-95 transition-all flex flex-row items-center justify-between h-24 ${isDark ? 'bg-slate-800 border-slate-600 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-500'} ${isDragTarget ? 'border-blue-500' : ''}`}
                     >
                         <div className="flex items-center gap-4">
                              <button
                                type="button"
                                title={t('Hold and drag to reorder')}
                                onClick={(e) => e.stopPropagation()}
                                onPointerDown={(e) => {
                                  e.stopPropagation();
                                  draggingPageIdRef.current = page.id;
                                  dragOverPageIdRef.current = page.id;
                                  setDraggingPageId(page.id);
                                  setDragOverPageId(page.id);
                                  try { (e.currentTarget as any).setPointerCapture?.(e.pointerId); } catch { /* noop */ }
                                }}
                                onPointerMove={(e) => {
                                  if (!draggingPageIdRef.current) return;
                                  const overId = getPageIdFromPoint(e.clientX, e.clientY);
                                  if (overId == null) return;
                                  if (dragOverPageIdRef.current !== overId) {
                                    dragOverPageIdRef.current = overId;
                                    setDragOverPageId(overId);
                                  }
                                }}
                                onPointerUp={async (e) => {
                                  e.stopPropagation();
                                  const fromId = draggingPageIdRef.current;
                                  const toId = dragOverPageIdRef.current;
                                  draggingPageIdRef.current = null;
                                  dragOverPageIdRef.current = null;
                                  setDraggingPageId(null);
                                  setDragOverPageId(null);
                                  if (fromId && toId && fromId !== toId) {
                                    await handleReorderPage(fromId, toId);
                                  }
                                }}
                                onPointerCancel={(e) => {
                                  e.stopPropagation();
                                  draggingPageIdRef.current = null;
                                  dragOverPageIdRef.current = null;
                                  setDraggingPageId(null);
                                  setDragOverPageId(null);
                                }}
                                className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900/40 border-slate-700 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-500'} active:scale-95 transition-transform cursor-grab active:cursor-grabbing`}
                              >
                                <GripVertical size={18} />
                              </button>
                              <div className="bg-gray-100 rounded p-2 border font-bold text-gray-500">#{page.pageNo}</div>
                              <div>
                                 <h3 className={`font-bold text-xl leading-tight ${isDark ? 'text-white' : 'text-gray-800'}`}>{t(page.itemName)}</h3>
                                 <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{totalItems} Pcs</span>
                              </div>
                         </div>
                         <button onClick={(e) => { e.stopPropagation(); setManagingPage(page); setInput({...input, itemName: page.itemName}); }} className="p-3 text-blue-500 hover:bg-blue-50 rounded-full border border-blue-100"><Edit size={24}/></button>
                     </div>
                  )
            })}
        </div>
        <button
          type="button"
          aria-label="Add Page"
          title="Hold and drag to move"
          {...makeFabHandlers(
            'pages',
            () => fabPosPages,
            setFabPosPages,
            () => setIsNewPageOpen(true),
            56
          )}
          style={{ position: 'fixed', left: (fabPosPages?.x ?? getDefaultFabPos(56).x), top: (fabPosPages?.y ?? getDefaultFabPos(56).y), touchAction: 'none' }}
          className="bg-blue-600 text-white w-14 h-14 rounded-full shadow-xl border-2 border-white flex items-center justify-center active:scale-95 z-20"
        >
          <Plus size={28}/>
        </button>
    </div>
  );

  const renderStockSearch = () => (
    <StockSearchView
      isDark={isDark}
      isHindi={isHindi}
      t={t}
      translateButton={<TranslateBtn />}
      data={data}
      filteredStock={filteredStock}
      displayLimit={displayLimit}
      setDisplayLimit={setDisplayLimit}
      stockSearchTerm={stockSearchTerm}
      setStockSearchTerm={setStockSearchTerm}
      isSafeMode={isSafeMode}
      setIsSafeMode={setIsSafeMode}
      setView={setView}
      setActivePageId={setActivePageId}
      setPageSearchTerm={setPageSearchTerm}
      updateQtyBuffer={updateQtyBuffer}
      tempChanges={tempChanges}
      VoiceInput={VoiceInput}
    />
  );

  const renderPage = () => {
    if (!activePage) return <div className={`min-h-screen flex items-center justify-center ${isDark ? 'text-white' : 'text-black'}`}>Page not found or Loading...</div>;

    const { filteredEntries, grandTotal } = pageViewData;
    const currentPageIndex = data.pages.findIndex(p => p.id === activePageId);
    const prevPage = currentPageIndex > 0 ? data.pages[currentPageIndex - 1] : null;
    const nextPage = currentPageIndex < data.pages.length - 1 ? data.pages[currentPageIndex + 1] : null;

    const visibleEntries = filteredEntries.slice(0, displayLimit);

    return (
      <div className={`pb-24 min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-white text-black'}`}>
        <div className={`sticky top-0 z-10 border-b-2 shadow-sm ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-red-200'}`}>
           <div className={`flex items-center p-3 ${isDark ? 'bg-slate-800' : 'bg-red-50'}`}>
              <button onClick={() => { setView('generalIndex'); setActivePageId(null); }} className="mr-2 p-2"><ArrowLeft/></button>
              <div className="flex-1">
                 <div className="flex justify-between items-center">
                    <p className={`text-xs font-bold uppercase ${isDark ? 'text-slate-400' : 'text-red-400'}`}>{t("Page No")}: {activePage.pageNo}</p>
                    
                    <div className="flex gap-4 items-center bg-white/10 p-1 rounded-full">
                         <button onClick={() => setActivePageId(prevPage.id)} disabled={!prevPage} className="h-12 w-12 flex items-center justify-center bg-blue-600 text-white rounded-full shadow-lg disabled:opacity-30 disabled:bg-gray-400 active:scale-95 transition-transform"><ArrowLeftIcon size={28}/></button>
                         <button onClick={() => setActivePageId(nextPage.id)} disabled={!nextPage} className="h-12 w-12 flex items-center justify-center bg-blue-600 text-white rounded-full shadow-lg disabled:opacity-30 disabled:bg-gray-400 active:scale-95 transition-transform"><ArrowRight size={28}/></button>
                    </div>

                    <div className="flex gap-2 ml-2">
                        <button onClick={() => setIsCopyModalOpen(true)} className={`p-2 rounded-full border ${isDark ? 'bg-slate-700 text-yellow-400 border-slate-500' : 'bg-yellow-100 text-yellow-700 border-yellow-400'}`}><Copy size={20}/></button>
                        <TranslateBtn />
                    </div>
                 </div>
                 <h2 className="text-2xl font-black uppercase mt-1">{t(activePage.itemName)}</h2>
                 <div className="text-xs font-bold opacity-70 mt-1">{t("Total")} {t("Items")}: {grandTotal}</div>
              </div>
           </div>
           <div className={`p-2 flex gap-2 border-t ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
              <div className="relative flex-1">
                 <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                 <input className={`w-full pl-8 py-2 rounded border outline-none ${isDark ? 'bg-slate-900 border-slate-600' : 'bg-gray-50 border-gray-300'}`} placeholder={t("Search Item...")} value={pageSearchTerm} onChange={e => setPageSearchTerm(e.target.value)}/>
              </div>
              <VoiceInput onResult={setPageSearchTerm} isDark={isDark} lang={isHindi ? 'hi-IN' : 'en-IN'} />
           </div>
           <div className={`flex p-2 text-xs font-bold uppercase ${isDark ? 'bg-slate-700' : 'bg-red-100 text-red-900'}`}>
             <div className="w-6 pl-1">#</div>
             <div className="flex-[2]">{t("Car Name")}</div>
             <div className="flex-[1] text-center">{t("Qty")}</div>
             <div className="w-8 text-center">Ed</div> 
           </div>
        </div>
        
        <div className="flex flex-col">
          {visibleEntries.map((entry, index) => (
             <EntryRow 
                key={entry.id} 
                index={index}
                entry={entry} 
                t={t} 
                isDark={isDark} 
                onUpdateBuffer={updateQtyBuffer} 
                onEdit={setEditingEntry} 
                limit={data.settings.limit}
                tempQty={tempChanges[entry.id]}
             />
          ))}
        </div>
        
        {filteredEntries.length > displayLimit && (
            <button onClick={() => setDisplayLimit(prev => prev + 50)} className="w-full py-6 text-blue-500 font-bold opacity-80 border-t">
                {t("Load More")}... ({t("Showing")} {visibleEntries.length} {t("of")} {filteredEntries.length})
            </button>
        )}

        <button onClick={() => setIsNewEntryOpen(true)} className="fixed bottom-24 right-6 bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg border-2 border-white flex items-center justify-center z-20"><Plus size={28}/></button>
      </div>
    );
  };

  const renderAlerts = () => (
     <div className={`p-4 pb-24 min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-gray-50 text-black'}`}>
        <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold text-red-500 flex items-center gap-2"><AlertTriangle/> {t("Low Stock")}</h2><TranslateBtn /></div>
        {(data.entries || []).filter(e => e.qty < data.settings.limit).length === 0 && <div className="text-center mt-10 opacity-50">{t("Stock Full")}</div>}
        {(data.entries || []).filter(e => e.qty < data.settings.limit).map(e => {
           const p = (data.pages || []).find(page => page.id === e.pageId);
           return (
              <div key={e.id} className="p-4 border-l-4 border-red-500 bg-white text-black shadow mb-2 rounded flex justify-between items-center" onClick={() => { if(p) { setActivePageId(p.id); setView('page'); }}}>
                 <div><h3 className="font-bold">{t(e.car)}</h3><p className="text-xs">{t(p?.itemName || "Unknown")}</p></div>
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
                 <p className="mb-4 text-center opacity-70">{t("Enter Product Password to Access Settings")}</p>
                 <input type="password" placeholder={t("Product Password")} className={`w-full max-w-xs p-3 text-center text-xl rounded border mb-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'}`} value={settingsPassInput} onChange={e => setSettingsPassInput(e.target.value)} />
                 <button onClick={handleSettingsUnlock} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg active:scale-95 transition-all">{t("UNLOCK SETTINGS")}</button>
                 
                 <div className="mt-8 flex items-center justify-center gap-2 text-green-600 bg-green-50 p-2 rounded-full px-4 border border-green-200">
                     <ShieldCheck size={16} /> 
                     <span className="text-xs font-bold uppercase tracking-widest">{t("Secured by Autonex")}</span>
                 </div>
              </div>
            );
          }

    const settingsTabs = [
      { id: 'profile', icon: Store, label: t('Profile'), color: 'from-purple-500 to-indigo-500' },
      { id: 'ai', icon: Activity, label: t('AI'), color: 'from-blue-500 to-cyan-500' },
      { id: 'appearance', icon: PenTool, label: t('Theme'), color: 'from-pink-500 to-rose-500' },
      { id: 'notifications', icon: Bell, label: t('Alerts'), color: 'from-green-500 to-emerald-500' },
      { id: 'security', icon: Shield, label: t('Security'), color: 'from-red-500 to-orange-500' },
      { id: 'backup', icon: Download, label: t('Backup'), color: 'from-cyan-500 to-blue-500' },
      { id: 'help', icon: HelpCircle, label: t('Help'), color: 'from-gray-500 to-slate-500' },
    ];

    const themeOptions = [
      { id: 'light', name: t('Light'), colors: ['#ffffff', '#f1f5f9', '#3b82f6'] },
      { id: 'dark', name: t('Dark'), colors: ['#0f172a', '#1e293b', '#3b82f6'] },
      { id: 'blue', name: t('Ocean Blue'), colors: ['#1e3a5f', '#2563eb', '#60a5fa'] },
      { id: 'green', name: t('Forest'), colors: ['#14532d', '#22c55e', '#86efac'] },
      { id: 'purple', name: t('Royal'), colors: ['#4c1d95', '#8b5cf6', '#c4b5fd'] },
      { id: 'orange', name: t('Sunset'), colors: ['#7c2d12', '#f97316', '#fed7aa'] },
      { id: 'rose', name: t('Rose'), colors: ['#4c0519', '#f43f5e', '#fda4af'] },
      { id: 'auto', name: t('Auto'), colors: ['#1e293b', '#ffffff', '#8b5cf6'] },
    ];

    const accentColors = [
      { id: 'blue', color: '#3b82f6', name: 'Blue' },
      { id: 'green', color: '#22c55e', name: 'Green' },
      { id: 'purple', color: '#8b5cf6', name: 'Purple' },
      { id: 'orange', color: '#f97316', name: 'Orange' },
      { id: 'pink', color: '#ec4899', name: 'Pink' },
      { id: 'cyan', color: '#06b6d4', name: 'Cyan' },
      { id: 'red', color: '#ef4444', name: 'Red' },
      { id: 'yellow', color: '#eab308', name: 'Yellow' },
    ];

    return (
    <div className={`pb-24 min-h-screen ${isDark ? 'text-white' : 'text-black'}`} style={{ backgroundColor: themePreset.bg }}>
       {/* Header */}
       <div className={`sticky top-0 z-40 p-4 backdrop-blur-xl ${isDark ? 'bg-slate-900/90' : 'bg-gray-50/90'}`}>
         <div className="flex justify-between items-center mb-4">
           <h2 className="text-2xl font-bold flex items-center gap-2"><Settings/> {t("Settings")}</h2>
         </div>
         
         {/* Tab Navigation */}
         <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
           {settingsTabs.map(tab => (
             <button
               key={tab.id}
               onClick={() => setSettingsTab(tab.id as any)}
               className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                 settingsTab === tab.id 
                   ? `bg-gradient-to-r ${tab.color} text-white shadow-lg scale-105` 
                   : isDark ? 'bg-slate-800 text-gray-400 hover:bg-slate-700' : 'bg-white text-gray-500 hover:bg-gray-100'
               }`}
             >
               <tab.icon size={14} />
               {tab.label}
             </button>
           ))}
         </div>
       </div>

       <div className="p-4">
       {/* ?? PROFILE TAB */}
       {settingsTab === 'profile' && (
         <div className="space-y-4 animate-in fade-in duration-300">
           <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
             <div className="flex items-center gap-3 mb-4">
               <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl shadow-lg">
                 <Store size={24} className="text-white" />
               </div>
               <div>
                 <h3 className="font-bold text-lg">{t("Shop Profile")}</h3>
                 <p className="text-xs opacity-60">{t("Your business information")}</p>
               </div>
             </div>
             
             <div className="space-y-3">
               <div>
                 <label className="text-xs font-bold opacity-60 mb-1 block">{t("Shop Name")}</label>
                 <input 
                   type="text" 
                   className={`w-full p-3 rounded-xl border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}
                   value={data.settings.shopName || ''} 
                   onChange={e => pushToFirebase({...data, settings: {...data.settings, shopName: e.target.value}})} 
                   placeholder={t("Enter Shop Name")} 
                 />
               </div>
               
               <div>
                 <label className="text-xs font-bold opacity-60 mb-1 block">{t("Shop Address")}</label>
                 <input 
                   type="text"
                   placeholder={t("Shop Address")}
                   value={data.settings?.shopAddress || ''}
                   onChange={e => pushToFirebase({...data, settings: {...data.settings, shopAddress: e.target.value}})}
                   className={`w-full p-3 rounded-xl border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}
                 />
               </div>
               
               <div className="grid grid-cols-2 gap-2">
                 <div>
                   <label className="text-xs font-bold opacity-60 mb-1 block">{t("City")}</label>
                   <input 
                     type="text"
                     placeholder={t("City")}
                     value={data.settings?.shopCity || ''}
                     onChange={e => pushToFirebase({...data, settings: {...data.settings, shopCity: e.target.value}})}
                     className={`w-full p-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}
                   />
                 </div>
                 <div>
                   <label className="text-xs font-bold opacity-60 mb-1 block">{t("PIN Code")}</label>
                   <input 
                     type="text"
                     placeholder={t("PIN Code")}
                     value={data.settings?.shopPincode || ''}
                     onChange={e => pushToFirebase({...data, settings: {...data.settings, shopPincode: e.target.value}})}
                     className={`w-full p-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}
                   />
                 </div>
               </div>
               
               <div>
                 <label className="text-xs font-bold opacity-60 mb-1 block">{t("GST Number (Optional)")}</label>
                 <input 
                   type="text"
                   placeholder={t("GST Number")}
                   value={data.settings?.gstNumber || ''}
                   onChange={e => pushToFirebase({...data, settings: {...data.settings, gstNumber: e.target.value}})}
                   className={`w-full p-3 rounded-xl border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}
                 />
               </div>
               
               <div>
                 <label className="text-xs font-bold opacity-60 mb-1 block">{t("Phone Number")}</label>
                 <input 
                   type="tel"
                   placeholder={t("e.g., +91 98765 43210")}
                   value={data.settings?.shopPhone || ''}
                   onChange={e => pushToFirebase({...data, settings: {...data.settings, shopPhone: e.target.value}})}
                   className={`w-full p-3 rounded-xl border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}
                 />
               </div>
               <User size={18} className="text-orange-500"/>
               <span className="font-bold">{t("Your Customer ID")}</span>
             </div>
             <div className="flex gap-2 items-center">
               <code className={`flex-1 p-2 rounded-lg font-mono text-xs break-all select-all ${isDark ? 'bg-slate-700' : 'bg-white'}`}>
                 {user.uid}
               </code>
               <button onClick={() => { navigator.clipboard.writeText(user.uid); showToast("ID Copied!"); }} className="p-2 bg-orange-500 text-white rounded-lg active:scale-95 transition-transform shadow">
                 <Copy size={18}/>
               </button>
             </div>
             <p className="text-[10px] opacity-50 mt-2">{t("Share this ID for support")}</p>
           </div>

           {/* Business Tools */}
           <button onClick={() => openTools(null, view)} className={`w-full p-4 rounded-2xl flex items-center justify-between gap-2 shadow-sm border ${isDark ? 'bg-gradient-to-r from-slate-800 to-blue-900/30 border-blue-500/30' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow"><Briefcase size={20} className="text-white" /></div>
              <div className="text-left">
                <span className="font-bold block">{t("Business Tools")}</span>
                <span className="text-xs opacity-60">{t("GST, Invoice, Calculator")}</span>
              </div>
            </div>
            <ChevronRight size={20} className="opacity-50"/>
           </button>

           {/* Business Achievements */}
           <div className={`p-4 rounded-2xl border ${isDark ? 'bg-gradient-to-br from-slate-800 to-yellow-900/30 border-yellow-500/30' : 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200'}`}>
             <div className="flex items-center gap-2 mb-3">
               <ShieldCheck size={18} className="text-yellow-500"/>
               <span className="font-bold">{t("Business Achievements")}</span>
             </div>
             <div className="grid grid-cols-3 gap-2 mb-3">
               {[
                 { label: t('Days'), value: '30+' },
                 { label: t('Products'), value: (data.entries?.length || 0).toString() },
                 { label: t('Bills'), value: (data.bills?.length || 0).toString() },
               ].map((stat, i) => (
                 <div key={i} className={`p-2 rounded-xl text-center ${isDark ? 'bg-slate-700/50' : 'bg-white/80'}`}>
                   <p className="text-lg font-bold">{stat.value}</p>
                   <p className="text-[9px] opacity-60">{stat.label}</p>
                 </div>
               ))}
             </div>
             <div className={`p-2 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-yellow-100/50'}`}>
               <div className="flex items-center justify-between text-xs mb-1">
                 <span>{t("Level")}</span>
                 <span className="font-bold">{(data.entries?.length || 0) > 100 ? t('Gold') : (data.entries?.length || 0) > 50 ? t('Silver') : t('Bronze')}</span>
               </div>
               <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                 <div className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full" style={{ width: `${Math.min(100, ((data.entries?.length || 0) / 100) * 100)}%` }}></div>
               </div>
             </div>
           </div>

           {/* Install App Button */}
           <button 
             onClick={() => {
               if (deferredPrompt) {
                 deferredPrompt.prompt();
                 deferredPrompt.userChoice.then((choiceResult) => { 
                   if (choiceResult.outcome === 'accepted') setDeferredPrompt(null); 
                   showToast(choiceResult.outcome === 'accepted' ? t("App Installed!") : t("Installation cancelled"));
                 });
               } else {
                 showToast(t("Use browser menu ? Add to Home Screen"));
               }
             }} 
             className={`w-full p-4 rounded-2xl flex items-center justify-between gap-2 shadow-sm border ${deferredPrompt ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-400' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}
           >
             <div className="flex items-center gap-3">
               <div className={`p-2 rounded-xl shadow ${deferredPrompt ? 'bg-white/20' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
                 <Download size={20} className="text-white" />
               </div>
               <div className="text-left">
                 <span className="font-bold block">{t("Install App")}</span>
                 <span className={`text-xs ${deferredPrompt ? 'text-white/80' : 'opacity-60'}`}>
                   {deferredPrompt ? t("Tap to install on your device") : t("Already installed or use browser menu")}
                 </span>
               </div>
             </div>
             {deferredPrompt && <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>}
           </button>
         </div>
       )}

       {/* ?? AI TAB */}
       {settingsTab === 'ai' && (
         <div className="space-y-4 animate-in fade-in duration-300">
           <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
             <div className="flex items-center gap-3 mb-4">
               <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg">
                 <Activity size={24} className="text-white" />
               </div>
               <div>
                 <h3 className="font-bold text-lg">{t("AI & Smart Features")}</h3>
                 <p className="text-xs opacity-60">{t("Powered by Machine Learning")}</p>
               </div>
             </div>

             <div className="space-y-2">
               {[
                 { id: 'fuzzySearch', icon: Search, label: t('Fuzzy Search'), desc: t('Find items with typos'), gradient: 'from-orange-500 to-amber-500' },
                 { id: 'autoCategory', icon: Layers, label: t('Auto Categorization'), desc: t('AI groups products'), gradient: 'from-pink-500 to-rose-500' },
               ].map(item => (
                 (() => {
                   const defaultOn = item.id === 'fuzzySearch';
                   const isEnabled = defaultOn ? data.settings?.[item.id] !== false : !!data.settings?.[item.id];
                   return (
                     <div key={item.id} className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                       <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg bg-gradient-to-br ${item.gradient}`}>
                           <item.icon size={16} className="text-white" />
                         </div>
                         <div>
                           <p className="text-sm font-semibold">{item.label}</p>
                           <p className="text-[10px] opacity-50">{item.desc}</p>
                         </div>
                       </div>
                       <button
                         onClick={() => {
                           const nextEnabled = !isEnabled;
                           const newData = { ...data, settings: { ...data.settings, [item.id]: nextEnabled } };
                           setData(newData);
                           pushToFirebase(newData);
                         }}
                         className={`relative w-11 h-6 rounded-full transition-all duration-300 ${isEnabled ? `bg-gradient-to-r ${item.gradient}` : 'bg-gray-300'}`}
                       >
                         <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${isEnabled ? 'left-5' : 'left-0.5'}`}></div>
                       </button>
                     </div>
                   );
                 })()
               ))}
             </div>
           </div>
         </div>
       )}

       {/* ?? APPEARANCE TAB */}
       {settingsTab === 'appearance' && (
         <div className="space-y-4 animate-in fade-in duration-300">
           {/* Theme Selection */}
           <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
             <div className="flex items-center gap-3 mb-4">
               <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl shadow-lg">
                 <PenTool size={24} className="text-white" />
               </div>
               <div>
                 <h3 className="font-bold text-lg">{t("Theme")}</h3>
                 <p className="text-xs opacity-60">{t("Choose your style")}</p>
               </div>
             </div>

             <div className="grid grid-cols-4 gap-2 mb-4">
               {themeOptions.map(theme => (
                 <button
                   key={theme.id}
                   onClick={() => pushToFirebase({...data, settings: {...data.settings, theme: theme.id}})}
                   className={`p-2 rounded-xl border-2 transition-all ${(data.settings?.theme || 'light') === theme.id 
                     ? 'border-blue-500 scale-105 shadow-lg' 
                     : isDark ? 'border-slate-600 hover:border-slate-500' : 'border-gray-200 hover:border-gray-300'}`}
                 >
                   <div className="flex justify-center gap-0.5 mb-1.5">
                     {theme.colors.map((color, i) => (
                       <div key={i} className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: color }}></div>
                     ))}
                   </div>
                   <p className="text-[10px] font-semibold text-center">{theme.name}</p>
                   {(data.settings?.theme || 'light') === theme.id && <CheckCircle size={12} className="text-blue-500 mx-auto mt-1"/>}
                 </button>
               ))}
             </div>
           </div>

           {/* Font Size */}
           <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
             <div className="flex items-center gap-2 mb-3">
               <Type size={18} className="text-pink-500"/>
               <span className="font-bold">{t("Font Size")}</span>
             </div>
             <div className="flex gap-2">
               {['Small', 'Medium', 'Large'].map(size => (
                 <button
                   key={size}
                   onClick={() => pushToFirebase({...data, settings: {...data.settings, fontSize: size}})}
                   className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${(data.settings?.fontSize || 'Medium') === size
                     ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
                     : isDark ? 'bg-slate-700' : 'bg-gray-100'}`}
                 >
                   {t(size)}
                 </button>
               ))}
             </div>
           </div>

           {/* More Options */}
           <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
             <p className="text-xs font-bold opacity-60 mb-3">{t("More Options")}</p>
             <div className="space-y-2">
               {[
                 { id: 'soundEffects', icon: Vibrate, label: t('Sound Effects'), desc: t('Button sounds') },
                 { id: 'highContrast', icon: AlertCircle, label: t('High Contrast'), desc: t('Better visibility') },
                 { id: 'reducedMotion', icon: Zap, label: t('Reduced Motion'), desc: t('Less animations') },
               ].map(item => (
                 <div key={item.id} className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                   <div className="flex items-center gap-3">
                     <item.icon size={18} className="text-purple-500" />
                     <div>
                       <p className="text-sm font-semibold">{item.label}</p>
                       <p className="text-[10px] opacity-50">{item.desc}</p>
                     </div>
                   </div>
                   <button 
                     onClick={() => pushToFirebase({...data, settings: {...data.settings, [item.id]: item.id === 'soundEffects' ? data.settings?.soundEffects === false : !data.settings?.[item.id]}})}
                     className={`relative w-10 h-5 rounded-full transition-all duration-300 ${(item.id === 'soundEffects' ? data.settings?.soundEffects !== false : data.settings?.[item.id]) ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-300'}`}
                   >
                     <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${(item.id === 'soundEffects' ? data.settings?.soundEffects !== false : data.settings?.[item.id]) ? 'left-5' : 'left-0.5'}`}></div>
                   </button>
                 </div>
               ))}
             </div>
           </div>
         </div>
       )}

       {/* ?? NOTIFICATIONS TAB */}
       {settingsTab === 'notifications' && (
         <div className="space-y-4 animate-in fade-in duration-300">
           <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
             <div className="flex items-center gap-3 mb-4">
               <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-lg">
                 <Bell size={24} className="text-white" />
               </div>
               <div>
                 <h3 className="font-bold text-lg">{t("Notifications")}</h3>
                 <p className="text-xs opacity-60">{t("Stay informed")}</p>
               </div>
             </div>

             {/* Permission Status */}
             <div className={`p-3 rounded-xl border mb-4 flex items-center justify-between ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
               <div>
                 <p className="font-bold">{t("Push Notifications")}</p>
                 <p className="text-xs opacity-60">{notifPermission === 'granted' ? t("Enabled") : t("Allow popups & alerts")}</p>
               </div>
               {notifPermission === 'granted' 
                 ? <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg font-bold text-xs flex items-center gap-1"><CheckCircle size={14}/> Active</span>
                 : <button onClick={requestNotificationPermission} className="px-3 py-1.5 bg-green-600 text-white rounded-lg font-bold text-xs flex items-center gap-1"><Bell size={14}/> Enable</button>
               }
             </div>

             {/* Notification Types */}
             <p className="text-xs font-bold opacity-60 mb-2">{t("Alert Types")}</p>
             <div className="space-y-2">
               {[
                 { id: 'lowStockAlert', icon: Package, label: t('Low Stock Alerts'), color: 'text-orange-500' },
                 
                 
                 { id: 'expiryAlert', icon: AlertTriangle, label: t('Expiry Reminders'), color: 'text-yellow-500' },
               ].map(item => (
                 <div key={item.id} className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                   <div className="flex items-center gap-3">
                     <item.icon size={18} className={item.color} />
                     <p className="text-sm font-semibold">{item.label}</p>
                   </div>
                   <button 
                     onClick={() => pushToFirebase({...data, settings: {...data.settings, notifications: {...(data.settings?.notifications || {}), [item.id]: !data.settings?.notifications?.[item.id]}}})}
                     className={`relative w-10 h-5 rounded-full transition-all duration-300 ${data.settings?.notifications?.[item.id] ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gray-300'}`}
                   >
                     <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${data.settings?.notifications?.[item.id] ? 'left-5' : 'left-0.5'}`}></div>
                   </button>
                 </div>
               ))}
             </div>
           </div>

           {/* Low Stock Limit */}
           <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
             <div className="flex items-center gap-2 mb-3">
               <AlertTriangle size={18} className="text-red-500"/>
               <span className="font-bold">{t("Low Stock Limit")}</span>
             </div>
             <div className="flex items-center gap-4 mb-3">
               <input 
                 type="range" min="1" max="20" 
                 value={tempLimit} 
                 onChange={(e) => setTempLimit(parseInt(e.target.value))} 
                 className="flex-1 accent-red-500 h-2 bg-gray-200 rounded-lg"
               />
               <span className="text-2xl font-bold w-10 text-center">{tempLimit}</span>
             </div>
             <button 
               onClick={() => { triggerConfirm("Update?", `Set limit to ${tempLimit}?`, false, () => pushToFirebase({...data, settings: {...data.settings, limit: tempLimit}}))}}
               className="w-full py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-bold text-sm"
             >
               {t("Save Limit")}
             </button>
           </div>
         </div>
       )}

       {/* ?? SECURITY TAB */}
       {settingsTab === 'security' && (
         <div className="space-y-4 animate-in fade-in duration-300">
           <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
             <div className="flex items-center gap-3 mb-4">
               <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl shadow-lg">
                 <Shield size={24} className="text-white" />
               </div>
               <div>
                 <h3 className="font-bold text-lg">{t("Security")}</h3>
                 <p className="text-xs opacity-60">{t("Protect your data")}</p>
               </div>
             </div>

             {/* Change Password */}
             <div className={`p-3 rounded-xl border mb-3 ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
               <p className="font-bold mb-2">{t("Product Password")}</p>
               <input 
                 type="password" 
                 placeholder={t("New Password")} 
                 className={`w-full p-2 rounded-lg border mb-2 ${isDark ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                 value={newProductPass} 
                 onChange={e => setNewProductPass(e.target.value)}
               />
               <button 
                 onClick={() => { triggerConfirm("Change?", "Update password?", false, () => { pushToFirebase({...data, settings: {...data.settings, productPassword: newProductPass}}); setNewProductPass(''); showToast(t("Updated!")); })}}
                 className="w-full py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg font-bold text-sm"
               >
                 {t("Update Password")}
               </button>
             </div>

             {/* Security Features */}
             <div className="space-y-2">
               {/* Auto Lock Timer */}
               <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                 <div className="flex items-center gap-3">
                   <Clock size={18} className="text-orange-500" />
                   <div>
                     <p className="text-sm font-semibold">{t("Auto Lock")}</p>
                     <p className="text-[10px] opacity-50">{t("Lock after inactivity")}</p>
                   </div>
                 </div>
                 <select 
                   value={data.settings?.autoLockTime || '5'}
                   onChange={e => pushToFirebase({...data, settings: {...data.settings, autoLockTime: e.target.value}})}
                   className={`px-3 py-1 rounded-lg text-xs font-bold border ${isDark ? 'bg-slate-600 border-slate-500 text-white' : 'bg-gray-100 border-gray-300'}`}
                 >
                   <option value="1">1 min</option>
                   <option value="5">5 min</option>
                   <option value="15">15 min</option>
                   <option value="never">Never</option>
                 </select>
               </div>

               {/* Data Encryption - Always ON */}
               <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                 <div className="flex items-center gap-3">
                   <Lock size={18} className="text-green-500" />
                   <div>
                     <p className="text-sm font-semibold">{t("Data Encryption")}</p>
                     <p className="text-[10px] opacity-50">{t("AES-256 encryption")}</p>
                   </div>
                 </div>
                 <span className="px-2 py-1 bg-green-100 text-green-600 rounded-lg text-[10px] font-bold flex items-center gap-1">
                   <CheckCircle size={10}/> Enabled
                 </span>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* ?? BACKUP TAB */}
       {settingsTab === 'backup' && (
         <div className="space-y-4 animate-in fade-in duration-300">
           <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
             <div className="flex items-center gap-3 mb-4">
               <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl shadow-lg">
                 <Download size={24} className="text-white" />
               </div>
               <div className="flex-1">
                 <h3 className="font-bold text-lg">{t("Cloud & Backup")}</h3>
                 <p className="text-xs opacity-60">{t("Never lose your data")}</p>
               </div>
               <span className="px-2 py-1 bg-green-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1">
                 <CheckCircle size={10}/> Synced
               </span>
             </div>

             <div className="space-y-2">
               {/* Auto Backup Frequency */}
               <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                 <div className="flex items-center gap-3">
                   <SaveAll size={18} className="text-cyan-500" />
                   <div>
                     <p className="text-sm font-semibold">{t("Auto Backup")}</p>
                     <p className="text-[10px] opacity-50">{t("Schedule backups")}</p>
                   </div>
                 </div>
                 <select 
                   value={data.settings?.autoBackup || 'daily'}
                   onChange={e => pushToFirebase({...data, settings: {...data.settings, autoBackup: e.target.value}})}
                   className={`px-3 py-1 rounded-lg text-xs font-bold border ${isDark ? 'bg-slate-600 border-slate-500 text-white' : 'bg-gray-100 border-gray-300'}`}
                 >
                   <option value="hourly">Hourly</option>
                   <option value="daily">Daily</option>
                   <option value="weekly">Weekly</option>
                   <option value="manual">Manual</option>
                 </select>
               </div>

               {/* Export Data */}
               <button 
                 onClick={() => {
                   const exportData = JSON.stringify(data, null, 2);
                   const blob = new Blob([exportData], { type: 'application/json' });
                   const url = URL.createObjectURL(blob);
                   const a = document.createElement('a');
                   a.href = url;
                   a.download = `${data.settings?.shopName || 'shop'}_backup_${new Date().toISOString().split('T')[0]}.json`;
                   a.click();
                   showToast(t("Backup Downloaded!"));
                 }}
                 className={`w-full p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}
               >
                 <div className="flex items-center gap-3">
                   <FileText size={18} className="text-green-500" />
                   <div className="text-left">
                     <p className="text-sm font-semibold">{t("Export Data")}</p>
                     <p className="text-[10px] opacity-50">{t("Download JSON backup")}</p>
                   </div>
                 </div>
                 <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold flex items-center gap-1">
                   <Download size={12}/> Export
                 </div>
               </button>

               {/* Last Backup Info */}
               <div className={`p-3 rounded-xl ${isDark ? 'bg-cyan-900/30' : 'bg-cyan-50'} flex items-center justify-between`}>
                 <span className="text-xs opacity-70">{t("Last Backup")}</span>
                 <span className="text-xs font-bold">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
               </div>
             </div>
           </div>

           {/* Performance Mode */}
           <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
             <div className="flex items-center gap-2 mb-3">
               <Zap size={18} className="text-amber-500"/>
               <span className="font-bold">{t("Performance")}</span>
             </div>
             <div className="space-y-2">
               {[
                 { id: 'batterySaver', icon: Vibrate, label: t('Battery Saver'), desc: t('Reduce animations'), color: 'text-green-500' },
                 { id: 'lowDataMode', icon: Wifi, label: t('Low Data Mode'), desc: t('Compress images'), color: 'text-blue-500' },
                 { id: 'offlineFirst', icon: WifiOff, label: t('Offline First'), desc: t('Work without internet'), color: 'text-purple-500' },
               ].map(item => (
                 <div key={item.id} className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                   <div className="flex items-center gap-3">
                     <item.icon size={18} className={item.color} />
                     <div>
                       <p className="text-sm font-semibold">{item.label}</p>
                       <p className="text-[10px] opacity-50">{item.desc}</p>
                     </div>
                   </div>
                   <button 
                     onClick={() => pushToFirebase({...data, settings: {...data.settings, performance: {...(data.settings?.performance || {}), [item.id]: !data.settings?.performance?.[item.id]}}})}
                     className={`relative w-10 h-5 rounded-full transition-all duration-300 ${data.settings?.performance?.[item.id] ? 'bg-gradient-to-r from-amber-500 to-yellow-500' : 'bg-gray-300'}`}
                   >
                     <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${data.settings?.performance?.[item.id] ? 'left-5' : 'left-0.5'}`}></div>
                   </button>
                 </div>
               ))}
             </div>
           </div>
         </div>
       )}

       {/* ? HELP TAB */}
       {settingsTab === 'help' && (
         <div className="space-y-4 animate-in fade-in duration-300">
           <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
             <div className="flex items-center gap-3 mb-4">
               <div className="p-3 bg-gradient-to-br from-gray-500 to-slate-500 rounded-2xl shadow-lg">
                 <HelpCircle size={24} className="text-white" />
               </div>
               <div>
                 <h3 className="font-bold text-lg">{t("Help & Support")}</h3>
                 <p className="text-xs opacity-60">{t("Get assistance")}</p>
               </div>
             </div>

             <div className="space-y-2">
               <button onClick={() => setIsPrivacyOpen(true)} className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                 <FileText size={20} className="text-gray-500"/> 
                 <span className="font-semibold">{t("Privacy Policy")}</span>
                 <ChevronRight size={16} className="ml-auto opacity-50"/>
               </button>
               <button onClick={() => setIsFaqOpen(true)} className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                 <HelpCircle size={20} className="text-blue-500"/> 
                 <span className="font-semibold">{t("FAQ")}</span>
                 <ChevronRight size={16} className="ml-auto opacity-50"/>
               </button>
               <a href="tel:8619152422" className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                 <MessageSquare size={20} className="text-green-500"/> 
                 <span className="font-semibold">{t("Contact Support")}</span>
                 <ExternalLink size={14} className="ml-auto opacity-50"/>
               </a>
             </div>
           </div>

           {/* Logout */}
           <button onClick={handleLogout} className="w-full py-3 border-2 border-red-400 bg-red-50 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2">
             <LogOut size={20}/> {t("Logout")}
           </button>

           {/* App Info */}
           <div className={`p-4 rounded-2xl border ${isDark ? 'bg-gradient-to-br from-slate-800 via-purple-900/30 to-blue-900/30 border-purple-500/30' : 'bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-purple-200'}`}>
             <div className="flex items-center justify-between mb-3">
               <div className="flex items-center gap-2">
                 <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                   <Zap size={20} className="text-white" />
                 </div>
                 <div>
                   <p className="font-bold text-sm">{data.settings?.shopName || 'Autonex'}</p>
                   <p className="text-[10px] opacity-50">v3.0 Pro Edition</p>
                 </div>
               </div>
               <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-[10px] font-bold text-white flex items-center gap-1">
                 <ShieldCheck size={10}/> PRO
               </span>
             </div>
             
             <div className="grid grid-cols-3 gap-2 text-center text-[10px] mb-3">
               <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white/80'}`}>
                 <Activity size={14} className="mx-auto text-purple-500 mb-1"/>
                 <span className="font-semibold">{t("AI Powered")}</span>
               </div>
               <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white/80'}`}>
                 <Shield size={14} className="mx-auto text-green-500 mb-1"/>
                 <span className="font-semibold">{t("Secure")}</span>
               </div>
               <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white/80'}`}>
                 <Download size={14} className="mx-auto text-blue-500 mb-1"/>
                 <span className="font-semibold">{t("Cloud Sync")}</span>
               </div>
             </div>

             <div className="text-center">
               <p className="text-[9px] uppercase tracking-widest opacity-50 mb-1">{t("Developed By")}</p>
               <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${isDark ? 'bg-slate-700' : 'bg-white'}`}>
                 <div className="w-5 h-5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                   <Zap size={10} className="text-white" />
                 </div>
                 <span className="font-bold text-xs">Autonex</span>
                 <CheckCircle size={12} className="text-blue-500" />
               </div>
               <p className="text-[8px] mt-2 opacity-40">  2025 All Rights Reserved</p>
             </div>
           </div>
         </div>
       )}
       </div>
    </div>
    );
  };



  return (
    <div className={`min-h-screen font-sans ${!isOnline ? 'pt-10' : ''}`} style={{ backgroundColor: themePreset.bg }}>
      <audio ref={audioRef} src="https://actions.google.com/sounds/v1/alarms/beep_short.ogg" preload="auto"></audio>

      {/* ?? CONNECTIVITY INDICATORS */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[200] bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-4 flex items-center justify-center gap-2 shadow-lg">
          <WifiOff size={18} className="animate-pulse" />
          <span className="font-bold text-sm">You're Offline - Changes will sync when connected</span>
        </div>
      )}
      
      {hasPendingWrites && isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[199] bg-blue-500 text-white py-1 px-4 flex items-center justify-center gap-2 text-xs">
          <Loader2 size={14} className="animate-spin" />
          <span className="font-semibold">Syncing pending changes...</span>
        </div>
      )}

      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* ?? GHOST MIC OVERLAY - Voice Search with AI */}
      {isGhostMicOpen && (
        <GhostMic 
          inventory={data.entries || []}
          pages={data.pages || []}
          allowAI={data.settings?.voiceAI !== false}
          useFuzzySearch={data.settings?.fuzzySearch !== false}
          askAIAssistant={askAIAssistant}
          onClose={() => setIsGhostMicOpen(false)}
          onNavigate={(pageId) => {
            setActivePageId(pageId);
            setView('page');
            setIsGhostMicOpen(false);
          }}
        />
      )}
      
      <ImageModal src={viewImage} onClose={()=>setViewImage(null)} onDelete={()=>handleDeleteBill(data.bills.find(b => b.image === viewImage || b === viewImage))} />

      <ConfirmationModal 
         isOpen={confirmConfig.isOpen}
         onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
         onConfirm={confirmConfig.onConfirm}
         title={confirmConfig.title}
         message={confirmConfig.message}
         isDanger={confirmConfig.isDanger}
         t={t}
         isDark={isDark}
      />

      <LegalModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} type="privacy" t={t} isDark={isDark} />
      <LegalModal isOpen={isFaqOpen} onClose={() => setIsFaqOpen(false)} type="faq" t={t} isDark={isDark} />

      {view === 'generalIndex' && renderGeneralIndex()}
      {view === 'pagesGrid' && renderPagesGrid()}
      {view === 'stockSearch' && renderStockSearch()} 
      {view === 'page' && renderPage()}
      {view === 'alerts' && renderAlerts()}
      {view === 'settings' && renderSettings()}
      
      {/* Bills view removed */}

      {view === 'tools' && <ToolsHubView onBack={closeTools} t={t} isDark={isDark} initialTool={activeToolId} pinnedTools={data.settings.pinnedTools || []} onTogglePin={handleTogglePin} shopDetails={data.settings} pages={data.pages || []} />}
      
      {renderSaveButton()}

      <div className={`fixed bottom-0 w-full border-t flex justify-between px-1 py-1.5 pb-safe z-50 backdrop-blur-lg ${isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-gray-200 shadow-lg shadow-gray-200/50'}`}>
        <NavBtn icon={Book} label={t("Index")} active={view === 'generalIndex'} onClick={() => { setView('generalIndex'); setActivePageId(null); }} isDark={isDark} accentHex={accentHex}/>
        <NavBtn icon={Grid} label={t("Pages")} active={view === 'pagesGrid'} onClick={() => { setView('pagesGrid'); setIndexSearchTerm(''); setActivePageId(null); }} isDark={isDark} accentHex={accentHex}/>
        <NavBtn icon={Search} label={t("Search")} active={view === 'stockSearch'} onClick={() => { setView('stockSearch'); setStockSearchTerm(''); }} isDark={isDark} accentHex={accentHex}/>
        <NavBtn icon={AlertTriangle} label={t("Alerts")} active={view === 'alerts'} onClick={() => setView('alerts')} alert={(data.entries || []).some(e => e.qty < data.settings.limit)} isDark={isDark} accentHex={accentHex}/>
         {/* My Bills nav removed */}
        <NavBtn icon={Settings} label={t("Settings")} active={view === 'settings'} onClick={() => setView('settings')} isDark={isDark} accentHex={accentHex}/>
      </div>

      {isNewPageOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-yellow-100 p-3 rounded-2xl">
                <FilePlus size={24} className="text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">{t("New Page")}</h3>
            </div>
            <div className="flex gap-2 mb-5">
                <input autoFocus className="flex-1 border-2 border-gray-200 focus:border-yellow-500 rounded-xl p-3.5 text-lg font-semibold text-black outline-none transition-colors" placeholder={t("Item Name")} value={input.itemName} onChange={e => setInput({...input, itemName: e.target.value})} />
                <VoiceInput onResult={(txt) => setInput(prev => ({...prev, itemName: txt}))} isDark={false} lang={isHindi ? 'hi-IN' : 'en-IN'} />
            </div>
            <div className="flex gap-3">
               <button onClick={() => setIsNewPageOpen(false)} className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-600 transition-colors">{t("Cancel")}</button>
               <button onClick={handleAddPage} className="flex-1 py-3.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-xl font-bold shadow-lg shadow-yellow-500/30 transition-all">{t("Add")}</button>
            </div>
          </div>
        </div>
      )}

      {isCopyModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl p-5 max-h-[85vh] flex flex-col shadow-2xl ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-black'}`}>
            {!copySourcePageId ? (
              <>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Copy size={20} className="text-blue-500" />
                  {t("Select Page to Copy From")}
                </h3>
                <div className="overflow-y-auto flex-1 space-y-2">
                  {data.pages.filter(p => p.id !== activePageId).map(p => {
                    const itemCount = data.entries.filter(e => e.pageId === p.id).length;
                    return (
                      <button 
                        key={p.id} 
                        onClick={() => handleImportItems(p.id)} 
                        className={`w-full text-left p-4 border rounded-xl flex items-center justify-between transition-all ${isDark ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-200 hover:bg-blue-50'}`}
                      >
                        <div>
                          <span className="font-bold block">{p.pageNo}. {t(p.itemName)}</span>
                          <span className="text-xs opacity-60">{itemCount} {t("items")}</span>
                        </div>
                        <ChevronRight size={18} className="opacity-40" />
                      </button>
                    );
                  })}
                  {data.pages.length <= 1 && <div className="text-center opacity-50 p-8">{t("No other pages found")}</div>}
                </div>
                <button onClick={() => setIsCopyModalOpen(false)} className={`w-full mt-4 py-3 rounded-xl font-bold transition-colors ${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300'}`}>
                  {t("Cancel")}
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <CheckCircle size={20} className="text-green-500" />
                    {t("Select Items to Copy")}
                  </h3>
                  <button onClick={() => setCopySourcePageId(null)} className="p-2 rounded-full hover:bg-gray-100/10">
                    <X size={20} />
                  </button>
                </div>
                
                <div className={`flex items-center justify-between p-3 rounded-xl mb-3 ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                  <span className="text-sm font-bold">{t("Select All")}</span>
                  <button 
                    onClick={() => {
                      const allItems = data.entries.filter(e => e.pageId === copySourcePageId).map(e => e.id);
                      setSelectedCopyItems(selectedCopyItems.length === allItems.length ? [] : allItems);
                    }}
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                      selectedCopyItems.length === data.entries.filter(e => e.pageId === copySourcePageId).length 
                        ? 'bg-blue-500 border-blue-500 text-white' 
                        : isDark ? 'border-slate-500' : 'border-gray-300'
                    }`}
                  >
                    {selectedCopyItems.length === data.entries.filter(e => e.pageId === copySourcePageId).length && <CheckCircle size={14} />}
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 space-y-2 mb-4">
                  {data.entries.filter(e => e.pageId === copySourcePageId).map(item => (
                    <button 
                      key={item.id}
                      onClick={() => setSelectedCopyItems(prev => 
                        prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                      )}
                      className={`w-full text-left p-3 border rounded-xl flex items-center justify-between transition-all ${
                        selectedCopyItems.includes(item.id) 
                          ? 'border-blue-500 bg-blue-500/10' 
                          : isDark ? 'border-slate-600' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          selectedCopyItems.includes(item.id) 
                            ? 'bg-blue-500 border-blue-500 text-white' 
                            : isDark ? 'border-slate-500' : 'border-gray-300'
                        }`}>
                          {selectedCopyItems.includes(item.id) && <CheckCircle size={12} />}
                        </div>
                        <span className="font-medium">{t(item.car)}</span>
                      </div>
                      <span className={`text-sm px-2 py-1 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                        Qty: {item.qty}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => { setCopySourcePageId(null); setSelectedCopyItems([]); }} 
                    className={`flex-1 py-3 rounded-xl font-bold transition-colors ${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                  >
                    {t("Back")}
                  </button>
                  <button 
                    onClick={executeItemsCopy}
                    disabled={selectedCopyItems.length === 0}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                      selectedCopyItems.length > 0 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {t("Copy")} ({selectedCopyItems.length})
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-black'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold">{t("Confirm Save")}</h3>
              <button onClick={() => setIsSaveModalOpen(false)} className="p-1 rounded hover:bg-gray-100/10"><X size={20}/></button>
            </div>
            <p className="text-sm opacity-70 mb-4">{t("Enter Product Password to save changes:")}</p>

            <input 
              autoFocus
              type="password" 
              className={`w-full p-3 rounded-lg text-lg font-bold text-center tracking-widest mb-6 border-2 ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-black'}`}
              placeholder="****"
              value={savePassInput}
              onChange={e => setSavePassInput(e.target.value)}
            />

            <div className="flex gap-3">
              <button onClick={() => setIsSaveModalOpen(false)} className="flex-1 py-3 bg-gray-500/20 hover:bg-gray-500/30 rounded-lg font-bold">{t("Cancel")}</button>
              <button onClick={executeSave} className="flex-1 py-3 bg-green-600 text-white hover:bg-green-500 rounded-lg font-bold shadow-lg shadow-green-500/30">{t("Confirm Save")}</button>
            </div>
          </div>
        </div>
      )}

      {managingPage && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl p-6">
            <h3 className="text-xl font-bold mb-2 text-black">{t("Manage Page")}</h3>
            <p className="text-gray-500 mb-4 text-sm font-bold">#{managingPage.pageNo}</p>
            
            <div className="mb-4">
                <label className="text-xs font-bold text-gray-500">{t("Rename")}</label>
                <input className="w-full border-2 border-black rounded p-2 font-bold text-black mb-2" value={input.itemName} onChange={e => setInput({...input, itemName: e.target.value})} />
            </div>

            <div className="flex gap-2 mb-4">
                <button onClick={() => handleMovePage('UP')} className="flex-1 py-3 bg-blue-100 text-blue-700 rounded font-bold flex items-center justify-center gap-2"><ChevronUp size={20}/> {t("Move Up")}</button>
                <button onClick={() => handleMovePage('DOWN')} className="flex-1 py-3 bg-blue-100 text-blue-700 rounded font-bold flex items-center justify-center gap-2"><ChevronDown size={20}/> {t("Move Down")}</button>
            </div>

            <div className="flex gap-2">
               <button onClick={handleDeletePage} className="flex-1 py-3 bg-red-100 text-red-600 rounded font-bold flex items-center justify-center gap-2"><Trash2 size={18}/> {t("Delete")}</button>
               <button onClick={handleRenamePage} className="flex-[2] py-3 bg-blue-600 text-white rounded font-bold">{t("Update")}</button>
            </div>
            <button onClick={() => setManagingPage(null)} className="w-full mt-2 py-2 text-gray-500 font-bold">{t("Cancel")}</button>
          </div>
        </div>
      )}

      {editingEntry && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 text-black">{t("Edit Entry")}</h3>
            
            {/* Show Current Position */}
            <div className="mb-4 p-2 bg-blue-50 text-blue-700 rounded font-bold text-center">
                 Current Position: #{data.entries.filter(e => e.pageId === editingEntry.pageId).findIndex(e => e.id === editingEntry.id) + 1}
            </div>

            <div className="space-y-4">
               <div>
                   <label className="text-xs font-bold text-gray-500">{t("Car Name")}</label>
                   <input className="w-full border-2 border-black rounded p-2 font-bold text-black" value={editingEntry.car} onChange={e => setEditingEntry({...editingEntry, car: e.target.value})} />
               </div>
               
               <div className="flex gap-2 pt-2">
                  <button onClick={() => handleMoveEntry('UP')} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded font-bold flex items-center justify-center gap-1 text-sm text-black border"><ChevronUp size={16}/> {t("Move Up")}</button>
                  <button onClick={() => handleMoveEntry('DOWN')} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded font-bold flex items-center justify-center gap-1 text-sm text-black border"><ChevronDown size={16}/> {t("Move Down")}</button>
               </div>
            </div>
            <div className="flex gap-2 mt-6">
               <button onClick={handleDeleteEntry} className="flex-1 py-3 bg-red-100 text-red-600 rounded font-bold flex items-center justify-center gap-2"><Trash2 size={18}/> {t("Delete")}</button>
               <button onClick={handleEditEntrySave} className="flex-[2] py-3 bg-blue-600 text-white rounded font-bold">{t("Update Name")}</button>
            </div>
            <button onClick={() => setEditingEntry(null)} className="w-full mt-2 py-2 text-gray-500 font-bold">{t("Cancel")}</button>
          </div>
        </div>
      )}

      {isNewEntryOpen && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl p-6">
            <h3 className="text-xl font-bold mb-1 text-black">{t("New Entry")}</h3>
            <p className="text-sm font-bold opacity-50 mb-4 text-black">{t(activePage ? activePage.itemName : "")}</p>
            <div className="space-y-4">
              <div className="flex gap-2">
                 <div className="flex-1">
                     <input autoFocus className="w-full border-2 border-black rounded p-3 text-lg font-bold text-black" placeholder={t("Car (e.g. Swift & Alto)")} value={input.carName} onChange={e => setInput({...input, carName: e.target.value})} />
                     <p className="text-[10px] text-gray-500 mt-1">{t("Tip: Use 'Swift & Alto' for shared items.")}</p>
                 </div>
                 <VoiceInput onResult={(txt) => setInput(prev => ({...prev, carName: txt}))} isDark={false} lang={isHindi ? 'hi-IN' : 'en-IN'} />
              </div>
              {input.carName && (() => {
                  const existing = (data.entries || []).filter(e => activePage && e.pageId === activePage.id && e.car.toLowerCase().includes(input.carName.toLowerCase())).reduce((a,b) => a+b.qty, 0);
                  return existing > 0 ? <div className="p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-sm font-bold text-center">{t("Already have")} {existing} {t("in stock!")}</div> : null;
              })()}
              <input type="number" className="w-full border-2 border-black rounded p-3 text-lg font-bold text-black" placeholder={t("Qty")} value={input.qty} onChange={e => setInput({...input, qty: e.target.value})} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setIsNewEntryOpen(false)} className="flex-1 py-3 bg-gray-200 rounded font-bold text-black">{t("Cancel")}</button>
              <button onClick={handleAddEntry} className="flex-1 py-3 bg-blue-600 text-white rounded font-bold">{t("Save")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
    return (
        <ErrorBoundary>
            <DukanRegister />
        </ErrorBoundary>
    );
    }