import React, { useState, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RouterProvider, useRouter } from './context/RouterContext';
import { FirebaseNoticeBanner } from './components/common/FirebaseNoticeBanner';

// Route Code-Splitting: Lazy load heavy views so initial landing and diner pages load instantly
const CustomerMenu = React.lazy(() =>
  import('./components/customer/CustomerMenu').then((m) => ({ default: m.CustomerMenu }))
);
const LandingPage = React.lazy(() =>
  import('./components/landing/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const Dashboard = React.lazy(() =>
  import('./components/dashboard/Dashboard').then((m) => ({ default: m.Dashboard }))
);
const AuthScreen = React.lazy(() =>
  import('./components/auth/AuthScreen').then((m) => ({ default: m.AuthScreen }))
);
const FirebaseNoticeModal = React.lazy(() =>
  import('./components/common/FirebaseNoticeModal').then((m) => ({ default: m.FirebaseNoticeModal }))
);

function ScreenSkeleton() {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center p-8 space-y-4">
      <div className="w-10 h-10 border-2 border-[#8EB69B] border-t-transparent rounded-full animate-spin" />
      <div className="w-32 h-2.5 rounded-full bg-[#163832] animate-pulse" />
    </div>
  );
}

function AppContent() {
  const { route } = useRouter();
  const { user, loading } = useAuth();
  const [configModalOpen, setConfigModalOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-[#051F20] text-[#DAF1DE] flex flex-col items-center justify-start overflow-x-hidden">
      <div className="app-viewport w-full max-w-[480px] flex-1 flex flex-col mx-auto relative">
        {/* Compact dismissible strip if Firebase is unconfigured */}
        <FirebaseNoticeBanner onOpenModal={() => setConfigModalOpen(true)} />

        {/* Dynamic Route View with Lazy Loading and Suspense */}
        <Suspense fallback={<ScreenSkeleton />}>
          {(() => {
            if (route.name === 'menu') {
              return (
                <CustomerMenu
                  slug={route.slug}
                  onOpenFirebaseConfig={() => setConfigModalOpen(true)}
                />
              );
            }

            if (route.name === 'auth') {
              return <AuthScreen onOpenFirebaseConfig={() => setConfigModalOpen(true)} />;
            }

            if (route.name === 'dashboard') {
              if (loading) {
                return (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-3">
                    <div className="w-7 h-7 border-2 border-[#8EB69B] border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-[#DAF1DE]/70 font-mono">Authenticating...</p>
                  </div>
                );
              }

              if (!user) {
                return <AuthScreen onOpenFirebaseConfig={() => setConfigModalOpen(true)} />;
              }

              return <Dashboard onOpenFirebaseConfig={() => setConfigModalOpen(true)} />;
            }

            // Default: Landing page
            return <LandingPage onOpenFirebaseConfig={() => setConfigModalOpen(true)} />;
          })()}
        </Suspense>

        {/* Global Firebase Configuration Modal (Lazy loaded only when open) */}
        {configModalOpen && (
          <Suspense fallback={null}>
            <FirebaseNoticeModal
              isOpen={configModalOpen}
              onClose={() => setConfigModalOpen(false)}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <AppContent />
      </RouterProvider>
    </AuthProvider>
  );
}
