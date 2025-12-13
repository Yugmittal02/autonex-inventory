import React, { useEffect } from 'react';
import { Trash2, AlertCircle, X, CheckCircle, XCircle, Mic, AlertTriangle, RefreshCw, FileText, HelpCircle, Plus, Minus, Edit } from 'lucide-react';

export const ToastMessage = ({ message, type, onClose }) => {
  useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-[100] flex items-center gap-3 transition-all transform animate-in fade-in slide-in-from-top-4 border-2 border-white/20 ${type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
       {type === 'error' ? <XCircle size={22} className="shrink-0"/> : <CheckCircle size={22} className="shrink-0"/>}
       <span className="font-bold text-sm md:text-base whitespace-nowrap">{message}</span>
    </div>
  );
};

export const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, isDanger, t, isDark }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 z-[90] flex items-center justify-center p-4 animate-in fade-in">
        <div className={`w-full max-w-sm rounded-2xl p-6 shadow-2xl transform transition-all scale-100 ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-black'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDanger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                {isDanger ? <Trash2 size={24}/> : <AlertCircle size={24}/>}
            </div>
            <h3 className="text-xl font-bold mb-2">{t(title)}</h3>
            <p className="text-sm opacity-70 mb-6 font-medium">{t(message)}</p>
            <div className="flex gap-3">
                <button onClick={onClose} className={`flex-1 py-3 rounded-xl font-bold transition-colors ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>{t("Cancel")}</button>
                <button onClick={onConfirm} className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${isDanger ? 'bg-red-600 hover:bg-red-500 shadow-red-500/30' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/30'}`}>{t(isDanger ? "Yes, Delete" : "Confirm")}</button>
            </div>
        </div>
    </div>
  );
};

export const LegalModal = ({ isOpen, onClose, type, t, isDark }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
        <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-black'}`}>
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="text-xl font-bold flex items-center gap-2">{type === 'privacy' ? <FileText className="text-blue-500"/> : <HelpCircle className="text-yellow-500"/>}{type === 'privacy' ? t("Privacy & Policy") : t("FAQ")}</h3>
                <button onClick={onClose}><X size={24}/></button>
            </div>
            {type === 'privacy' ? (
                <div className="space-y-4 text-sm opacity-80 leading-relaxed"><p><strong>Last Updated:</strong> Oct 2025</p><p>1. Data Security: Your data is stored securely on Google Firebase.</p></div>
            ) : (
                <div className="space-y-4"><div className="border rounded-lg p-3"><p className="font-bold text-blue-500 mb-1">Q: Add Item?</p><p className="text-sm opacity-80">A: Click (+) on a Page.</p></div></div>
            )}
        </div>
      </div>
    );
};

export const VoiceInput = ({ onResult, isDark }) => {
  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN'; 
      recognition.onresult = (e) => onResult(e.results[0][0].transcript);
      try { recognition.start(); } catch (e) { console.error(e); }
    } else { alert("Mic Error"); }
  };
  return <button onClick={startListening} className={`p-3 rounded-full shrink-0 ${isDark ? 'bg-slate-700 text-white' : 'bg-gray-100 text-black hover:bg-gray-200'}`}><Mic size={20}/></button>;
};

export const EntryRow = React.memo(({ entry, t, isDark, onUpdateBuffer, onEdit, limit, tempQty, index }) => {
    const displayQty = tempQty !== undefined ? tempQty : entry.qty;
    const isChanged = tempQty !== undefined;
    return (
        <div className={`flex items-center px-3 py-2 border-b ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
            <div className="w-6 text-xs font-bold opacity-40">#{index + 1}</div>
            <div className="flex-[2] text-base font-bold truncate pr-2 leading-tight">{t(entry.car)}</div>
            <div className="flex items-center justify-center gap-3 bg-gray-50 rounded-lg p-1 border border-gray-100">
                <button onClick={() => onUpdateBuffer(entry.id, -1, entry.qty)} className="w-8 h-8 rounded bg-white border shadow-sm text-red-600 flex items-center justify-center active:bg-red-100"><Minus size={16}/></button>
                <span className={`text-lg font-mono font-bold w-8 text-center ${isChanged ? 'text-blue-500' : (displayQty < limit ? 'text-red-500 animate-pulse' : 'text-slate-700')}`}>{displayQty}</span>
                <button onClick={() => onUpdateBuffer(entry.id, 1, entry.qty)} className="w-8 h-8 rounded bg-white border shadow-sm text-green-600 flex items-center justify-center active:bg-green-100"><Plus size={16}/></button>
            </div>
            <button onClick={() => onEdit(entry)} className="ml-3 p-2 text-gray-400 hover:text-blue-500 bg-gray-50 rounded-full border border-gray-100"><Edit size={16}/></button>
        </div>
    );
});

export const NavBtn = ({ icon: Icon, label, active, onClick, alert, isDark }) => (
  <button onClick={onClick} className={`relative flex-1 flex flex-col items-center p-2 rounded-xl transition-all ${active ? 'text-blue-600 bg-blue-50 dark:bg-slate-800 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'}`}>
    <Icon size={24} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] font-bold mt-1 text-center leading-none">{label}</span>
    {alert && <span className="absolute top-1 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-bounce"></span>}
  </button>
);