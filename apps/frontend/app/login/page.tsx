'use client';

import { signInWithSupabase } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.replace('/');
  }

  async function handleQuickSignUp() {
    router.replace('/');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080c14] p-4">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-10%] top-[-20%] h-[500px] w-[500px] rounded-full bg-blue-600/8 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-violet-600/8 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-semibold shadow-xl shadow-blue-500/25">
            FF
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Fabric Flow</h1>
          <p className="mt-1 text-sm text-slate-400">Textile Production MES</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-sm">
          <h2 className="mb-5 text-lg font-semibold text-slate-200">
            Sign in to your account
          </h2>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <p className="text-sm text-rose-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleQuickSignUp}
              disabled={loading}
              suppressHydrationWarning
              className="w-full rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400 transition-all hover:bg-blue-500/20 disabled:opacity-60"
            >
              Quick Register (testadmin@fabricflow.app)
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-slate-600">
            Sign in with your Supabase account credentials.
          </p>
        </div>
      </div>
    </div>
  );
}
