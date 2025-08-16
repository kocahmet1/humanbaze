import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBqGDEUQIHIj_VIYKOmNQX2lhxiylQxLB0",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "humanbaze-8ea78.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "humanbaze-8ea78",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "humanbaze-8ea78.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "432705637391",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:432705637391:web:d55df3cba70c21dc12677a",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-W9J4536Q60"
};

// Initialize Firebase immediately
let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;
let functions: any = null;
let analytics: any = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  // Ensure auth persists across refreshes
  try { setPersistence(auth, browserLocalPersistence); } catch {}
  db = getFirestore(app);
  storage = getStorage(app);
  functions = getFunctions(app);

  // Analytics only in browser environment
  if (typeof window !== 'undefined') {
    try {
      analytics = getAnalytics(app);
    } catch (error) {
      console.warn('Analytics initialization failed:', error);
    }
  }
  
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization failed:', error);
}

export const initializeFirebase = () => {
  if (app && auth && db) {
    console.log('Firebase services ready');
    return { app, auth, db, storage, functions, analytics };
  } else {
    console.error('Firebase services not properly initialized');
    return null;
  }
};

// Export services
export { auth, db, storage, functions, analytics };
export default app;
