export {};

declare global {
  interface Window {
    __dukan_tabId?: string;
    __dukan_dumpDiagnostics?: () => unknown;
    __dukan_exportData?: () => void;
    html2canvas?: (element: HTMLElement, options?: any) => Promise<HTMLCanvasElement>;
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }

  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
      outcome: 'accepted' | 'dismissed';
      platform: string;
    }>;
    prompt(): Promise<void>;
  }
}

declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (swRegistration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: unknown) => void;
  }

  export function registerSW(options?: RegisterSWOptions): () => void;
}

// Note: `convertToHindi` is exported from `src/utils/translator.ts`.
// Avoid redeclaring it here to prevent duplicate symbol errors.


