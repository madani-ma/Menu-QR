import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDocFromServer,
  type Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  firestoreDatabaseId?: string;
  measurementId?: string;
}

// Clean up any old manual config from previous projects in localStorage
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem('menuqr_firebase_config');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.projectId !== firebaseConfig.projectId) {
        localStorage.removeItem('menuqr_firebase_config');
      }
    }
  } catch {}
}

export function saveManualFirebaseConfig(config: FirebaseClientConfig) {
  localStorage.setItem('menuqr_firebase_config', JSON.stringify(config));
  window.location.reload();
}

export function clearManualFirebaseConfig() {
  localStorage.removeItem('menuqr_firebase_config');
  window.location.reload();
}

// Active configuration strictly bound to the user's project: menu-qr-c6fd9
const activeConfig: FirebaseClientConfig = {
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
  firestoreDatabaseId: (firebaseConfig as any).firestoreDatabaseId || '',
  measurementId: (firebaseConfig as any).measurementId || '',
};

export const isFirebaseConfigured = Boolean(
  activeConfig.apiKey &&
  activeConfig.apiKey !== 'your-api-key' &&
  activeConfig.projectId &&
  activeConfig.projectId !== 'your-project-id'
);

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    appInstance = getApps().length > 0 ? getApps()[0] : initializeApp(activeConfig);
    authInstance = getAuth(appInstance);

    // Initialize Firestore with custom databaseId and persistent local cache
    const dbId = activeConfig.firestoreDatabaseId;
    try {
      dbInstance = dbId
        ? initializeFirestore(
            appInstance,
            {
              localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager(),
              }),
            },
            dbId
          )
        : initializeFirestore(appInstance, {
            localCache: persistentLocalCache({
              tabManager: persistentMultipleTabManager(),
            }),
          });
    } catch {
      // Fallback if already initialized
      dbInstance = dbId ? getFirestore(appInstance, dbId) : getFirestore(appInstance);
    }

    // Connection validation test required by Firebase integration skill
    if (dbInstance) {
      const probeDoc = doc(dbInstance, 'test', 'connection');
      getDocFromServer(probeDoc).catch((error) => {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error('Please check your Firebase configuration.');
        }
      });
    }
  } catch (err) {
    console.error('Failed to initialize Firebase with current configuration:', err);
  }
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;

// Standardized error handler conforming strictly to skill specifications
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
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
