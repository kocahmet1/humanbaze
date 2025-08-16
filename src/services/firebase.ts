import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// ---- Guard: validate env before initializing Firebase (no secrets logged)
const requiredEnvMap: Array<[string, unknown]> = [
  ['REACT_APP_FIREBASE_API_KEY', firebaseConfig.apiKey],
  ['REACT_APP_FIREBASE_AUTH_DOMAIN', firebaseConfig.authDomain],
  ['REACT_APP_FIREBASE_PROJECT_ID', firebaseConfig.projectId],
  ['REACT_APP_FIREBASE_STORAGE_BUCKET', firebaseConfig.storageBucket],
  ['REACT_APP_FIREBASE_MESSAGING_SENDER_ID', firebaseConfig.messagingSenderId],
  ['REACT_APP_FIREBASE_APP_ID', firebaseConfig.appId],
];

const missingVars = requiredEnvMap
  .filter(([_, v]) => !v)
  .map(([k]) => k);

let firebaseConfigError: string | null = null;

if (missingVars.length) {
  firebaseConfigError = `Missing Firebase env variables: ${missingVars.join(', ')}. These are build-time variables. Rebuild the site after setting them.`;
} else {
  const formatIssues: string[] = [];
  const apiKey = String(firebaseConfig.apiKey || '');
  const storageBucket = String(firebaseConfig.storageBucket || '');
  if (!apiKey.startsWith('AIza')) formatIssues.push('REACT_APP_FIREBASE_API_KEY format');
  if (!storageBucket.endsWith('.appspot.com')) formatIssues.push('REACT_APP_FIREBASE_STORAGE_BUCKET should end with .appspot.com');
  if (formatIssues.length) {
    firebaseConfigError = `Invalid Firebase env values: ${formatIssues.join(', ')}`;
  }
}

function showFriendlyErrorOverlay(message: string) {
  try {
    const attach = () => {
      const el = document.createElement('div');
      el.setAttribute('data-firebase-config-error', '');
      el.style.position = 'fixed';
      el.style.top = '0';
      el.style.left = '0';
      el.style.right = '0';
      el.style.zIndex = '2147483647';
      el.style.background = '#fdecea';
      el.style.borderBottom = '1px solid #f5c2c0';
      el.style.color = '#611a15';
      el.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif';
      el.style.padding = '12px 16px';
      el.style.textAlign = 'center';
      el.textContent = message;
      document.body?.appendChild(el);
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attach, { once: true });
    } else {
      attach();
    }
  } catch {}
}

if (firebaseConfigError) {
  console.error('Firebase config error:', firebaseConfigError);
  try { (window as any).__FIREBASE_CONFIG_ERROR__ = true; } catch {}
  // Provide a friendly in-app message instead of a stuck spinner
  showFriendlyErrorOverlay('Configuration error: Firebase is not set up. Please try again later.');
}

// Initialize Firebase immediately
let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;
let functions: any = null;
let analytics: any = null;

try {
  if (!firebaseConfigError) {
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
  }
} catch (error) {
  console.error('Firebase initialization failed:', error);
}

export const initializeFirebase = () => {
  if (firebaseConfigError) {
    console.error('Firebase services not initialized due to configuration error.');
    return null;
  }
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
