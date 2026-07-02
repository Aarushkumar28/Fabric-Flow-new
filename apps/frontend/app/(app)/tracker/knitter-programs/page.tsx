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
  yarns: [],
  greyWeight: '',
  dia: '',
  gg: '',
  loopLength: '',
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

  const { data: knitterStock = [] } = useQuery<{ id: number; yarnLotId: number; remainingWeight: number; yarnLot: YarnLot }[]>({
    queryKey: ['knitter-stock', formData.knitterId],
    queryFn: async () => (await api.get(`/knitter-stock/knitter/${formData.knitterId}`)).data,
    enabled: !!formData.knitterId,
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
      queryClient.invalidateQueries({ queryKey: ['knitter-stock'] });
      toast.success('Program deleted');
    },
    onError: () => toast.error('Delete failed'),
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
      yarns: record.yarnUsages?.map(u => ({
        yarnLotId: String(u.yarnLotId),
        quantityUsed: String(u.quantityUsed)
      })) || (record.yarnLotId ? [{ yarnLotId: String(record.yarnLotId), quantityUsed: String(record.quantityUsed) }] : []),
      greyWeight: String(record.greyWeight),
      dia: record.dia ?? '',
      gg: record.gg ?? '',
      loopLength: record.loopLength ?? '',
      programDate: record.programDate?.split('T')[0] ?? new Date().toISOString().split('T')[0],
      gsm: '',
      lycraUsed: !!(record as unknown as { blendType?: string }).blendType,
      lycraPercent: String((record as unknown as { blendPercent?: number }).blendPercent ?? '2.5'),
      blendType: (record as unknown as { blendType?: string }).blendType ?? 'Lycra',
      gauge: '',
    });
    setCreateOpen(true);
  };

  const confirmDelete = (id: number) => {
    if (window.confirm('Delete this knitter program? This will also revert yarn stock back to the knitter.')) deleteMutation.mutate(id);
  };

  // Live Lycra calculation
  const totalYarnUsed = formData.yarns.reduce((sum, y) => sum + (parseFloat(y.quantityUsed) || 0), 0);
  const lycraPercentVal = parseFloat(formData.lycraPercent) || 0;
  const effectiveWeight = formData.lycraUsed
    ? totalYarnUsed + (totalYarnUsed * lycraPercentVal / 100)
    : totalYarnUsed;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.yarns.length === 0) {
      toast.error('Please add at least one yarn lot.');
      return;
    }

    const payload: Record<string, unknown> = {
      knitterId: parseInt(formData.knitterId),
      yarns: formData.yarns.map(y => ({
        yarnLotId: parseInt(y.yarnLotId),
        quantityUsed: parseFloat(y.quantityUsed),
      })),
      greyWeight: parseFloat(formData.greyWeight),
      dia: formData.dia || undefined,
      gg: formData.gg || formData.gauge || undefined,
      loopLength: formData.loopLength || undefined,
      programDate: formData.programDate,
      blendType: formData.lycraUsed ? formData.blendType : undefined,
      blendPercent: formData.lycraUsed ? parseFloat(formData.lycraPercent) || undefined : undefined,
    };
    createMutation.mutate(payload);
  };

  const addYarnRow = () => {
    setFormData(prev => ({
      ...prev,
      yarns: [...prev.yarns, { yarnLotId: '', quantityUsed: '' }]
    }));
  };

  const updateYarnRow = (index: number, field: string, value: string) => {
    const newYarns = [...formData.yarns];
    newYarns[index] = { ...newYarns[index], [field]: value };
    setFormData({ ...formData, yarns: newYarns });
  };

  const removeYarnRow = (index: number) => {
    const newYarns = formData.yarns.filter((_, i) => i !== index);
    setFormData({ ...formData, yarns: newYarns });
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
          <button
            onClick={() => { setEditRecord(null); setFormData(EMPTY_FORM); setCreateOpen(true); }}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition-all duration-200"
          >
            <PlusCircle className="h-4 w-4" /> Record Production
          </button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 bg-slate-900/80 hover:bg-slate-900/80">
                  {['Program No', 'Date', 'Knitter', 'Yarn Lots (HF Code)', 'Total Yarn (kg)', 'Grey Wt (kg)', 'Dia', 'Gauge', 'Loop Len', 'Anomaly', 'Actions'].map(h => (
                    <TableHead key={h} className="text-xs font-semibold uppercase tracking-widest text-slate-400">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i} className="border-slate-800">
                      {Array.from({ length: 10 }).map((__, j) => (
                        <TableCell key={j}><div className="h-4 rounded bg-slate-800 animate-pulse" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : programs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-12 text-center text-sm text-slate-500">
                      No knitting programs yet. Click &quot;Record Production&quot; to create one.
                    </TableCell>
                  </TableRow>
                ) : programs.map((p) => {
                  const hfCodes = p.yarnUsages?.map(u => u.yarnLot?.hfCode).filter(Boolean).join(', ') || p.yarnLot?.hfCode || '–';
                  const totalUsed = p.yarnUsages?.reduce((sum, u) => sum + Number(u.quantityUsed), 0) || Number(p.quantityUsed) || 0;
                  
                  return (
                  <TableRow key={p.id} className="border-slate-800/60 hover:bg-slate-800/20 transition-colors">
                    <TableCell className="font-mono text-sm font-semibold text-indigo-300">{p.programNo ?? `#${p.id}`}</TableCell>
                    <TableCell className="text-slate-300 text-sm">{new Date(p.programDate).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell className="text-slate-200">{p.knitter?.name ?? '–'}</TableCell>
                    <TableCell className="font-mono text-sm font-semibold text-teal-300 max-w-[200px] truncate" title={hfCodes}>
                      {hfCodes}
                    </TableCell>
                    <TableCell className="text-slate-300">{Number(totalUsed).toFixed(2)}</TableCell>
                    <TableCell className="font-semibold text-slate-200">{Number(p.greyWeight).toFixed(2)}</TableCell>
                    <TableCell className="text-slate-300">{p.dia ?? '–'}</TableCell>
                    <TableCell className="text-slate-300">{p.gg ?? '–'}</TableCell>
                    <TableCell className="text-slate-300">{p.loopLength ?? '–'}</TableCell>
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
                )})}
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
        <Dialog open={createOpen} onOpenChange={(open) => { if (!open) closeDialogs(); }}>
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

              {/* Dynamic Yarn Lots Section */}
              <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-slate-400">Yarn Lots Used</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addYarnRow} className="h-7 text-xs border-slate-700 bg-slate-800 text-slate-300">
                    <PlusCircle className="h-3 w-3 mr-1" /> Add Lot
                  </Button>
                </div>
                
                {formData.yarns.length === 0 && (
                  <p className="text-xs text-slate-500 italic py-2">No yarn lots added. Click "Add Lot" to select yarn.</p>
                )}

                {formData.yarns.map((yarn, idx) => (
                  <div key={idx} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Label className="text-[10px] text-slate-500 mb-1 block">Yarn Lot (HF Code) <span className="text-rose-400">*</span></Label>
                      <select required className={SELECT_CLASS} value={yarn.yarnLotId}
                        onChange={(e) => updateYarnRow(idx, 'yarnLotId', e.target.value)}
                        disabled={!formData.knitterId}>
                        <option value="">{formData.knitterId ? 'Select Lot…' : 'Select knitter first'}</option>
                        {knitterStock.map(s => (
                          <option key={s.id} value={s.yarnLotId}>
                            {s.yarnLot?.hfCode} — {s.remainingWeight}kg avail
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32">
                      <Label className="text-[10px] text-slate-500 mb-1 block">Quantity (kg) <span className="text-rose-400">*</span></Label>
                      <Input type="number" step="0.01" min="0.01" required className="bg-slate-800/80 border-slate-700/60 text-slate-200 h-[38px]"
                        value={yarn.quantityUsed} onChange={(e) => updateYarnRow(idx, 'quantityUsed', e.target.value)} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeYarnRow(idx)}
                      className="h-[38px] w-[38px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {formData.yarns.length > 0 && (
                  <div className="pt-2 text-xs font-medium text-slate-400 flex justify-end pr-14">
                    Total Yarn: <span className="text-emerald-400 ml-2">{totalYarnUsed.toFixed(2)} kg</span>
                  </div>
                )}
              </div>

              {/* Row 3 — Grey Weight */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Grey Weight (kg) <span className="text-rose-400">*</span></Label>
                  <Input type="number" step="0.01" min="0" required className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={formData.greyWeight} onChange={(e) => setFormData({ ...formData, greyWeight: e.target.value })} />
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
