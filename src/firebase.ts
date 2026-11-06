import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyC7g17oyTQM78yl93aPtwNUq6X_mOir_ko',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'masikap-healthcenter.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'masikap-healthcenter',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:651691509259:web:a014e7250be4209e7ce90e',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);