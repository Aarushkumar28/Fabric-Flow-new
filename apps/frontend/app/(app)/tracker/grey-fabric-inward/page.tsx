'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil, Trash2, Layers, Palette, ChevronDown } from 'lucide-react';
import type { GreyFabricInward, GreyFabricInwardFormData } from '@/types/entities';
import { ProtectedRoute } from '@/components/auth/protected-route';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Knitter { id: number; name: string }
interface Dyeing {
  id: number;
  lotNo: string;
  hfCode?: string | null;
  finalWeight?: number | null;
  initialWeight: number;
  processLoss?: number | null;
  status?: string | null;
  colour?: { id: number; name: string; code: string } | null;
  dyer?: { id: number; name: string } | null;
  memoLine?: {
    greyFabricLot?: { knitter?: { id: number; name: string } | null } | null;
    knittingLot?: { knitting?: { knitter?: { id: number; name: string } | null } | null } | null;
  } | null;
}
interface GreyFabricLotFull {
  id: number;
  lotNumber: string;
  greyWeight: number;
  rollCount?: number | null;
  source: 'KNITTED' | 'PURCHASED';
  status: string;
  knitter?: { id: number; name: string } | null;
  knitterProgram?: { yarnLot?: { hfCode: string } | null } | null;
  createdAt: string;
}

const SELECT_CLASS =
  'w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all';

const EMPTY_FORM: GreyFabricInwardFormData = {
  receiptDate: new Date().toISOString().split('T')[0],
  supplierName: '',
  fabricType: '',
  colour: '',
  totalWeight: '',
  rollCount: '',
  ratePerKg: '',
  purchaseAccount: 'C.N.T.LLP',
  remarks: '',
};

const fmt = (v: number | null | undefined, prefix = '') =>
  v != null ? `${prefix}${Number(v).toFixed(2)}` : '–';

// Helper to resolve knitter from dyeing memo chain
function resolveKnitter(d: Dyeing) {
  return (
    d.memoLine?.greyFabricLot?.knitter?.name ??
    d.memoLine?.knittingLot?.knitting?.knitter?.name ??
    '–'
  );
}
function resolveKnitterId(d: Dyeing) {
  return (
    d.memoLine?.greyFabricLot?.knitter?.id ??
    d.memoLine?.knittingLot?.knitting?.knitter?.id ??
    null
  );
}

type TabKey = 'grey' | 'coloured';

