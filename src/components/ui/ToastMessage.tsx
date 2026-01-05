import React, { useEffect } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';

type ToastMessageProps = {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
};

export const ToastMessage: React.FC<ToastMessageProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-2xl z-[100] flex items-center gap-3 transition-all transform border backdrop-blur-sm ${
        type === 'error'
          ? 'bg-red-600/95 text-white border-red-400/30 shadow-red-500/25'
          : 'bg-green-600/95 text-white border-green-400/30 shadow-green-500/25'
      }`}
      style={{ animation: 'slideDown 0.3s ease-out' }}
    >
      <div className={`p-1.5 rounded-full ${type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
        {type === 'error' ? (
          <XCircle size={18} className="shrink-0" />
        ) : (
          <CheckCircle size={18} className="shrink-0" />
        )}
      </div>
      <span className="font-semibold text-sm md:text-base">{message}</span>
      <button onClick={onClose} className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors">
        <X size={16} />
      </button>
    </div>
  );
};

export default ToastMessage;
