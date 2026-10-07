import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  Firestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  memoryLocalCache 
} from "firebase/firestore";
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

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let db: Firestore;

if (typeof window !== "undefined") {
  try {
    const isIOS10 = /OS 10_/i.test(window.navigator.userAgent);
    const isIOS11 = /OS 11_/i.test(window.navigator.userAgent);
    
    const hasBroadcastChannel = typeof (window as any).BroadcastChannel !== "undefined" 
        && typeof (window as any).BroadcastChannel.prototype.postMessage === "function"
        && (window as any).BroadcastChannel.toString().indexOf("native code") !== -1;

    if (!isIOS10 && !isIOS11 && hasBroadcastChannel) {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      });
    } else {
      db = initializeFirestore(app, {
        localCache: memoryLocalCache()
      });
    }
  } catch (e) {
    try {
      db = getFirestore(app);
    } catch {
      db = initializeFirestore(app, {
        localCache: memoryLocalCache()
      });
    }
  }
} else {
  try {
    db = initializeFirestore(app, {});
  } catch {
    db = getFirestore(app);
  }
}

const storage: FirebaseStorage = getStorage(app);
const auth: Auth = getAuth(app);

export { db, storage, auth };
