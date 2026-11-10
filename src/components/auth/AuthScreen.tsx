import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { isFirebaseConfigured } from '../../firebase';
import { ArrowLeft, Check, AlertCircle, Mail, Lock, Sparkles, ChefHat } from 'lucide-react';

export function AuthScreen({ onOpenFirebaseConfig }: { onOpenFirebaseConfig: () => void }) {
  const { navigate } = useRouter();
  const { loginWithGoogle, loginWithEmail, signUpWithEmail, resetPassword } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!isFirebaseConfigured) {
      setError('Firebase is not yet configured. Please set your credentials to enable sign-in.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await loginWithEmail(email, password);
        navigate('/dashboard');
      } else if (mode === 'signup') {
        await signUpWithEmail(email, password);
        navigate('/dashboard');
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccessMessage('Password reset email sent! Check your inbox.');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    if (!isFirebaseConfigured) {
      setError('Firebase is not yet configured. Please set your credentials to enable sign-in.');
      return;
    }

    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col px-4 py-6 space-y-6 max-w-full">
      {/* Top back navigation */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#DAF1DE]/70 hover:text-[#8EB69B] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8EB69B]">
          <ChefHat className="w-3.5 h-3.5" />
          <span>Owner Portal</span>
        </div>
      </div>

      {/* Main Glass Card */}
      <div className="card-glass p-6 sm:p-7 space-y-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#163832] border border-[#235347] text-[10px] font-semibold text-[#8EB69B]">
            <Sparkles className="w-3 h-3" />
            <span>Restaurant Management</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#DAF1DE] tracking-tight">
            {mode === 'signin' && (
              <>
                <span className="font-light">Welcome </span>Back
              </>
            )}
            {mode === 'signup' && (
              <>
                <span className="font-light">Create </span>Your Menu
              </>
            )}
            {mode === 'forgot' && (
              <>
                <span className="font-light">Reset </span>Password
              </>
            )}
          </h2>
          <p className="text-xs text-[#DAF1DE]/70 leading-relaxed">
            {mode === 'signin' && 'Sign in to access your digital menu dashboard, QR codes, and reviews.'}
            {mode === 'signup' && 'Create your free account to launch your branded digital menu in minutes.'}
            {mode === 'forgot' && 'Enter your account email to receive a secure password reset link.'}
          </p>
        </div>

        {/* Tab switch */}
        {mode !== 'forgot' && (
          <div className="flex rounded-xl bg-[#163832] p-1 border border-[#235347]">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-[#8EB69B] text-[#051F20] shadow-sm'
                  : 'text-[#DAF1DE]/70 hover:text-[#DAF1DE]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-[#8EB69B] text-[#051F20] shadow-sm'
                  : 'text-[#DAF1DE]/70 hover:text-[#DAF1DE]'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Notifications */}
        {error && (
          <div className="p-3.5 rounded-xl bg-[#163832] border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <p className="font-medium leading-relaxed break-words">{error}</p>
              {error.includes('auth/operation-not-allowed') && (
                <div className="p-2.5 rounded-lg bg-[#0B2B26] border border-[#235347] text-[11px] text-[#DAF1DE]/90 space-y-1">
                  <p className="font-semibold text-[#8EB69B]">How to fix:</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-[#DAF1DE]/70">
                    <li>Go to your Firebase Console: <span className="font-mono text-[#8EB69B]">console.firebase.google.com</span></li>
                    <li>Select project: <span className="font-mono text-[#8EB69B]">menu-qr-c6fd9</span></li>
                    <li>Go to <strong>Authentication &rarr; Sign-in method</strong></li>
                    <li>Click <strong>Email/Password</strong>, switch <strong>Enable</strong> to ON, and save</li>
                  </ol>
                </div>
              )}
              {!isFirebaseConfigured && (
                <button
                  type="button"
                  onClick={onOpenFirebaseConfig}
                  className="underline font-bold text-[#8EB69B] cursor-pointer hover:text-[#DAF1DE]"
                >
                  Configure Firebase credentials
                </button>
              )}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-[#163832] border border-[#8EB69B]/50 text-[#DAF1DE] text-xs flex items-center gap-2.5">
            <Check className="w-4 h-4 text-[#8EB69B] shrink-0" />
            <p>{successMessage}</p>
          </div>
        )}

        {/* Google sign-in with official 4-color Google "G" logo */}
        {mode !== 'forgot' && (
          <>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl border border-[#235347] bg-[#163832] hover:bg-[#235347] active:scale-[0.99] text-[#DAF1DE] text-xs sm:text-sm font-semibold flex items-center justify-center gap-3 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              {/* Official 4-color Google "G" SVG */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#235347]" />
              <span className="text-[10px] uppercase tracking-widest text-[#DAF1DE]/40 font-bold">
                or with email
              </span>
              <div className="flex-1 h-px bg-[#235347]" />
            </div>
          </>
        )}

        {/* Email form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#DAF1DE]">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8EB69B] absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="chef@restaurant.com"
                className="input-glass w-full pl-10 pr-3.5 py-3 text-xs"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#DAF1DE]">Password</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[11px] font-medium text-[#8EB69B] hover:text-[#DAF1DE] underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8EB69B] absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="input-glass w-full pl-10 pr-3.5 py-3 text-xs"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 text-xs sm:text-sm font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-[#051F20]/30 border-t-[#051F20] rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : mode === 'signin' ? (
              'Sign In to Dashboard'
            ) : mode === 'signup' ? (
              'Create Free Account'
            ) : (
              'Send Password Reset Link'
            )}
          </button>
        </form>

        {mode === 'forgot' && (
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setSuccessMessage(null);
              }}
              className="text-xs font-bold text-[#8EB69B] hover:text-[#DAF1DE] underline cursor-pointer"
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>

      {/* Demo helper */}
      <div className="card-glass p-4 text-center space-y-2">
        <p className="text-xs text-[#DAF1DE]/70 font-medium">Want to test the diner experience first?</p>
        <button
          onClick={() => navigate('/r/demo-bistro')}
          className="text-xs font-bold text-[#8EB69B] hover:text-[#DAF1DE] underline cursor-pointer"
        >
          Explore Live Demo Bistro &rarr;
        </button>
      </div>
    </div>
  );
}
