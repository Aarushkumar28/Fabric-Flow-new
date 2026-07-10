'use client';

import { useState, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { apiClient } from '@/lib/api/client';
import api from '@/lib/api';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import {
  LineChart as LineChartIcon, Upload, CheckCircle2,
  Calendar, Users, Activity, Layers, ChevronLeft, ChevronRight,
  Filter, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

/* ─── Types ─── */
interface ActivityLog {
  id: number;
  date: string;
  user: string;
  action: string;
  module: string;
  details: string | null;
  source: string;
  createdAt: string;
}

interface Summary {
  totalEvents: number;
  uniqueUsers: string[];
  activeDays: number;
  eventsByModule: { module: string; count: number }[];
  eventsByUser: { user: string; count: number }[];
  eventsByDay: { date: string; count: number }[];
  recentLogs: ActivityLog[];
}

interface LogsResponse {
  data: ActivityLog[];
  total: number;
  page: number;
  pageSize: number;
}

interface ParsedRow {
  date: string;
  user: string;
  action: string;
  module: string;
  details?: string;
}

const MODULE_COLORS = [
  '#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd',
  '#818cf8', '#60a5fa', '#34d399', '#fb923c',
];

/* ─── Stat Card ─── */
function StatCard({
  label, value, icon: Icon, gradient,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  gradient: string;
}) {
  return (
    <div className={`rounded-xl border bg-gradient-to-br p-5 ${gradient}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <p className="text-3xl font-bold text-slate-100">{value}</p>
    </div>
  );
}

/* ─── Import Panel ─── */
function ImportPanel({ onImported }: { onImported: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [allRows, setAllRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function normaliseHeaders(row: Record<string, unknown>): ParsedRow | null {
    const get = (keys: string[]) => {
      for (const k of keys) {
        const found = Object.keys(row).find(
          (rk) => rk.trim().toLowerCase() === k.toLowerCase(),
        );
        if (found !== undefined) return String(row[found] ?? '').trim();
      }
      return '';
    };

    const date = get(['date']);
    const user = get(['user']);
    const action = get(['action']);
    const module = get(['module']);
    const details = get(['details']);

    if (!date || !user || !action || !module) return null;

    // Parse Excel date serial numbers
    let isoDate = date;
    const serial = Number(date);
    if (!isNaN(serial) && serial > 1000) {
      const d = XLSX.SSF.parse_date_code(serial);
      isoDate = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
    } else {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        isoDate = parsed.toISOString().slice(0, 10);
      }
    }

    return { date: isoDate, user, action, module, details: details || undefined };
  }

  function parseFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
      const rows = raw.map(normaliseHeaders).filter((r): r is ParsedRow => r !== null);
      setAllRows(rows);
      setPreview(rows.slice(0, 10));
      if (rows.length === 0) {
        toast.error('No valid rows found. Expected columns: Date, User, Action, Module, Details');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, []);

  async function handleImport() {
    if (allRows.length === 0) return;
    setImporting(true);
    try {
      const res = await api.post<{ imported: number }>('/activity-logs/bulk-import', {
        logs: allRows.map((r) => ({
          date: new Date(r.date).toISOString(),
          user: r.user,
          action: r.action,
          module: r.module,
          details: r.details,
          source: 'IMPORT',
        })),
      });
      toast.success(`Successfully imported ${res.data.imported} rows`);
      setPreview([]);
      setAllRows([]);
      onImported();
    } catch {
      toast.error('Import failed. Please check your file and try again.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <Card className="border-slate-800 bg-slate-900/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-slate-100 text-base">
          <Upload className="h-4 w-4 text-violet-400" />
          Import Activity Logs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all duration-200 ${
            dragging
              ? 'border-violet-500 bg-violet-500/10'
              : 'border-slate-700 bg-slate-800/40 hover:border-violet-600/60 hover:bg-slate-800/70'
          }`}
        >
          <Upload className="mx-auto h-8 w-8 text-slate-500 mb-3" />
          <p className="text-sm font-medium text-slate-300">
            Drag & drop your <span className="text-violet-400">.xlsx</span> or <span className="text-violet-400">.csv</span> file here
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Columns: <span className="text-slate-400">Date, User, Action, Module, Details</span>
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.csv,.xls"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) parseFile(e.target.files[0]); }}
          />
        </div>

        {/* Preview table */}
        {preview.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Preview — first {preview.length} of {allRows.length} rows
            </p>
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-xs">
                <thead className="border-b border-slate-800 bg-slate-800/50">
                  <tr>
                    {['Date', 'User', 'Action', 'Module', 'Details'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-b border-slate-800/60 odd:bg-slate-800/20">
                      <td className="px-3 py-1.5 text-slate-300">{row.date}</td>
                      <td className="px-3 py-1.5 text-slate-300">{row.user}</td>
                      <td className="px-3 py-1.5 text-slate-300">{row.action}</td>
                      <td className="px-3 py-1.5">
                        <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-violet-300">{row.module}</span>
                      </td>
                      <td className="px-3 py-1.5 text-slate-500">{row.details ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">{allRows.length} rows ready to import</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setPreview([]); setAllRows([]); }}
                  className="border-slate-700 text-slate-400 hover:text-slate-200"
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={handleImport}
                  disabled={importing}
                  className="bg-violet-600 hover:bg-violet-500 text-white"
                >
                  {importing ? 'Importing…' : `Import ${allRows.length} rows`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Main Page ─── */
export default function AnalyticsPage() {
  const queryClient = useQueryClient();

  // Date range filter for summary
  const [summaryFrom, setSummaryFrom] = useState('');
  const [summaryTo, setSummaryTo] = useState('');

  // Log table filters
  const [filterUser, setFilterUser] = useState('');
  const [filterModule, setFilterModule] = useState('ALL');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [page, setPage] = useState(1);

  /* ── Queries ── */
  const summaryQ = useQuery<Summary>({
    queryKey: ['activity-logs-summary', summaryFrom, summaryTo],
    queryFn: () =>
      apiClient<Summary>('/activity-logs/summary', {
        params: { from: summaryFrom || undefined, to: summaryTo || undefined },
      }),
    staleTime: 30_000,
  });

  const logsQ = useQuery<LogsResponse>({
    queryKey: ['activity-logs', { filterUser, filterModule, filterFrom, filterTo, page }],
    queryFn: () =>
      apiClient<LogsResponse>('/activity-logs', {
        params: {
          user: filterUser || undefined,
          module: filterModule === 'ALL' ? undefined : filterModule,
          from: filterFrom || undefined,
          to: filterTo || undefined,
          page,
        },
      }),
    staleTime: 30_000,
  });

  const summary = summaryQ.data;
  const logs = logsQ.data;

  const topModule = summary?.eventsByModule[0]?.module ?? '—';
  const uniqueModules = summary?.eventsByModule.map((m) => m.module) ?? [];

  function formatDay(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  }

  return (
    <ProtectedRoute>
      <div className="p-6 space-y-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3">
          <LineChartIcon className="h-6 w-6 text-violet-400" />
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Activity Analytics
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Import logs, track usage patterns and module activity</p>
          </div>
        </div>

        {/* Section A — Import Panel */}
        <ImportPanel onImported={() => {
          void queryClient.invalidateQueries({ queryKey: ['activity-logs-summary'] });
          void queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        }} />

        {/* Summary date range filter */}
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Summary Date Range</span>
          <Input
            type="date"
            value={summaryFrom}
            onChange={(e) => setSummaryFrom(e.target.value)}
            className="w-40 border-slate-700 bg-slate-800/50 text-slate-300 text-sm"
            placeholder="From"
          />
          <span className="text-slate-600 text-sm">to</span>
          <Input
            type="date"
            value={summaryTo}
            onChange={(e) => setSummaryTo(e.target.value)}
            className="w-40 border-slate-700 bg-slate-800/50 text-slate-300 text-sm"
            placeholder="To"
          />
          {(summaryFrom || summaryTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSummaryFrom(''); setSummaryTo(''); }}
              className="text-slate-500 hover:text-slate-300"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Section B — Summary cards */}
        {summaryQ.isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-800/60" />
            ))}
          </div>
        ) : summary ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Events"
              value={summary.totalEvents.toLocaleString()}
              icon={Activity}
              gradient="from-violet-500/10 to-violet-600/5 border-violet-500/20"
            />
            <StatCard
              label="Active Days"
              value={summary.activeDays}
              icon={Calendar}
              gradient="from-blue-500/10 to-blue-600/5 border-blue-500/20"
            />
            <StatCard
              label="Unique Users"
              value={summary.uniqueUsers.length}
              icon={Users}
              gradient="from-emerald-500/10 to-emerald-600/5 border-emerald-500/20"
            />
            <StatCard
              label="Top Module"
              value={topModule}
              icon={Layers}
              gradient="from-amber-500/10 to-amber-600/5 border-amber-500/20"
            />
          </div>
        ) : null}

        {/* Section C — Charts */}
        {summary && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1 — Events by Day */}
            <Card className="border-slate-800 bg-slate-900/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-300">Events by Day</CardTitle>
              </CardHeader>
              <CardContent>
                {summary.eventsByDay.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-slate-600 text-sm">No data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={summary.eventsByDay} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDay}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                        labelStyle={{ color: '#94a3b8', fontSize: 12 }}
                        itemStyle={{ color: '#a78bfa' }}
                        labelFormatter={(label) => formatDay(String(label))}
                      />
                      <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Chart 2 — Events by Module (horizontal) */}
            <Card className="border-slate-800 bg-slate-900/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-300">Events by Module</CardTitle>
              </CardHeader>
              <CardContent>
                {summary.eventsByModule.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-slate-600 text-sm">No data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      layout="vertical"
                      data={summary.eventsByModule.slice(0, 8)}
                      margin={{ top: 4, right: 20, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="module"
                        width={90}
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                        labelStyle={{ color: '#94a3b8', fontSize: 12 }}
                        itemStyle={{ color: '#60a5fa' }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {summary.eventsByModule.slice(0, 8).map((_, i) => (
                          <Cell key={i} fill={MODULE_COLORS[i % MODULE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Section C — Full Log Table */}
        <Card className="border-slate-800 bg-slate-900/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-300">Full Activity Log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-36">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <Input
                  placeholder="Search user…"
                  value={filterUser}
                  onChange={(e) => { setFilterUser(e.target.value); setPage(1); }}
                  className="pl-8 border-slate-700 bg-slate-800/50 text-slate-300 text-sm h-9"
                />
              </div>
              <Select
                value={filterModule}
                onValueChange={(v) => { setFilterModule(v ?? 'ALL'); setPage(1); }}
              >
                <SelectTrigger className="w-44 border-slate-700 bg-slate-800/50 text-slate-300 text-sm h-9">
                  <SelectValue placeholder="All modules" />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-900">
                  <SelectItem value="ALL">All modules</SelectItem>
                  {uniqueModules.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={filterFrom}
                onChange={(e) => { setFilterFrom(e.target.value); setPage(1); }}
                className="w-36 border-slate-700 bg-slate-800/50 text-slate-300 text-sm h-9"
              />
              <span className="text-slate-600 text-xs">to</span>
              <Input
                type="date"
                value={filterTo}
                onChange={(e) => { setFilterTo(e.target.value); setPage(1); }}
                className="w-36 border-slate-700 bg-slate-800/50 text-slate-300 text-sm h-9"
              />
              {(filterUser || filterModule !== 'ALL' || filterFrom || filterTo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setFilterUser(''); setFilterModule('ALL'); setFilterFrom(''); setFilterTo(''); setPage(1); }}
                  className="text-slate-500 hover:text-slate-300 h-9"
                >
                  Reset
                </Button>
              )}
            </div>

            {/* Table */}
            {logsQ.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-9 animate-pulse rounded bg-slate-800/50" />
                ))}
              </div>
            ) : logs && logs.data.length > 0 ? (
              <>
                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800 hover:bg-transparent">
                        <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Date</TableHead>
                        <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider">User</TableHead>
                        <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Module</TableHead>
                        <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Action</TableHead>
                        <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.data.map((log) => (
                        <TableRow key={log.id} className="border-slate-800 hover:bg-slate-800/40">
                          <TableCell className="text-slate-400 text-sm tabular-nums">
                            {new Date(log.date).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm font-medium">{log.user}</TableCell>
                          <TableCell>
                            <span className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs font-medium text-violet-300">
                              {log.module}
                            </span>
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm">{log.action}</TableCell>
                          <TableCell className="text-slate-500 text-sm max-w-xs truncate">{log.details ?? '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-slate-500">
                    Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, logs.total)} of{' '}
                    <span className="text-slate-300 font-medium">{logs.total}</span> events
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="border-slate-700 text-slate-400 hover:text-slate-200 h-8 gap-1"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Previous
                    </Button>
                    <span className="text-xs text-slate-500">Page {page} of {Math.ceil(logs.total / 50)}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page * 50 >= logs.total}
                      className="border-slate-700 text-slate-400 hover:text-slate-200 h-8 gap-1"
                    >
                      Next
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Activity className="h-10 w-10 text-slate-700 mb-3" />
                <p className="text-slate-500 text-sm">No activity logs found.</p>
                <p className="text-slate-600 text-xs mt-1">Import a file above to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </ProtectedRoute>
  );
}
