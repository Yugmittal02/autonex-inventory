import React, { useState, useCallback, useRef } from 'react';
import { Mic } from 'lucide-react';
import { applySynonyms } from '../../features/search/smartSearch';

type VoiceInputProps = {
  onResult: (transcript: string) => void;
  isDark: boolean;
  lang?: string;
};

export const VoiceInput: React.FC<VoiceInputProps> = ({ onResult, isDark, lang = 'en-IN' }) => {
  const [isListening, setIsListening] = useState(false);
  const [hasError, setHasError] = useState(false);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const stopAudioStream = useCallback(() => {
    const stream = audioStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
  }, []);

  const startListening = useCallback(async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input not supported in this browser. Please type manually.');
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = lang;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      try {
        if (navigator.mediaDevices?.getUserMedia) {
          audioStreamRef.current = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            } as MediaTrackConstraints,
          });
        }
      } catch (err) {
        console.warn('getUserMedia constraints failed:', err);
      }

      recognition.onstart = () => {
        setIsListening(true);
        setHasError(false);
        if (navigator.vibrate) navigator.vibrate(100);
      };

      recognition.onresult = (e: any) => {
        const transcript = e?.results?.[0]?.[0]?.transcript || '';
        onResult(applySynonyms(transcript));
        setIsListening(false);
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
        stopAudioStream();
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e?.error);
        setIsListening(false);
        stopAudioStream();

        if (e?.error === 'no-speech') {
          setHasError(false);
          return;
        }

        setHasError(true);
        setTimeout(() => setHasError(false), 2000);
      };

      recognition.onend = () => {
        setIsListening(false);
        stopAudioStream();
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
      setHasError(true);
      stopAudioStream();
      setTimeout(() => setHasError(false), 2000);
    }
  }, [lang, onResult, stopAudioStream]);

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
      aria-label="Voice input"
      type="button"
    >
      <Mic size={20} className={isListening ? 'animate-bounce' : ''} />
    </button>
  );
};

export default VoiceInput;
