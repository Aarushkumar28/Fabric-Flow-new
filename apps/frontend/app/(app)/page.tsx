'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { ProtectedRoute } from '@/components/auth/protected-route';
import {
  LayoutDashboard, Package, Scissors, Truck, ClipboardList,
  Layers, BarChart3, Zap, AlertTriangle, CheckCircle2, Clock, Activity,
} from 'lucide-react';
import Link from 'next/link';

interface LotSummary {
  totalLots: number;
  completedLots: number;
  delayedLots: number;
  pendingLots: number;
  activeLots: number;
  greyBalance: number;
  dyedBalance: number;
  compactBalance: number;
}

interface DelayedLot {
  id: number;
  lotNo: string;
  currentStage: string;
  idleDays: number;
  completionPercent: number;
}

const modules = [
  { label: 'Yarn Inward', href: '/tracker/yarn-inward', icon: Package, color: 'from-blue-500/15 to-blue-600/5 border-blue-500/25', iconColor: 'text-blue-400' },
  { label: 'Yarn Inventory', href: '/tracker/yarn', icon: Package, color: 'from-violet-500/15 to-violet-600/5 border-violet-500/25', iconColor: 'text-violet-400' },
  { label: 'Grey Fabric Inward', href: '/tracker/grey-fabric-inward', icon: Package, color: 'from-indigo-500/15 to-indigo-600/5 border-indigo-500/25', iconColor: 'text-indigo-400' },
  { label: 'Knitter Programs', href: '/tracker/knitter-programs', icon: Scissors, color: 'from-pink-500/15 to-pink-600/5 border-pink-500/25', iconColor: 'text-pink-400' },
  { label: 'Dyeing Dispatch', href: '/tracker/dyeing', icon: Layers, color: 'from-rose-500/15 to-rose-600/5 border-rose-500/25', iconColor: 'text-rose-400' },
  { label: 'Delivery Notes', href: '/tracker/delivery-notes', icon: Truck, color: 'from-emerald-500/15 to-emerald-600/5 border-emerald-500/25', iconColor: 'text-emerald-400' },
  { label: 'Production Plans', href: '/production-planning', icon: ClipboardList, color: 'from-amber-500/15 to-amber-600/5 border-amber-500/25', iconColor: 'text-amber-400' },
  { label: 'Event Timeline', href: '/production-planning/events', icon: Zap, color: 'from-cyan-500/15 to-cyan-600/5 border-cyan-500/25', iconColor: 'text-cyan-400' },
];

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <div className={`rounded-xl border bg-gradient-to-br p-4 ${color}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <p className="text-3xl font-bold text-slate-100">{value}</p>
    </div>
  );
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-800/70 ${className}`} />;
}

export default function HomePage() {
  const summaryQ = useQuery<LotSummary>({
    queryKey: ['home', 'summary'],
    queryFn: () => apiClient<LotSummary>('/lot-tracker/dashboard/summary'),
    refetchInterval: 15000,
    retry: 1,
  });

  const delayedQ = useQuery<DelayedLot[]>({
    queryKey: ['home', 'delayed'],
    queryFn: () => apiClient<DelayedLot[]>('/lot-tracker/delayed'),
    refetchInterval: 15000,
    retry: 1,
  });

  const s = summaryQ.data;
  const delayed = delayedQ.data ?? [];

  return (
    <ProtectedRoute>
      <div className="p-6 space-y-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-6 w-6 text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              Operations Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Live production visibility — auto-refreshes every 15 s</p>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summaryQ.isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
          ) : s ? (
            <>
              <StatCard label="Total Lots" value={s.totalLots} icon={Activity} color="from-blue-500/10 to-blue-600/5 border-blue-500/20" />
              <StatCard label="Completed" value={s.completedLots} icon={CheckCircle2} color="from-emerald-500/10 to-emerald-600/5 border-emerald-500/20" />
              <StatCard label="Delayed" value={s.delayedLots} icon={AlertTriangle} color="from-rose-500/10 to-rose-600/5 border-rose-500/20" />
              <StatCard label="Pending / Active" value={`${s.pendingLots} / ${s.activeLots ?? 0}`} icon={Clock} color="from-amber-500/10 to-amber-600/5 border-amber-500/20" />
            </>
          ) : (
            <div className="col-span-4 text-sm text-slate-500 py-4">Dashboard stats unavailable</div>
          )}
        </div>

        {/* Lot pipeline + Inventory */}
        {s && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pipeline */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <p className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-400" /> Lot Pipeline
              </p>
              {[
                { label: 'Pending', value: s.pendingLots, total: s.totalLots, color: 'bg-amber-500' },
                { label: 'Active', value: s.activeLots ?? 0, total: s.totalLots, color: 'bg-blue-500' },
                { label: 'Completed', value: s.completedLots, total: s.totalLots, color: 'bg-emerald-500' },
              ].map(({ label, value, total, color }) => (
                <div key={label} className="mb-3">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>{label}</span><span className="font-medium text-slate-200">{value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${total > 0 ? (value / total) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Inventory */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <p className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <Package className="h-4 w-4 text-violet-400" /> Inventory Balance (kg)
              </p>
              {[
                { label: 'Grey Fabric', value: s.greyBalance ?? 0, color: 'bg-indigo-500' },
                { label: 'Dyed Fabric', value: s.dyedBalance ?? 0, color: 'bg-pink-500' },
                { label: 'Compacted', value: s.compactBalance ?? 0, color: 'bg-emerald-500' },
              ].map(({ label, value, color }) => {
                const max = Math.max(s.greyBalance ?? 0, s.dyedBalance ?? 0, s.compactBalance ?? 0, 1);
                return (
                  <div key={label} className="mb-3">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>{label}</span><span className="font-medium text-slate-200">{value.toLocaleString()} kg</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${(value / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Delayed lots */}
        {(delayed.length > 0 || delayedQ.isLoading) && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
            <p className="text-sm font-semibold text-rose-300 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Delayed Lots ({delayed.length})
            </p>
            {delayedQ.isLoading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : (
              <div className="space-y-2">
                {delayed.slice(0, 8).map((lot) => (
                  <div key={lot.id} className="flex items-center gap-3 rounded-lg bg-slate-900/50 px-3 py-2">
                    <span className="font-mono text-xs font-semibold text-slate-200 w-24 shrink-0">{lot.lotNo}</span>
                    <span className="text-xs text-slate-400 shrink-0">{lot.currentStage}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full bg-rose-500" style={{ width: `${lot.completionPercent ?? 0}%` }} />
                    </div>
                    <span className="text-xs text-rose-400 shrink-0">{lot.idleDays}d idle</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Module quick-nav */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Quick Access</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {modules.map((m) => {
              const Icon = m.icon;
              return (
                <Link
                  key={m.href}
                  href={m.href}
                  className={`flex items-center gap-3 rounded-xl border bg-gradient-to-br p-3.5 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${m.color}`}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${m.iconColor}`} />
                  <span className="text-sm font-medium text-slate-200">{m.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
