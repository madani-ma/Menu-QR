import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type AppRoute =
  | { name: 'landing' }
  | { name: 'auth'; mode?: 'signin' | 'signup' | 'forgot' }
  | { name: 'dashboard'; tab?: string }
  | { name: 'menu'; slug: string };

interface RouterContextType {
  route: AppRoute;
  navigate: (path: string) => void;
  currentPath: string;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

function parsePath(pathname: string): AppRoute {
  const clean = pathname.replace(/\/+$/, '') || '/';

  if (clean === '/' || clean === '') {
    return { name: 'landing' };
  }

  if (clean === '/login' || clean === '/signin' || clean === '/auth') {
    return { name: 'auth', mode: 'signin' };
  }

  if (clean === '/signup') {
    return { name: 'auth', mode: 'signup' };
  }

  if (clean.startsWith('/dashboard')) {
    const parts = clean.split('/');
    const tab = parts[2] || undefined;
    return { name: 'dashboard', tab };
  }

  if (clean.startsWith('/r/')) {
    const slug = clean.slice(3).toLowerCase().trim();
    if (slug) {
      return { name: 'menu', slug };
    }
  }

  return { name: 'landing' };
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);
  const [route, setRoute] = useState<AppRoute>(() => parsePath(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      setCurrentPath(path);
      setRoute(parsePath(path));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
      setCurrentPath(path);
      setRoute(parsePath(path));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <RouterContext.Provider value={{ route, navigate, currentPath }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
}
