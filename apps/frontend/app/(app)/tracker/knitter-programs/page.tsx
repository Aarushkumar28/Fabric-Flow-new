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
import { PlusCircle, Pencil, Trash2, AlertTriangle, Scissors } from 'lucide-react';
import type {
  KnitterProgram,
  KnitterProgramFormData,
  Knitter,
  YarnLot,
} from '@/types/entities';
import type { Dyer } from '@/types/yarn';
import { ProtectedRoute } from '@/components/auth/protected-route';

const SELECT_CLASS =
  'w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all';

interface KnitterProgramExtended extends KnitterProgramFormData {
  gsm: string;
  lycraUsed: boolean;
  lycraPercent: string;
  blendType: string;
  gauge: string;
}

const EMPTY_FORM: KnitterProgramExtended = {
  knitterId: '',
  yarnLotId: '',
  quantityUsed: '',
  greyWeight: '',
  numRolls: '',
  dia: '',
  gg: '',
  loopLength: '',
  fabricName: '',
  fabricColour: '',
  programmeRef: '',
  preAssignedDyerId: '',
  programDate: new Date().toISOString().split('T')[0],
  gsm: '',
  lycraUsed: false,
  lycraPercent: '2.5',
  blendType: 'Lycra',
  gauge: '',
};

export default function KnitterProgramsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<KnitterProgram | null>(null);
  const [formData, setFormData] = useState<KnitterProgramExtended>(EMPTY_FORM);

  const { data: programs = [], isLoading } = useQuery<KnitterProgram[]>({
    queryKey: ['knitter-programs'],
    queryFn: async () => (await api.get<KnitterProgram[]>('/knitter-programs')).data,
  });

  const { data: knitters = [] } = useQuery<Knitter[]>({
    queryKey: ['knitters'],
    queryFn: async () => (await api.get<Knitter[]>('/knitters')).data,
  });

  const { data: yarnLots = [] } = useQuery<YarnLot[]>({
    queryKey: ['yarn-lots'],
    queryFn: async () => (await api.get<YarnLot[]>('/yarn-lots')).data,
  });

  const { data: dyers = [] } = useQuery<Dyer[]>({
    queryKey: ['dyers'],
    queryFn: async () => (await api.get<Dyer[]>('/dyers')).data,
  });

  const createMutation = useMutation<KnitterProgram, Error, Record<string, unknown>>({
    mutationFn: (body) => api.post<KnitterProgram>('/knitter-programs', body).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knitter-programs'] });
      queryClient.invalidateQueries({ queryKey: ['knitter-stock'] });
      toast.success('Knitter program recorded');
      closeDialogs();
    },
    onError: (error: Error) => {
      const message = (error as unknown as { response?: { data?: { message?: string } } })
        .response?.data?.message || 'Failed to record program';
      toast.error(message);
    },
  });

  const deleteMutation = useMutation<unknown, Error, number>({
    mutationFn: (id) => api.delete(`/knitter-programs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knitter-programs'] });
      toast.success('Program deleted');
    },
    onError: () => toast.error('Delete not supported by backend yet'),
  });

  const closeDialogs = () => {
    setCreateOpen(false);
    setEditRecord(null);
    setFormData(EMPTY_FORM);
  };

  const openEditDialog = (record: KnitterProgram) => {
    setEditRecord(record);
    setFormData({
      knitterId: String(record.knitterId),
      yarnLotId: String(record.yarnLotId),
      quantityUsed: String(record.quantityUsed),
      greyWeight: String(record.greyWeight),
      numRolls: record.numRolls != null ? String(record.numRolls) : '',
      dia: record.dia ?? '',
      gg: record.gg ?? '',
      loopLength: record.loopLength ?? '',
      fabricName: record.fabricName ?? '',
      fabricColour: record.fabricColour ?? '',
      programmeRef: record.programmeRef ?? '',
      preAssignedDyerId: record.preAssignedDyerId != null ? String(record.preAssignedDyerId) : '',
      programDate: record.programDate?.split('T')[0] ?? new Date().toISOString().split('T')[0],
      gsm: '',
      lycraUsed: !!(record as unknown as { blendType?: string }).blendType,
      lycraPercent: String((record as unknown as { blendPercent?: number }).blendPercent ?? '2.5'),
      blendType: (record as unknown as { blendType?: string }).blendType ?? 'Lycra',
      gauge: '',
    });
  };

  const confirmDelete = (id: number) => {
    if (window.confirm('Delete this knitter program?')) deleteMutation.mutate(id);
  };

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(programs.map((p) => api.delete(`/knitter-programs/${p.id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knitter-programs'] });
      toast.success('All programs deleted!');
    },
    onError: () => toast.error('Failed to delete some programs'),
  });

  const confirmDeleteAll = () => {
    if (programs.length === 0) return;
    if (window.confirm(`Delete ALL ${programs.length} knitter programs? This cannot be undone.`)) {
      deleteAllMutation.mutate();
    }
  };

  // Live Lycra calculation
  const yarnUsedVal = parseFloat(formData.quantityUsed) || 0;
  const lycraPercentVal = parseFloat(formData.lycraPercent) || 0;
  const effectiveWeight = formData.lycraUsed
    ? yarnUsedVal + (yarnUsedVal * lycraPercentVal / 100)
    : yarnUsedVal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      knitterId: parseInt(formData.knitterId),
      yarnLotId: parseInt(formData.yarnLotId),
      quantityUsed: parseFloat(formData.quantityUsed),
      greyWeight: parseFloat(formData.greyWeight),
      numRolls: formData.numRolls ? parseInt(formData.numRolls) : undefined,
      dia: formData.dia || undefined,
      gg: formData.gg || formData.gauge || undefined,
      loopLength: formData.loopLength || undefined,
      fabricName: formData.fabricName || undefined,
      fabricColour: formData.fabricColour || undefined,
      programmeRef: formData.programmeRef || undefined,
      preAssignedDyerId: formData.preAssignedDyerId ? parseInt(formData.preAssignedDyerId) : undefined,
      programDate: formData.programDate,
      blendType: formData.lycraUsed ? formData.blendType : undefined,
      blendPercent: formData.lycraUsed ? parseFloat(formData.lycraPercent) || undefined : undefined,
    };
    createMutation.mutate(payload);
  };

  const isPending = createMutation.isPending;

  return (
    <ProtectedRoute>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              Knitting Programs
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {isLoading ? 'Loading…' : `${programs.length} program${programs.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={confirmDeleteAll}
              disabled={deleteAllMutation.isPending || programs.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/20 transition-all disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete All
            </button>
            <button
              onClick={() => { setEditRecord(null); setFormData(EMPTY_FORM); setCreateOpen(true); }}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition-all duration-200"
            >
              <PlusCircle className="h-4 w-4" /> Record Production
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 bg-slate-900/80 hover:bg-slate-900/80">
                  {['Program No', 'Date', 'Knitter', 'Yarn Lots (HF Code)', 'Total Yarn (kg)', 'Grey Wt (kg)', 'Rolls', 'Dia', 'Gauge', 'Loop Len', 'Fabric', 'Dyer', 'Anomaly', 'Actions'].map(h => (
                    <TableHead key={h} className="text-xs font-semibold uppercase tracking-widest text-slate-400">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i} className="border-slate-800">
                      {Array.from({ length: 14 }).map((__, j) => (
                        <TableCell key={j}><div className="h-4 rounded bg-slate-800 animate-pulse" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : programs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="py-12 text-center text-sm text-slate-500">
                      No knitting programs yet. Click &quot;Record Production&quot; to create one.
                    </TableCell>
                  </TableRow>
                ) : programs.map((p) => (
                  <TableRow key={p.id} className="border-slate-800/60 hover:bg-slate-800/20 transition-colors">
                    <TableCell className="font-mono text-sm font-semibold text-indigo-300">{p.programNo ?? `#${p.id}`}</TableCell>
                    <TableCell className="text-slate-300 text-sm">{new Date(p.programDate).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell className="text-slate-200">{p.knitter?.name ?? '–'}</TableCell>
                    <TableCell className="font-mono text-sm font-semibold text-teal-300">{p.yarnLot?.hfCode ?? '–'}</TableCell>
                    <TableCell className="text-slate-300">{Number(p.quantityUsed).toFixed(2)}</TableCell>
                    <TableCell className="font-semibold text-slate-200">{Number(p.greyWeight).toFixed(2)}</TableCell>
                    <TableCell className="text-slate-300">{p.numRolls ?? '–'}</TableCell>
                    <TableCell className="text-slate-300">{p.dia ?? '–'}</TableCell>
                    <TableCell className="text-slate-300">{p.gg ?? '–'}</TableCell>
                    <TableCell className="text-slate-300">{p.loopLength ?? '–'}</TableCell>
                    <TableCell className="text-slate-300">{p.fabricName ? `${p.fabricName} (${p.fabricColour ?? ''})` : '–'}</TableCell>
                    <TableCell className="text-slate-300">{p.preAssignedDyer?.name ?? '–'}</TableCell>
                    <TableCell>
                      {p.anomalyFlag && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                          <AlertTriangle className="h-3 w-3" /> Flag
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <button title="Edit" onClick={() => openEditDialog(p)}
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-xs text-blue-300 hover:bg-blue-500/20 transition-all">
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button title="Delete" onClick={() => confirmDelete(p.id)} disabled={deleteMutation.isPending}
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
          {programs.length > 0 && !isLoading && (
            <div className="border-t border-slate-800/60 px-4 py-2.5 text-right">
              <span className="text-xs text-slate-500">{programs.length} record{programs.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Create / Edit Dialog */}
        <Dialog open={createOpen || editRecord !== null} onOpenChange={(open) => { if (!open) closeDialogs(); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-100 flex items-center gap-2">
                <Scissors className="h-5 w-5 text-teal-400" />
                {editRecord ? 'Edit Knitting Program' : 'New Knitting Production'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              {/* Row 1 — Date + Knitter */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Program Date</Label>
                  <Input type="date" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={formData.programDate} onChange={(e) => setFormData({ ...formData, programDate: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Knitter <span className="text-rose-400">*</span></Label>
                  <select required className={SELECT_CLASS} value={formData.knitterId}
                    onChange={(e) => setFormData({ ...formData, knitterId: e.target.value })}>
                    <option value="">Select Knitter…</option>
                    {knitters.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2 — Yarn Lot + Ref */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Yarn Lot (HF Code) <span className="text-rose-400">*</span></Label>
                  <select required className={SELECT_CLASS} value={formData.yarnLotId}
                    onChange={(e) => setFormData({ ...formData, yarnLotId: e.target.value })}>
                    <option value="">Select Lot…</option>
                    {yarnLots.map(l => <option key={l.id} value={l.id}>{l.hfCode} — {l.availableWeight}kg avail</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Programme Ref</Label>
                  <Input placeholder="e.g. PROG-001" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={formData.programmeRef} onChange={(e) => setFormData({ ...formData, programmeRef: e.target.value })} />
                </div>
              </div>

              {/* Row 3 — Yarn Used + Grey Weight + Rolls */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Yarn Used (kg) <span className="text-rose-400">*</span></Label>
                  <Input type="number" step="0.01" min="0" required className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={formData.quantityUsed} onChange={(e) => setFormData({ ...formData, quantityUsed: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Grey Weight (kg) <span className="text-rose-400">*</span></Label>
                  <Input type="number" step="0.01" min="0" required className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={formData.greyWeight} onChange={(e) => setFormData({ ...formData, greyWeight: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Number of Rolls</Label>
                  <Input type="number" min="0" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={formData.numRolls} onChange={(e) => setFormData({ ...formData, numRolls: e.target.value })} />
                </div>
              </div>

              {/* Row 4 — Machine Specs: Dia, Gauge, Loop Length, GSM */}
              <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Machine / Fabric Specs</p>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Dia</Label>
                    <Input placeholder='e.g. 72"' className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                      value={formData.dia} onChange={(e) => setFormData({ ...formData, dia: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Gauge (GG)</Label>
                    <Input placeholder="e.g. 28" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                      value={formData.gauge || formData.gg} onChange={(e) => setFormData({ ...formData, gauge: e.target.value, gg: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Loop Length</Label>
                    <Input placeholder="e.g. 2.80" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                      value={formData.loopLength} onChange={(e) => setFormData({ ...formData, loopLength: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-400 mb-1.5 block">GSM</Label>
                    <Input placeholder="e.g. 180" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                      value={formData.gsm} onChange={(e) => setFormData({ ...formData, gsm: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Row 5 — Blend Toggle */}
              <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={formData.lycraUsed}
                      onChange={(e) => setFormData({ ...formData, lycraUsed: e.target.checked })} />
                    <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-teal-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                  </label>
                  <span className="text-sm text-slate-300 font-medium">Blend Material Used</span>
                </div>
                {formData.lycraUsed && (
                  <div className="grid grid-cols-4 gap-4 mt-2">
                    <div>
                      <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Blend Type</Label>
                      <select className={SELECT_CLASS} value={formData.blendType}
                        onChange={(e) => setFormData({ ...formData, blendType: e.target.value })}>
                        <option value="Lycra">Lycra</option>
                        <option value="Spandex">Spandex</option>
                        <option value="Polyester">Polyester</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Blend %</Label>
                      <select className={SELECT_CLASS} value={formData.lycraPercent}
                        onChange={(e) => setFormData({ ...formData, lycraPercent: e.target.value })}>
                        <option value="2.5">2.5%</option>
                        <option value="5">5%</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    {formData.lycraPercent === 'custom' && (
                      <div>
                        <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Custom %</Label>
                        <Input type="number" step="0.1" min="0" max="50" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                          onChange={(e) => setFormData({ ...formData, lycraPercent: e.target.value })} />
                      </div>
                    )}
                    <div>
                      <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Est. Yarn+Blend Wt</Label>
                      <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-emerald-400 font-semibold">
                        {effectiveWeight.toFixed(2)} kg
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Informational only — Grey Weight must be entered manually</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Row 6 — Fabric Name + Colour + Dyer */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Fabric Name</Label>
                  <Input placeholder="e.g. Single Jersey" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={formData.fabricName} onChange={(e) => setFormData({ ...formData, fabricName: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Fabric Colour</Label>
                  <Input placeholder="e.g. Grey" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={formData.fabricColour} onChange={(e) => setFormData({ ...formData, fabricColour: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Pre-Assigned Dyer</Label>
                  <select className={SELECT_CLASS} value={formData.preAssignedDyerId}
                    onChange={(e) => setFormData({ ...formData, preAssignedDyerId: e.target.value })}>
                    <option value="">None</option>
                    {dyers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={closeDialogs}
                  className="border-slate-700 hover:bg-slate-800 text-slate-300">
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}
                  className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold disabled:opacity-60">
                  {isPending ? 'Saving…' : editRecord ? 'Update Program' : 'Record Production'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
