import React from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-slate-950 text-white p-10 z-[100] fixed inset-0">
      <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-in fade-in duration-700">
        <div className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl">
            <img src="/myicon.svg" alt="StoreLink" className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black tracking-widest text-white mb-2 drop-shadow-2xl">STORELINK</h1>
          <div className="h-1.5 w-32 bg-blue-600 mx-auto rounded-full shadow-[0_0_15px_rgba(37,99,235,0.8)]"></div>
        </div>
        
        <div className="relative">
           <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full"></div>
           <Loader2 size={48} className="text-blue-500 animate-spin relative z-10" />
        </div>
        
        <p className="text-slate-400 text-sm font-mono animate-pulse">Initializing...</p>
      </div>
      
      <div className="flex items-center gap-2 opacity-60 mb-8">
         <ShieldCheck size={16} className="text-green-500"/>
         <span className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500">Secured</span>
      </div>
    </div>
  );
};

export default LoadingScreen;