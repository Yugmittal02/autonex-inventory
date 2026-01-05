import React, { useState } from 'react';
import { Mic } from 'lucide-react';

const VoiceInput = ({ onResult, isDark, lang = 'en-IN' }) => {
  const [isListening, setIsListening] = useState(false);
  const [hasError, setHasError] = useState(false);

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = lang;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event) => {
          const transcript = event?.results?.[0]?.[0]?.transcript;
          if (transcript) onResult(transcript);
        };
        recognition.onerror = () => {
          setHasError(true);
          setIsListening(false);
          setTimeout(() => setHasError(false), 2000);
        };

        recognition.start();
      } catch (e) {
        console.error(e);
        setHasError(true);
        setIsListening(false);
        setTimeout(() => setHasError(false), 2000);
      }
    } else {
      alert('Voice input not supported in this browser. Please type manually.');
    }
  };

  return (
    <button
      onClick={startListening}
      disabled={isListening}
      className={`p-3 rounded-full shrink-0 transition-all ${
        isListening
          ? 'bg-red-500 text-white animate-pulse'
          : hasError
            ? 'bg-yellow-500 text-white'
            : isDark
              ? 'bg-slate-700 text-white hover:bg-slate-600'
              : 'bg-gray-100 text-black hover:bg-gray-200'
      }`}
    >
      <Mic size={20} className={isListening ? 'animate-bounce' : ''} />
    </button>
  );
};

export default VoiceInput;