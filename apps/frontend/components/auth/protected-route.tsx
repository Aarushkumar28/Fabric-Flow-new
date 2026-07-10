'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getSupabaseSession,
  subscribeToAuthChanges,
  isGuestMode,
} from '@/lib/auth';
import { Loader2 } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'allowed' | 'denied'>('loading');

  useEffect(() => {
    let mounted = true;

    // Initial check: allow if Supabase session exists OR guest mode is active
    async function check() {
      if (isGuestMode()) {
        if (mounted) setStatus('allowed');
        return;
      }

      try {
        const session = await getSupabaseSession();
        if (mounted) {
          setStatus(session ? 'allowed' : 'denied');
        }
      } catch {
        if (mounted) setStatus('denied');
      }
    }

    check();

    // Subscribe to auth state changes (handles sign-out, token refresh, etc.)
    const { data: subscription } = subscribeToAuthChanges(async (_event, session) => {
      if (!mounted) return;

      if (session) {
        setStatus('allowed');
      } else if (isGuestMode()) {
        // Still in guest mode — keep allowed
        setStatus('allowed');
      } else {
        setStatus('denied');
      }
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (status === 'denied') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080c14]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (status === 'denied') {
    return null;
  }

  return <>{children}</>;
}
