'use client';

import { signOutFromSupabase } from '@/lib/auth';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Layers, Package, Scissors,
  ClipboardList, Truck, BarChart3, LogOut, Zap, X,
} from 'lucide-react';

const nav = [
  {
    section: 'Overview',
    items: [{ label: 'Dashboard', href: '/', icon: LayoutDashboard }],
  },
  {
    section: 'Master Data',
    items: [
      { label: 'Mills', href: '/tracker/master-data/mills', icon: Layers },
      { label: 'Knitters', href: '/tracker/master-data/knitters', icon: Layers },
      { label: 'Dyers', href: '/tracker/master-data/dyers', icon: Layers },
      { label: 'Compacters', href: '/tracker/master-data/compacters', icon: Layers },
      { label: 'Colours', href: '/tracker/master-data/colours', icon: Layers },
    ],
  },
  {
    section: 'Procurement',
    items: [
      { label: 'Yarn Inward', href: '/tracker/yarn-inward', icon: Package },
      { label: 'Yarn Inventory', href: '/tracker/yarn', icon: Package },
      { label: 'Fabric Inventory', href: '/tracker/grey-fabric-inward', icon: Package },
      { label: 'Purchase Orders', href: '/tracker/purchase-orders', icon: ClipboardList },
    ],
  },
  {
    section: 'Production',
    items: [
      { label: 'Knitter Programs', href: '/tracker/knitter-programs', icon: Scissors },
      { label: 'Dyeing Dispatch', href: '/tracker/dyeing', icon: Scissors },
      { label: 'Memos', href: '/tracker/memos', icon: ClipboardList },
      { label: 'Delivery Notes', href: '/tracker/delivery-notes', icon: Truck },
      { label: 'Compactor', href: '/tracker/compactor', icon: Scissors },
    ],
  },
  {
    section: 'Planning',
    items: [
      { label: 'Production Plans', href: '/production-planning', icon: BarChart3 },
      { label: 'Plan Dashboard', href: '/production-planning/dashboard', icon: LayoutDashboard },
      { label: 'Event Timeline', href: '/production-planning/events', icon: Zap },
    ],
  },
];

export function AppSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await signOutFromSupabase().catch(() => undefined);
    router.replace('/');
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-slate-800 bg-slate-950">
      <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 text-base shadow-lg shadow-blue-500/25">
          FF
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold leading-tight text-slate-100">Fabric Flow</p>
          <p className="text-[10px] text-slate-500">Textile MES</p>
        </div>
        {/* Close button - mobile only */}
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 md:hidden">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-6 px-3 py-4">
        {nav.map((group) => (
          <div key={group.section}>
            <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {group.section}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all duration-150 ${
                        active
                          ? 'border border-blue-500/25 bg-blue-600/15 font-medium text-blue-300'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-blue-400' : 'text-slate-500'}`} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-800 px-3 pb-4 pt-3">
        <button
          onClick={() => void logout()}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-400 transition-all duration-150 hover:bg-rose-500/10 hover:text-rose-400"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
