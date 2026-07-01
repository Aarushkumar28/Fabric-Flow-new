'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#080c14] text-slate-100 p-6">
      <div className="h-16 w-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
        Something went wrong
      </h1>
      <p className="text-slate-400 text-sm mt-3 text-center max-w-md">
        {error.message || 'An unexpected runtime rendering error occurred in the application.'}
      </p>
      <div className="mt-8 flex gap-4">
        <Button
          onClick={() => reset()}
          className="bg-indigo-600 hover:bg-indigo-500 text-xs px-6 py-2"
        >
          Try again
        </Button>
        <Button
          variant="outline"
          onClick={() => window.location.href = '/'}
          className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs px-6 py-2"
        >
          Go Home
        </Button>
      </div>
    </div>
  );
}
