import { initializeApp, getApps } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock-domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gym-survey-mvp",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "gym-survey-mvp.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:12345:web:12345"
};

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let db;
try {
  // Configures offline persistence robustly
  db = initializeFirestore(app, {
    localCache: persistentLocalCache()
  });
} catch (error) {
  // Fallback if already initialized in Next.js fast refresh
  db = getFirestore(app);
}

export const storage = getStorage(app);
export { db };
