import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Suppress internal Firestore connection warnings in offline/initialization modes
try {
  setLogLevel('silent');
} catch {}

// Initialize Firestore with specific database ID (CRITICAL: Required per Firebase guidelines)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Standardized Operation Type enum per Firebase skill
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

// Standardized Firestore error handler throwing JSON context
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot per Firebase guidelines
export async function testConnection(): Promise<boolean> {
  try {
    if (typeof auth.authStateReady === 'function') {
      await auth.authStateReady().catch(() => {});
    }
    // Check if auth token can be fetched without errors
    if (auth.currentUser) {
      try {
        await auth.currentUser.getIdToken(false);
      } catch (tokenErr: any) {
        if (
          tokenErr?.message?.includes('token-service-api') ||
          tokenErr?.code?.includes('token-service-api') ||
          tokenErr?.message?.includes('securetoken.googleapis.com')
        ) {
          console.warn('Firebase token service API is disabled on project. Clearing stale session.');
          await signOut(auth).catch(() => {});
        }
      }
    }
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    // Gracefully handle token service propagation or offline mode
    if (
      error instanceof Error &&
      (error.message.includes('the client is offline') ||
        error.message.includes('token-service-api') ||
        error.message.includes('auth token failed') ||
        error.message.includes('securetoken.googleapis.com'))
    ) {
      console.warn('Firebase client is initializing or operating in offline mode.');
    }
    return false;
  }
}

// Perform initial connection test safely after event loop ticks
setTimeout(() => {
  testConnection().catch(() => {});
}, 300);

// Auth helper functions
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

export async function logOutFirebase() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Firebase Sign-Out Error:', error);
    throw error;
  }
}
