import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, Firestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializa o Firebase garantindo que não crie múltiplas instâncias
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Tipagem explícita para o TypeScript não reclamar no Build
let db: Firestore;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
  });
} catch (e) {
  // Fallback seguro caso o Firestore já tenha sido inicializado no Hot Reload
  db = getFirestore(app);
}

const storage: FirebaseStorage = getStorage(app);
const auth: Auth = getAuth(app);

export { db, storage, auth };