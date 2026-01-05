import React from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';

type ConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isDanger?: boolean;
  t: (text: string) => string;
  isDark: boolean;
};

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isDanger = false,
  t,
  isDark,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[90] flex items-center justify-center p-4 animate-in fade-in">
      <div
        className={`w-full max-w-sm rounded-2xl p-6 shadow-2xl transform transition-all scale-100 ${
          isDark ? 'bg-slate-800 text-white' : 'bg-white text-black'
        }`}
      >
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
            isDanger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
          }`}
        >
          {isDanger ? <Trash2 size={24} /> : <AlertCircle size={24} />}
        </div>
        <h3 className="text-xl font-bold mb-2">{t(title)}</h3>
        <p className="text-sm opacity-70 mb-6 font-medium">{t(message)}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={`flex-1 py-3 rounded-xl font-bold transition-colors ${
              isDark
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {t('Cancel')}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${
              isDanger
                ? 'bg-red-600 hover:bg-red-500 shadow-red-500/30'
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/30'
            }`}
          >
            {t(isDanger ? 'Yes, Delete' : 'Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
