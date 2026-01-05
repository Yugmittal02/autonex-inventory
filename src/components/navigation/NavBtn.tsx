import React from 'react';

type NavBtnProps = {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
  alert?: boolean;
  isDark: boolean;
  accentHex: string;
};

const hexToRgba = (hex: string, alpha: number): string => {
  const h = hex.replace('#', '').trim();
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function NavBtn({ icon, label, active, onClick, alert, isDark, accentHex }: NavBtnProps) {
  return (
    <button
      onClick={onClick}
      className={`relative flex-1 flex flex-col items-center py-2 px-1 rounded-2xl transition-all duration-200 ${
        active
          ? isDark
            ? ''
            : 'shadow-sm'
          : isDark
            ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
      }`}
      style={
        active
          ? {
              color: accentHex,
              backgroundColor: isDark ? hexToRgba(accentHex, 0.16) : hexToRgba(accentHex, 0.14),
            }
          : undefined
      }
    >
      <div
        className="p-1.5 rounded-xl transition-all"
        style={active ? { backgroundColor: isDark ? hexToRgba(accentHex, 0.22) : hexToRgba(accentHex, 0.18) } : undefined}
      >
        {icon && React.createElement(icon, { size: 22, strokeWidth: active ? 2.5 : 2 })}
      </div>
      <span className={`text-[9px] font-bold mt-0.5 text-center leading-none ${active ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
      {alert && (
        <span className="absolute top-0 right-2 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
        </span>
      )}
    </button>
  );
}
