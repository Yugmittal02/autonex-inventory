import React from 'react';
import { Book, Grid, Search, AlertTriangle, Camera, Settings } from 'lucide-react';

const NavBtn = ({ icon: Icon, label, active, onClick, alert = false }: any) => (
  <button onClick={onClick} className={`relative flex-1 flex flex-col items-center p-2 rounded-xl transition-all ${active ? 'text-blue-600 bg-blue-50 dark:bg-slate-800 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'}`}>
    <Icon size={24} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] font-bold mt-1 text-center leading-none">{label}</span>
    {alert && <span className="absolute top-1 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-bounce"></span>}
  </button>
);

const Navbar = ({ view, setView, hasAlert, isDark, t, resetStates }: any) => {
  const handleNav = (newView) => {
    setView(newView);
    if(resetStates) resetStates();
  };

  return (
      <div className={`fixed bottom-0 w-full border-t flex justify-between px-2 p-2 pb-safe z-50 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-300'}`}>
         <NavBtn icon={Book} label={t("Index")} active={view === 'generalIndex'} onClick={() => handleNav('generalIndex')} isDark={isDark}/>
         <NavBtn icon={Grid} label={t("Pages")} active={view === 'pagesGrid'} onClick={() => handleNav('pagesGrid')} isDark={isDark}/>
         <NavBtn icon={Search} label={t("Search")} active={view === 'stockSearch'} onClick={() => handleNav('stockSearch')} isDark={isDark}/>
         <NavBtn icon={AlertTriangle} label={t("Alerts")} active={view === 'alerts'} onClick={() => setView('alerts')} alert={hasAlert} isDark={isDark}/>
         <NavBtn icon={Camera} label={t("Camera")} active={view === 'bills'} onClick={() => setView('bills')} isDark={isDark}/>
         <NavBtn icon={Settings} label={t("Settings")} active={view === 'settings'} onClick={() => setView('settings')} isDark={isDark}/>
      </div>
  );
};
export default Navbar;