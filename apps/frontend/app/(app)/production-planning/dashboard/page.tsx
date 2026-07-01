'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { StatusBadge } from '@/components/production/status-badge';
import { QueryStateWrapper } from '@/components/production/query-state-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  TrendingUp, Clock, ClipboardList, CheckCircle, AlertCircle, CalendarRange
} from 'lucide-react';
import { useDashboardSummary } from '@/hooks/use-dashboard-summary';
import { useTodayPlans } from '@/hooks/use-today-plans';
import { useDelayedPlans } from '@/hooks/use-delayed-plans';

export default function DashboardPage() {
  const { data: summary, isLoading: summaryLoading, error: summaryError, refetch: refetchSummary } = useDashboardSummary();
  const { data: delayedPlans = [], isLoading: delayedLoading, error: delayedError, refetch: refetchDelayed } = useDelayedPlans();
  const { data: todayPlans = [], isLoading: todayLoading, error: todayError, refetch: refetchToday } = useTodayPlans();

  const isLoading = summaryLoading || delayedLoading || todayLoading;
  const hasError = summaryError || delayedError || todayError;

  const refetchAll = () => {
    refetchSummary();
    refetchDelayed();
    refetchToday();
  };

  return (
    <ProtectedRoute>
      <QueryStateWrapper isLoading={isLoading} error={hasError} retry={refetchAll}>
      <div className="p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
            MES Dashboard & KPI Metrics
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time tracking of manufacturing efficiency, delay incidents, and active work orders.
          </p>
        </div>

        {/* KPI Grid */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="glass-card border-slate-800 bg-slate-900/40 hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Plans</p>
                  <h3 className="text-3xl font-extrabold text-slate-100 mt-2">{summary.totalPlans}</h3>
                  <p className="text-[10px] text-slate-400 mt-1">{summary.inProgressPlans} actively executing</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <ClipboardList className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-slate-800 bg-slate-900/40 hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Plans</p>
                  <h3 className="text-3xl font-extrabold text-emerald-400 mt-2">{summary.completedPlans}</h3>
                  <p className="text-[10px] text-emerald-500/70 mt-1">
                    {summary.completedWeight.toFixed(1)} / {summary.plannedWeight.toFixed(1)} kg finished
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-slate-800 bg-slate-900/40 hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Delayed Jobs</p>
                  <h3 className={`text-3xl font-extrabold mt-2 ${summary.delayedPlans > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                    {summary.delayedPlans}
                  </h3>
                  <p className="text-[10px] text-rose-400/80 mt-1">Requires supervisor review</p>
                </div>
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                  summary.delayedPlans > 0 ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' : 'bg-slate-800/80 border border-slate-700/50 text-slate-400'
                }`}>
                  <Clock className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-slate-800 bg-slate-900/40 hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Efficiency Rating</p>
                  <h3 className="text-3xl font-extrabold text-blue-400 mt-2">{summary.efficiency.toFixed(1)}%</h3>
                  <div className="w-24 bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden border border-slate-700/30">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full" style={{ width: `${Math.min(summary.efficiency, 100)}%` }} />
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Today's plans */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="glass-card border-slate-800 bg-slate-900/40">
              <CardHeader className="border-b border-slate-800/60 pb-4">
                <CardTitle className="text-base font-bold text-slate-200 flex items-center gap-2">
                  <CalendarRange className="h-5 w-5 text-emerald-400" />
                  Today&apos;s Work Orders
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {todayPlans.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 text-xs">
                    No plans scheduled for today.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800 hover:bg-transparent">
                        <TableHead className="text-slate-500 text-xs">Plan No</TableHead>
                        <TableHead className="text-slate-500 text-xs">Lot</TableHead>
                        <TableHead className="text-slate-500 text-xs">Stage</TableHead>
                        <TableHead className="text-slate-500 text-xs">Weight</TableHead>
                        <TableHead className="text-slate-500 text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {todayPlans.map((plan) => (
                        <TableRow key={plan.id} className="border-slate-800/40 hover:bg-slate-800/10">
                          <TableCell className="font-semibold text-slate-300 text-xs">#{plan.planNo}</TableCell>
                          <TableCell className="text-slate-400 text-xs font-mono">{plan.lotNo}</TableCell>
                          <TableCell>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700/60">
                              {plan.stage}
                            </span>
                          </TableCell>
                          <TableCell className="text-slate-300 text-xs">{plan.plannedWeight} kg</TableCell>
                          <TableCell>
                            <StatusBadge status={plan.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Delayed Alert Card */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="glass-card border-slate-800 bg-slate-900/40 border-rose-500/20 shadow-lg shadow-rose-950/5">
              <CardHeader className="border-b border-slate-800/60 pb-4 bg-rose-500/5">
                <CardTitle className="text-base font-bold text-rose-400 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-rose-400" />
                  Delayed Plans Alert
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {delayedPlans.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                    <span className="text-2xl">🎉</span>
                    <span className="text-emerald-400 font-semibold">Zero Delayed Plans</span>
                    <span className="text-[10px] text-slate-500">All jobs are running on time.</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {delayedPlans.map((plan) => (
                      <div
                        key={plan.id}
                        className="border border-rose-500/20 bg-rose-500/5 rounded-xl p-3 flex justify-between items-start gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-200">#{plan.planNo}</span>
                            <span className="text-[9px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-bold uppercase">
                              {plan.stage}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1 font-mono">Lot: {plan.lotNo}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Planned Weight: {plan.plannedWeight} kg | Target Date: {new Date(plan.plannedDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] bg-rose-950/60 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full font-bold">
                            DELAYED
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </QueryStateWrapper>
    </ProtectedRoute>
  );
}
