import React, { useState, useEffect, useCallback } from 'react';
import { Mic, X, Zap } from 'lucide-react';
import { performSmartSearch } from '../search/smartSearch';

type GhostMicProps = {
  inventory: any[];
  pages: any[];
  onClose: () => void;
  onNavigate: (pageId: string) => void;
  allowAI?: boolean;
  useFuzzySearch?: boolean;
  askAIAssistant: (question: string, language: string) => Promise<string>;
};

export const GhostMic = ({
  inventory,
  pages,
  onClose,
  onNavigate,
  allowAI = true,
  useFuzzySearch = true,
  askAIAssistant,
}: GhostMicProps) => {
  const [status, setStatus] = useState('Listening...');
  const [resultText, setResultText] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [aiResponse, setAiResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<'search' | 'ai'>('search');

  // Detect language from text
  const detectLanguage = (text: string): string => {
    const isHindi =
      /[\u0900-\u097F]/.test(text) ||
      /\b(kya|hai|kaise|kahan|kaun|kitna|batao|bolo|dhundo|dekho|mein|ka|ki|ke)\b/i.test(text);
    return isHindi ? 'hi' : 'en';
  };

  const resolveResponseLanguage = (transcript: string, detectedLang: string) => {
    return detectedLang;
  };

  // Text to Speech Helper
  const speak = useCallback((text: string, lang: string = 'en') => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.rate = lang === 'hi' ? 0.9 : 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  useEffect(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      setStatus('🚫 Browser not supported');
      speak('Sorry, voice search not supported on this browser.', 'en');
      setTimeout(onClose, 2000);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      if (navigator.vibrate) navigator.vibrate(200);
      setStatus('🎧 Listening...');
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setResultText(transcript);
      setStatus('🔍 Processing...');
      setIsProcessing(true);

      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

      const detectedLang = detectLanguage(transcript);
      const responseLang = resolveResponseLanguage(transcript, detectedLang);

      // Try stock search
      const stockResult = performSmartSearch(transcript, inventory, pages, { useFuzzy: useFuzzySearch });

      if (stockResult.match && stockResult.items.length > 0) {
        setMode('search');
        setSearchResult(stockResult);
        const topItem = stockResult.items[0];
        const count = stockResult.items.length;

        const msg =
          detectedLang === 'hi'
            ? `${topItem.car} मिला। मात्रा ${topItem.qty} ${count > 1 ? `और ${count - 1} और भी है` : ''}`
            : `Found ${topItem.car}. Quantity is ${topItem.qty}. ${count > 1 ? `Plus ${count - 1} more items.` : ''}`;

        setStatus(`✅ ${count} item${count > 1 ? 's' : ''} found!`);
        speak(msg, detectedLang);
      } else {
        setMode('ai');
        setStatus('🤖 AI Thinking...');

        try {
          if (!allowAI) {
            const msg =
              responseLang === 'hi'
                ? 'AI बंद है। कृपया "Voice AI Commands" को चालू करें सेटिंग्स में जाकर।'
                : 'AI is turned off. Enable Voice AI Commands in Settings, or search for stock.';
            setAiResponse(msg);
            setStatus('⚠️ AI Off');
            speak(msg, responseLang);
          } else {
            const aiAnswer = await askAIAssistant(transcript, responseLang);
            setAiResponse(aiAnswer);
            setStatus('💡 AI Response');
            speak(aiAnswer, responseLang);
          }
        } catch {
          const fallback =
            responseLang === 'hi'
              ? 'माफ कीजिए, जवाब नहीं मिला। कृपया दोबारा कोशिश करें।'
              : 'Sorry, could not find an answer. Please try again.';
          setAiResponse(fallback);
          setStatus('💡 AI Response');
          speak(fallback, responseLang);
        }
      }

      setIsProcessing(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        setStatus('🔇 No speech detected');
        speak('Did not hear anything. Please try again.', 'en');
      } else {
        setStatus(`❌ Error: ${event.error}`);
      }
      setTimeout(onClose, 2000);
    };

    recognition.onend = () => {};

    try {
      recognition.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
      setStatus('❌ Failed to start');
    }

    return () => {
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
      window.speechSynthesis.cancel();
    };
  }, [inventory, pages, speak, onClose, allowAI, useFuzzySearch, askAIAssistant]);

  const handleItemClick = (item: any) => {
    const page = pages.find((p: any) => p.id === item.pageId);
    if (page) {
      onNavigate(page.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center text-white animate-in fade-in p-4">
      {/* Pulsing Visual */}
      <div className="relative mb-8">
        <div
          className={`absolute inset-0 bg-blue-500 blur-3xl ${
            isProcessing ? 'animate-ping' : 'animate-pulse'
          } opacity-40`}
        ></div>
        <div
          className={`w-28 h-28 bg-slate-800 rounded-full border-4 ${
            mode === 'ai' && aiResponse
              ? 'border-purple-500'
              : searchResult?.match
              ? 'border-green-500'
              : searchResult
              ? 'border-red-500'
              : 'border-blue-500'
          } flex items-center justify-center relative z-10 shadow-2xl`}
        >
          <Mic
            size={44}
            className={`${
              isProcessing
                ? 'text-yellow-400 animate-bounce'
                : mode === 'ai' && aiResponse
                ? 'text-purple-400'
                : searchResult?.match
                ? 'text-green-400'
                : 'text-blue-400'
            }`}
          />
        </div>
      </div>

      <h2 className="text-xl font-black tracking-wider uppercase mb-2">{status}</h2>

      {resultText && (
        <div className="bg-slate-800/50 px-4 py-2 rounded-full border border-slate-600 mb-4">
          <p className="text-lg font-mono text-yellow-400">"{resultText}"</p>
        </div>
      )}

      {searchResult?.interpretedAs && searchResult.interpretedAs !== resultText.toLowerCase() && (
        <p className="text-xs text-slate-400 mb-4">
          Interpreted as: <span className="text-blue-400">{searchResult.interpretedAs}</span>
        </p>
      )}

      {/* AI Response Display */}
      {mode === 'ai' && aiResponse && (
        <div className="w-full max-w-md bg-gradient-to-br from-purple-900/50 to-indigo-900/50 p-4 rounded-2xl border border-purple-500/50 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="text-xs font-bold text-purple-300 uppercase">Autonex AI</span>
          </div>
          <p className="text-white text-base leading-relaxed">{aiResponse}</p>
        </div>
      )}

      {/* Stock Results List */}
      {mode === 'search' && searchResult?.match && (
        <div className="w-full max-w-md max-h-60 overflow-y-auto space-y-2 mt-4">
          {searchResult.items.slice(0, 5).map((item: any) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="bg-slate-800/80 p-4 rounded-xl border border-slate-600 flex justify-between items-center cursor-pointer hover:bg-slate-700 transition-colors"
            >
              <div>
                <p className="font-bold text-lg">{item.car}</p>
                <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
                  {item.pageName || 'Unknown'}
                </span>
              </div>
              <div className="text-right">
                <span className={`block text-2xl font-bold ${item.qty < 5 ? 'text-red-400' : 'text-green-400'}`}>
                  {item.qty}
                </span>
                <span className="text-[10px] text-slate-500">Pcs</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onClose}
        className="mt-8 px-8 py-3 border border-white/20 rounded-full text-sm font-bold bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2"
      >
        <X size={16} /> Close
      </button>
    </div>
  );
};

export default GhostMic;
