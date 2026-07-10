import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080c14] text-slate-100 p-6">
      <div className="text-center max-w-sm flex flex-col items-center">
        <div className="h-16 w-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
          <HelpCircle className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
          Page Not Found
        </h1>
        <p className="text-slate-400 text-sm mt-3">
          The requested page does not exist or has been moved to a new route path.
        </p>
        <Link href="/">
          <Button className="mt-8 bg-indigo-600 hover:bg-indigo-500 text-xs px-6 py-2">
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
