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

  const loginWithGoogle = async () => {
    setError(null);
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase Authentication is not configured. Please check your environment variables or Firebase setup.');
    }
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      const msg = err?.message || 'Google sign in failed';
      setError(msg);
      throw err;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setError(null);
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase Authentication is not configured. Please check your environment variables or Firebase setup.');
    }
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (err: any) {
      let friendly = 'Failed to sign in. Please check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        friendly = 'Invalid email or password.';
      } else if (err.code === 'auth/too-many-requests') {
        friendly = 'Too many failed login attempts. Please try again later or reset password.';
      } else if (err.code === 'auth/invalid-email') {
        friendly = 'Please provide a valid email address.';
      }
      setError(friendly);
      throw new Error(friendly);
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    setError(null);
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase Authentication is not configured. Please check your environment variables or Firebase setup.');
    }
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), pass);
    } catch (err: any) {
      let friendly = 'Failed to create account.';
      if (err.code === 'auth/email-already-in-use') {
        friendly = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        friendly = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        friendly = 'Please provide a valid email address.';
      }
      setError(friendly);
      throw new Error(friendly);
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase Authentication is not configured. Please check your environment variables or Firebase setup.');
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      let friendly = 'Failed to send password reset email.';
      if (err.code === 'auth/user-not-found') {
        friendly = 'No account found with this email.';
      } else if (err.code === 'auth/invalid-email') {
        friendly = 'Please enter a valid email address.';
      }
      setError(friendly);
      throw new Error(friendly);
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
