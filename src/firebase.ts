import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  measurementId?: string;
}

// 1. Check environment variables
const envConfig: Partial<FirebaseClientConfig> = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

// 2. Check local storage for runtime-configured credentials
function getStoredConfig(): Partial<FirebaseClientConfig> | null {
  try {
    const raw = localStorage.getItem('menuqr_firebase_config');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore storage parse issues
  }
  return null;
}

export function saveManualFirebaseConfig(config: FirebaseClientConfig) {
  localStorage.setItem('menuqr_firebase_config', JSON.stringify(config));
  window.location.reload();
}

export function clearManualFirebaseConfig() {
  localStorage.removeItem('menuqr_firebase_config');
  window.location.reload();
}

const storedConfig = getStoredConfig();

const activeConfig: Partial<FirebaseClientConfig> = {
  apiKey: envConfig.apiKey || storedConfig?.apiKey || '',
  authDomain: envConfig.authDomain || storedConfig?.authDomain || '',
  projectId: envConfig.projectId || storedConfig?.projectId || '',
  storageBucket: envConfig.storageBucket || storedConfig?.storageBucket || '',
  messagingSenderId: envConfig.messagingSenderId || storedConfig?.messagingSenderId || '',
  appId: envConfig.appId || storedConfig?.appId || '',
  measurementId: envConfig.measurementId || storedConfig?.measurementId || '',
};

export const isFirebaseConfigured = Boolean(
  activeConfig.apiKey &&
  activeConfig.apiKey !== 'your-api-key' &&
  activeConfig.projectId &&
  activeConfig.projectId !== 'your-project-id'
);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(activeConfig as FirebaseClientConfig);
    authInstance = getAuth(app);

    // Initialize Firestore with persistent local cache to eliminate repeat network requests
    try {
      dbInstance = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } catch {
      // Fallback if already initialized
      dbInstance = getFirestore(app);
    }
  } catch (err) {
    console.error('Failed to initialize Firebase with current configuration:', err);
  }
}

export const auth = authInstance;
export const db = dbInstance;

// Error handler helper conforming to error handling specifications
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
    },
    operationType,
    path,
  };
  console.error('Firestore Error Details:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
