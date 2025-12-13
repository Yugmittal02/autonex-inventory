import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDDer9o6DqRuFVSQwRcq0BqvDkc72oKSRk",
  authDomain: "arvindregister-353e5.firebaseapp.com",
  projectId: "arvindregister-353e5",
  storageBucket: "arvindregister-353e5.firebasestorage.app",
  messagingSenderId: "557116649734",
  appId: "1:557116649734:web:822bbad24cca3274012e87",
  measurementId: "G-79C2SNJC56"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') console.warn("Multiple tabs open.");
    else if (err.code === 'unimplemented') console.warn("Persistence not supported.");
  });
} catch(e) { console.log("Persistence fallback"); }