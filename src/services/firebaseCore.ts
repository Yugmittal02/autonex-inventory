import { initializeApp } from 'firebase/app';
import {
  CACHE_SIZE_UNLIMITED,
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDDer9o6DqRuFVSQwRcq0BqvDkc72oKSRk',
  authDomain: 'arvindregister-353e5.firebaseapp.com',
  projectId: 'arvindregister-353e5',
  storageBucket: 'arvindregister-353e5.firebasestorage.app',
  messagingSenderId: '557116649734',
  appId: '1:557116649734:web:822bbad24cca3274012e87',
  measurementId: 'G-79C2SNJC56',
};

export const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firestore with modern cache settings (fixes deprecation warning)
export const db = (() => {
  try {
    // Try persistent multi-tab cache first
    const firestore = initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
        cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      }),
    });
    console.info('? Firestore initialized with persistent multi-tab cache');
    return firestore;
  } catch (err: any) {
    // If IndexedDB has version issues, clear it and use memory cache
    if (err?.message?.includes('not compatible') || err?.code === 'failed-precondition') {
      console.warn('?? Clearing incompatible IndexedDB cache...');
      try {
        indexedDB.deleteDatabase('firestore/[DEFAULT]/arvindregister-353e5/main');
        const firestore = initializeFirestore(firebaseApp, {
          localCache: memoryLocalCache(),
        });
        console.info('? Firestore initialized with memory cache (cleared old data)');
        return firestore;
      } catch {
        const firestore = getFirestore(firebaseApp);
        console.info('? Firestore initialized with default settings');
        return firestore;
      }
    }

    const firestore = getFirestore(firebaseApp);
    console.info('? Firestore initialized with default settings');
    return firestore;
  }
})();

export const auth = getAuth(firebaseApp);
