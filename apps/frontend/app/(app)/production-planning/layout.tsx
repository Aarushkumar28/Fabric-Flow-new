import type { ReactNode } from 'react';
import { Suspense } from 'react';

export default function ProductionPlanningLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#080c14] text-slate-500 font-medium text-sm animate-pulse">
          Loading...
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
