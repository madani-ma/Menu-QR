import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  type User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  signInAnonymously,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isConfigured: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  ensureAnonymousAuth: () => Promise<User | null>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      (err) => {
        console.error('Auth state error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const ensureAnonymousAuth = async (): Promise<User | null> => {
    if (!isFirebaseConfigured || !auth) {
      // In local demo / unconfigured mode, generate or reuse a stable client ID
      let localUid = localStorage.getItem('menuqr_anon_uid');
      if (!localUid) {
        localUid = 'anon_' + Math.random().toString(36).substring(2, 12);
        localStorage.setItem('menuqr_anon_uid', localUid);
      }
      return { uid: localUid } as User;
    }

    if (auth.currentUser) {
      return auth.currentUser;
    }

    try {
      const cred = await signInAnonymously(auth);
      return cred.user;
    } catch (err: any) {
      console.warn('Anonymous sign-in unavailable in Firebase project:', err?.message);
      // Fallback to local client uid so user can still leave ratings in demo mode
      let localUid = localStorage.getItem('menuqr_anon_uid');
      if (!localUid) {
        localUid = 'anon_' + Math.random().toString(36).substring(2, 12);
        localStorage.setItem('menuqr_anon_uid', localUid);
      }
      return { uid: localUid } as User;
    }
  };

  const formatAuthError = (err: any, actionName = 'Authentication'): string => {
    console.error(`Firebase Auth Error [${actionName}]:`, {
      code: err?.code,
      message: err?.message,
      fullError: err,
    });

    const code: string = err?.code || '';
    const message: string = err?.message || '';

    switch (code) {
      case 'auth/operation-not-allowed':
        return `Email/Password sign-in is not enabled in your Firebase project. Please enable Email/Password provider in the Firebase Console under Authentication > Sign-in method [auth/operation-not-allowed].`;
      case 'auth/email-already-in-use':
        return `This email is already registered. Please sign in instead [auth/email-already-in-use].`;
      case 'auth/weak-password':
        return `Password is too weak. Please use at least 6 characters [auth/weak-password].`;
      case 'auth/invalid-email':
        return `Please provide a valid email address [auth/invalid-email].`;
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return `Invalid email or password [${code || 'auth/invalid-credential'}].`;
      case 'auth/too-many-requests':
        return `Access to this account has been temporarily disabled due to many failed login attempts. Try again later or reset password [auth/too-many-requests].`;
      case 'auth/network-request-failed':
        return `Network connection failed. Please check your internet connection or ad-blocker [auth/network-request-failed].`;
      case 'auth/unauthorized-domain':
        return `This domain is not authorized in Firebase. Add this domain in Firebase Console > Authentication > Settings > Authorized domains [auth/unauthorized-domain].`;
      case 'auth/popup-closed-by-user':
        return `Google sign-in popup was closed before completing [auth/popup-closed-by-user].`;
      case 'auth/popup-blocked':
        return `Sign-in popup was blocked by browser. Please allow popups for this site [auth/popup-blocked].`;
      case 'auth/configuration-not-found':
        return `Firebase Authentication configuration was not found for this project. Ensure Auth is activated in Firebase Console [auth/configuration-not-found].`;
      default:
        if (code) {
          return `${message.replace(/^Firebase:\s*/i, '')} [${code}]`;
        }
        return message || `${actionName} failed. Please try again.`;
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    if (!isFirebaseConfigured || !auth) {
      const msg = 'Firebase Authentication is not configured. Please check your Firebase configuration.';
      setError(msg);
      throw new Error(msg);
    }
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      const detailed = formatAuthError(err, 'Google Sign-In');
      setError(detailed);
      throw new Error(detailed);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setError(null);
    if (!isFirebaseConfigured || !auth) {
      const msg = 'Firebase Authentication is not configured. Please check your Firebase configuration.';
      setError(msg);
      throw new Error(msg);
    }
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (err: any) {
      const detailed = formatAuthError(err, 'Sign In');
      setError(detailed);
      throw new Error(detailed);
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    setError(null);
    if (!isFirebaseConfigured || !auth) {
      const msg = 'Firebase Authentication is not configured. Please check your Firebase configuration.';
      setError(msg);
      throw new Error(msg);
    }
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), pass);
    } catch (err: any) {
      const detailed = formatAuthError(err, 'Create Account');
      setError(detailed);
      throw new Error(detailed);
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    if (!isFirebaseConfigured || !auth) {
      const msg = 'Firebase Authentication is not configured. Please check your Firebase configuration.';
      setError(msg);
      throw new Error(msg);
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      const detailed = formatAuthError(err, 'Password Reset');
      setError(detailed);
      throw new Error(detailed);
    }
  };

  const logout = async () => {
    setError(null);
    if (auth) {
      await firebaseSignOut(auth);
    }
    setUser(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isConfigured: isFirebaseConfigured,
        loginWithGoogle,
        loginWithEmail,
        signUpWithEmail,
        resetPassword,
        ensureAnonymousAuth,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