export default function FabricInventoryPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('grey');
  const [createOpen, setCreateOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<GreyFabricInward | null>(null);
  const [form, setForm] = useState<GreyFabricInwardFormData>(EMPTY_FORM);
  const [knitterFilter, setKnitterFilter] = useState('');

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: records = [], isLoading } = useQuery<GreyFabricInward[]>({
    queryKey: ['grey-fabric-inward'],
    queryFn: async () => (await api.get<GreyFabricInward[]>('/grey-fabric-inward')).data,
  });

  const { data: greyLots = [], isLoading: greyLotsLoading } = useQuery<GreyFabricLotFull[]>({
    queryKey: ['grey-fabric-lots'],
    queryFn: async () => (await api.get<GreyFabricLotFull[]>('/grey-fabric-lots')).data,
  });

  const { data: dyeings = [], isLoading: dyeingsLoading } = useQuery<Dyeing[]>({
    queryKey: ['dyeings'],
    queryFn: async () => (await api.get<Dyeing[]>('/dyeings')).data,
    enabled: activeTab === 'coloured',
  });

  const { data: knitters = [] } = useQuery<Knitter[]>({
    queryKey: ['knitters'],
    queryFn: async () => (await api.get<Knitter[]>('/knitters')).data,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation<GreyFabricInward, Error, Record<string, unknown>>({
    mutationFn: (body) => api.post<GreyFabricInward>('/grey-fabric-inward', body).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grey-fabric-inward'] });
      toast.success('Fabric record created');
      closeDialogs();
    },
    onError: () => toast.error('Failed to create record'),
  });

  const updateMutation = useMutation<GreyFabricInward, Error, { id: number } & Record<string, unknown>>({
    mutationFn: ({ id, ...body }) => api.patch<GreyFabricInward>(`/grey-fabric-inward/${id}`, body).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grey-fabric-inward'] });
      toast.success('Fabric record updated');
      closeDialogs();
    },
    onError: () => toast.error('Failed to update record'),
  });

  const deleteMutation = useMutation<unknown, Error, number>({
    mutationFn: (id) => api.delete(`/grey-fabric-inward/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grey-fabric-inward'] });
      toast.success('Record deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  const closeDialogs = () => {
    setCreateOpen(false);
    setEditRecord(null);
    setForm(EMPTY_FORM);
  };

  const openEdit = (r: GreyFabricInward) => {
    setEditRecord(r);
    setForm({
      receiptDate: r.receiptDate?.split('T')[0] ?? '',
      supplierName: r.supplierName,
      fabricType: r.fabricType ?? '',
      colour: r.colour ?? '',
      totalWeight: String(r.totalWeight),
      rollCount: r.rollCount != null ? String(r.rollCount) : '',
      ratePerKg: r.ratePerKg != null ? String(r.ratePerKg) : '',
      purchaseAccount: r.purchaseAccount ?? 'C.N.T.LLP',
      remarks: r.remarks ?? '',
    });
  };

  const confirmDelete = (id: number) => {
    if (window.confirm('Delete this fabric record?')) deleteMutation.mutate(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      receiptDate: form.receiptDate,
      supplierName: form.supplierName,
      fabricType: form.fabricType || undefined,
      colour: form.colour || undefined,
      totalWeight: Number(form.totalWeight),
      rollCount: form.rollCount ? Number(form.rollCount) : undefined,
      ratePerKg: form.ratePerKg ? Number(form.ratePerKg) : undefined,
      purchaseAccount: form.purchaseAccount || undefined,
      remarks: form.remarks || undefined,
    };
    if (editRecord) updateMutation.mutate({ id: editRecord.id, ...payload });
    else createMutation.mutate(payload);
  };

  const totalCost = Number(form.totalWeight || 0) * Number(form.ratePerKg || 0);
  const isPending = createMutation.isPending || updateMutation.isPending;

  // ── Filtered data ─────────────────────────────────────────────────────────
  const filteredGreyLots = knitterFilter
    ? greyLots.filter(l => String(l.knitter?.id) === knitterFilter)
    : greyLots;

  const colouredWithFinalWeight = dyeings.filter(d => d.finalWeight != null);
  const filteredColoured = knitterFilter
    ? colouredWithFinalWeight.filter(d => String(resolveKnitterId(d)) === knitterFilter)
    : colouredWithFinalWeight;

  // ── Tab definitions ────────────────────────────────────────────────────────
  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'grey', label: 'Grey Fabric', icon: <Layers className="h-4 w-4" /> },
    { key: 'coloured', label: 'Coloured Fabric', icon: <Palette className="h-4 w-4" /> },
  ];

  return (
    <ProtectedRoute>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              Fabric Inventory
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Grey &amp; Coloured fabric stock across all knitters
            </p>
          </div>
          {activeTab === 'grey' && (
            <button
              onClick={() => { setEditRecord(null); setForm(EMPTY_FORM); setCreateOpen(true); }}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition-all duration-200"
            >
              <PlusCircle className="h-4 w-4" /> Add Fabric Inward
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/40 p-1 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-slate-700 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Knitter Filter */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={knitterFilter}
              onChange={(e) => setKnitterFilter(e.target.value)}
              className="rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 pr-8 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all appearance-none"
            >
              <option value="">All Knitters</option>
              {knitters.map(k => (
                <option key={k.id} value={k.id}>{k.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
          </div>
          {knitterFilter && (
            <button
              onClick={() => setKnitterFilter('')}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Clear filter
            </button>
          )}
        </div>

        {/* ── GREY FABRIC TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'grey' && (
          <>
            {/* Purchase Inward records */}
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-3">
                Grey Fabric Purchases
              </h2>
              <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800 bg-slate-900/80 hover:bg-slate-900/80">
                        {['Date', 'Supplier', 'Fabric Type', 'Colour', 'Weight (kg)', 'Rolls', 'Rate/kg', 'Total Cost', 'Account', 'Actions'].map(h => (
                          <TableHead key={h} className="text-xs font-semibold uppercase tracking-widest text-slate-400">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <TableRow key={i} className="border-slate-800">
                            {Array.from({ length: 10 }).map((__, j) => (
                              <TableCell key={j}><div className="h-4 rounded bg-slate-800 animate-pulse" /></TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : records.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="py-12 text-center text-sm text-slate-500">
                            No fabric records yet. Click &quot;Add Fabric Inward&quot; to create one.
                          </TableCell>
                        </TableRow>
                      ) : records.map((r) => (
                        <TableRow key={r.id} className="border-slate-800/60 hover:bg-slate-800/20 transition-colors">
                          <TableCell className="text-slate-300 text-sm">{new Date(r.receiptDate).toLocaleDateString('en-IN')}</TableCell>
                          <TableCell className="text-slate-200 font-medium">{r.supplierName}</TableCell>
                          <TableCell className="text-slate-300">{r.fabricType ?? '–'}</TableCell>
                          <TableCell className="text-slate-300">{r.colour ?? '–'}</TableCell>
                          <TableCell className="font-semibold text-slate-200">{fmt(r.totalWeight)} kg</TableCell>
                          <TableCell className="text-slate-300">{r.rollCount ?? '–'}</TableCell>
                          <TableCell className="text-slate-300">{fmt(r.ratePerKg, '₹')}</TableCell>
                          <TableCell className="font-semibold text-emerald-400">{fmt(r.totalCost, '₹')}</TableCell>
                          <TableCell className="text-slate-400 text-xs">{r.purchaseAccount ?? '–'}</TableCell>
                          <TableCell>
                            <div className="flex gap-1.5">
                              <button title="Edit" onClick={() => openEdit(r)}
                                className="inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-xs text-blue-300 hover:bg-blue-500/20 transition-all">
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button title="Delete" onClick={() => confirmDelete(r.id)} disabled={deleteMutation.isPending}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/20 transition-all disabled:opacity-50">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Grey Fabric Lots (AVAILABLE) */}
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-3">
                Grey Fabric Lots (Available Stock)
              </h2>
              <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800 bg-slate-900/80 hover:bg-slate-900/80">
                        {['Code', 'Lot Number', 'Knitter', 'Grey Weight (kg)', 'Rolls', 'Source', 'Status'].map(h => (
                          <TableHead key={h} className="text-xs font-semibold uppercase tracking-widest text-slate-400">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {greyLotsLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <TableRow key={i} className="border-slate-800">
                            {Array.from({ length: 7 }).map((__, j) => (
                              <TableCell key={j}><div className="h-4 rounded bg-slate-800 animate-pulse" /></TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : filteredGreyLots.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-8 text-center text-sm text-slate-500">
                            No grey fabric lots found.
                          </TableCell>
                        </TableRow>
                      ) : filteredGreyLots.map((lot) => (
                        <TableRow key={lot.id} className="border-slate-800/60 hover:bg-slate-800/20 transition-colors">
                          <TableCell className="font-mono text-xs font-semibold text-fuchsia-400">GF-{lot.lotNumber}</TableCell>
                          <TableCell className="text-slate-200 font-medium">{lot.lotNumber}</TableCell>
                          <TableCell className="text-slate-200">{lot.knitter?.name ?? '–'}</TableCell>
                          <TableCell className="font-semibold text-slate-200">{Number(lot.greyWeight).toFixed(2)} kg</TableCell>
                          <TableCell className="text-slate-300">{lot.rollCount ?? '–'}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              lot.source === 'KNITTED'
                                ? 'bg-blue-500/15 text-blue-300'
                                : 'bg-violet-500/15 text-violet-300'
                            }`}>
                              {lot.source}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              lot.status === 'AVAILABLE' ? 'bg-emerald-500/15 text-emerald-300' :
                              lot.status === 'DISPATCHED' ? 'bg-amber-500/15 text-amber-300' :
                              'bg-slate-500/15 text-slate-400'
                            }`}>
                              {lot.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {filteredGreyLots.length > 0 && (
                  <div className="border-t border-slate-800/60 px-4 py-2.5 flex justify-between">
                    <span className="text-xs text-slate-500">
                      Total: <span className="text-slate-300 font-medium">
                        {filteredGreyLots.reduce((s, l) => s + Number(l.greyWeight), 0).toFixed(2)} kg
                      </span>
                    </span>
                    <span className="text-xs text-slate-500">{filteredGreyLots.length} lot{filteredGreyLots.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── COLOURED FABRIC TAB ──────────────────────────────────────────────── */}
        {activeTab === 'coloured' && (
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 bg-slate-900/80 hover:bg-slate-900/80">
                    {['Code', 'Lot No.', 'Knitter', 'Colour', 'Dyer', 'Final Weight (kg)', 'Process Loss', 'Status'].map(h => (
                      <TableHead key={h} className="text-xs font-semibold uppercase tracking-widest text-slate-400">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dyeingsLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i} className="border-slate-800">
                        {Array.from({ length: 9 }).map((__, j) => (
                          <TableCell key={j}><div className="h-4 rounded bg-slate-800 animate-pulse" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filteredColoured.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-12 text-center text-sm text-slate-500">
                        No completed dyeing records found. Final weight must be recorded for fabric to appear here.
                      </TableCell>
                    </TableRow>
                  ) : filteredColoured.map((d) => (
                    <TableRow key={d.id} className="border-slate-800/60 hover:bg-slate-800/20 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold text-violet-400">CF-{d.lotNo}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-300">{d.lotNo}</TableCell>
                      <TableCell className="text-slate-200">{resolveKnitter(d)}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-slate-200 text-sm">
                          {d.colour?.name ?? '–'}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-200">{d.dyer?.name ?? '–'}</TableCell>
                      <TableCell className="font-semibold text-emerald-400 whitespace-nowrap">
                        {d.finalWeight != null ? `${Number(d.finalWeight).toFixed(2)} kg` : '–'}
                      </TableCell>
                      <TableCell className="text-slate-400 text-xs">
                        {d.processLoss != null ? `${Number(d.processLoss).toFixed(2)} kg` : '–'}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          d.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-300' :
                          d.status === 'IN_DYEING' ? 'bg-blue-500/15 text-blue-300' :
                          d.status === 'SENT' ? 'bg-amber-500/15 text-amber-300' :
                          'bg-slate-500/15 text-slate-400'
                        }`}>
                          {d.status ?? 'PENDING'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredColoured.length > 0 && (
              <div className="border-t border-slate-800/60 px-4 py-2.5 flex justify-between">
                <span className="text-xs text-slate-500">
                  Total: <span className="text-slate-300 font-medium">
                    {filteredColoured.reduce((s, d) => s + Number(d.finalWeight ?? 0), 0).toFixed(2)} kg
                  </span>
                </span>
                <span className="text-xs text-slate-500">{filteredColoured.length} record{filteredColoured.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        )}

        {/* Create / Edit Dialog (Grey Fabric Inward only) */}
        <Dialog open={createOpen || editRecord !== null} onOpenChange={(open) => { if (!open) closeDialogs(); }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-100 flex items-center gap-2">
                <Layers className="h-5 w-5 text-fuchsia-400" />
                {editRecord ? 'Edit Fabric Record' : 'New Grey Fabric Inward'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Receipt Date</Label>
                  <Input type="date" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={form.receiptDate} onChange={(e) => setForm({ ...form, receiptDate: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Supplier Name <span className="text-rose-400">*</span></Label>
                  <Input required placeholder="e.g. ABC Textiles" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Fabric Type</Label>
                  <Input placeholder="e.g. INTERLOCK" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={form.fabricType} onChange={(e) => setForm({ ...form, fabricType: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Colour</Label>
                  <Input placeholder="e.g. Grey" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={form.colour} onChange={(e) => setForm({ ...form, colour: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Total Weight (kg) <span className="text-rose-400">*</span></Label>
                  <Input type="number" step="0.01" min="0" required className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={form.totalWeight} onChange={(e) => setForm({ ...form, totalWeight: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Roll Count</Label>
                  <Input type="number" min="0" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={form.rollCount} onChange={(e) => setForm({ ...form, rollCount: e.target.value })} />
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Rate per Kg (₹)</Label>
                <Input type="number" step="0.01" min="0" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                  value={form.ratePerKg} onChange={(e) => setForm({ ...form, ratePerKg: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Purchase Account</Label>
                  <Input placeholder="C.N.T.LLP" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={form.purchaseAccount} onChange={(e) => setForm({ ...form, purchaseAccount: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Remarks</Label>
                  <Input placeholder="Optional" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
                </div>
              </div>

              {/* Cost Summary */}
              <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total Cost</span>
                  <span className="text-lg font-bold text-emerald-400">₹{totalCost.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={closeDialogs}
                  className="border-slate-700 hover:bg-slate-800 text-slate-300">
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}
                  className="flex-1 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-semibold disabled:opacity-60">
                  {isPending ? 'Saving…' : editRecord ? 'Update Record' : 'Create Record'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
