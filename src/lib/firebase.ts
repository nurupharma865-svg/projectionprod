import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const requiredConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Object.values(requiredConfig).every(Boolean);
const app = firebaseConfigured
  ? (getApps()[0] ?? initializeApp(requiredConfig))
  : null;

// Application publique : aucun compte ni authentification Firebase.
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
