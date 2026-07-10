'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AlertCircle, Loader2, Mail, UserPlus, LogIn } from 'lucide-react';
import {
  signInWithSupabase,
  signUpWithSupabase,
  getSupabaseSession,
  enterGuestMode,
  isGuestMode,
} from '@/lib/auth';

type Mode = 'login' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const [checking, setChecking] = useState(true);

  // Redirect if already authenticated or in guest mode
  useEffect(() => {
    async function redirectIfAuthed() {
      if (isGuestMode()) {
        router.replace('/');
        return;
      }
      try {
        const session = await getSupabaseSession();
        if (session) {
          router.replace('/');
          return;
        }
      } catch {
        // No session — stay on login page
      }
      setChecking(false);
    }
    redirectIfAuthed();
  }, [router]);

  function resetForm() {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setCheckEmail(false);
  }

  function switchMode(newMode: Mode) {
    resetForm();
    setMode(newMode);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: authError } = await signInWithSupabase(email, password);
      if (authError) {
        toast.error(authError.message);
        setError(authError.message);
        setLoading(false);
        return;
      }
      router.replace('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      toast.error(message);
      setError(message);
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      const msg = 'Passwords do not match';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (password.length < 6) {
      const msg = 'Password must be at least 6 characters';
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } = await signUpWithSupabase(email, password);

      if (authError) {
        toast.error(authError.message);
        setError(authError.message);
        setLoading(false);
        return;
      }

      // If a session is returned, email confirmation is disabled — go straight in
      if (data.session) {
        toast.success('Account created!');
        router.replace('/');
        return;
      }

      // Otherwise email confirmation is required
      setCheckEmail(true);
      setLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      toast.error(message);
      setError(message);
      setLoading(false);
    }
  }

  function handleGuestBypass() {
    enterGuestMode();
    router.replace('/');
  }

  // Show nothing while we check for existing session
  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080c14]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080c14] p-4">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-10%] top-[-20%] h-[500px] w-[500px] rounded-full bg-blue-600/8 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-violet-600/8 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-semibold shadow-xl shadow-blue-500/25">
            FF
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Fabric Flow</h1>
          <p className="mt-1 text-sm text-slate-400">Textile Production MES</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-sm">
          {/* Tab toggle */}
          <div className="mb-5 flex rounded-lg border border-slate-700/50 bg-slate-800/50 p-0.5">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-slate-700/80 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              Log in
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                mode === 'signup'
                  ? 'bg-slate-700/80 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Sign up
            </button>
          </div>

          {/* Email confirmation banner */}
          {checkEmail && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-emerald-300">Check your email</p>
                <p className="mt-0.5 text-xs text-emerald-400/80">
                  We&apos;ve sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come back and log in.
                </p>
              </div>
            </div>
          )}

          {/* Error banner */}
          {error && !checkEmail && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <p className="text-sm text-rose-300">{error}</p>
            </div>
          )}

          {/* Login form */}
          {mode === 'login' && !checkEmail && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="name@company.com"
                  className="w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 transition-all focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  suppressHydrationWarning
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Password"
                  className="w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 transition-all focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  suppressHydrationWarning
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                suppressHydrationWarning
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:from-blue-500 hover:to-violet-500 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          )}

          {/* Sign-up form */}
          {mode === 'signup' && !checkEmail && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="name@company.com"
                  className="w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 transition-all focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  suppressHydrationWarning
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Min. 6 characters"
                  className="w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 transition-all focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  suppressHydrationWarning
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  className="w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 transition-all focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  suppressHydrationWarning
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                suppressHydrationWarning
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:from-blue-500 hover:to-violet-500 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          )}

          {/* Post check-email: button to go back to login */}
          {checkEmail && (
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700/60 bg-slate-800/60 px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:bg-slate-700/60"
            >
              <LogIn className="h-4 w-4" />
              Back to Log in
            </button>
          )}

          {!checkEmail && (
            <p className="mt-4 text-center text-xs text-slate-600">
              {mode === 'login'
                ? 'Sign in with your Supabase account credentials.'
                : 'Create a new account with email and password.'}
            </p>
          )}
        </div>

        {/* Divider + Guest bypass */}
        <div className="mt-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-800" />
          <span className="text-xs text-slate-600">or</span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        <button
          type="button"
          onClick={handleGuestBypass}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-2.5 text-sm font-medium text-slate-400 backdrop-blur-sm transition-all duration-200 hover:border-slate-600/60 hover:bg-slate-800/50 hover:text-slate-300"
        >
          Continue as Guest
        </button>

        <p className="mt-3 text-center text-[11px] text-slate-600">
          Guest access uses live data without an account. Session ends when you close this tab.
        </p>
      </div>
    </div>
  );
}
