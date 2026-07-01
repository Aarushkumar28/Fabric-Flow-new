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
import { PlusCircle, Pencil, Trash2, Layers } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';

const SELECT_CLASS =
  'w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all';

interface Compacting {
  id: number;
  lotNo: string;
  dyeingId?: number;
  compacterId?: number;
  colourId?: number;
  finalWeight?: number;
  processLoss?: number;
  status?: string;
  createdAt: string;
  dyeing?: {
    id: number;
    lotNo: string;
    initialWeight: number;
    finalWeight?: number;
    companyDcNo?: string;
    knitterDcNo?: string;
    dyer?: { id: number; name: string };
    colour?: { id: number; name: string };
  };
  compacter?: { id: number; name: string };
  colour?: { id: number; name: string };
}

interface Compacter {
  id: number;
  name: string;
}

interface Dyeing {
  id: number;
  lotNo: string;
  initialWeight: number;
  finalWeight?: number;
  companyDcNo?: string;
  status?: string;
  dyer?: { name: string };
}

interface CompactorFormData {
  lotNo: string;
  dyeingId: string;
  compacterId: string;
  finalWeight: string;
  receivedDate: string;
  beforeCompactingWeight: string;
  finalDia: string;
  numRolls: string;
  dyerDcNo: string;
  companyDcNo: string;
}

const EMPTY_FORM: CompactorFormData = {
  lotNo: '',
  dyeingId: '',
  compacterId: '',
  finalWeight: '',
  receivedDate: new Date().toISOString().split('T')[0],
  beforeCompactingWeight: '',
  finalDia: '',
  numRolls: '',
  dyerDcNo: '',
  companyDcNo: '',
};

const fmt = (v: number | null | undefined, prefix = '') =>
  v != null ? `${prefix}${Number(v).toFixed(2)}` : '–';

export default function CompactorPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<Compacting | null>(null);
  const [formData, setFormData] = useState<CompactorFormData>(EMPTY_FORM);

  const { data: records = [], isLoading } = useQuery<Compacting[]>({
    queryKey: ['compactings'],
    queryFn: async () => (await api.get<Compacting[]>('/compactings')).data,
  });

  const { data: compacters = [] } = useQuery<Compacter[]>({
    queryKey: ['compacters'],
    queryFn: async () => (await api.get<Compacter[]>('/compacters')).data,
  });

  const { data: dyeings = [] } = useQuery<Dyeing[]>({
    queryKey: ['dyeings'],
    queryFn: async () => (await api.get<Dyeing[]>('/dyeings')).data,
  });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.post('/compactings', body).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compactings'] });
      toast.success('Compacting record created');
      closeDialogs();
    },
    onError: () => toast.error('Failed to create compacting record'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: { id: number } & Record<string, unknown>) =>
      api.patch(`/compactings/${id}`, body).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compactings'] });
      toast.success('Compacting record updated');
      closeDialogs();
    },
    onError: () => toast.error('Failed to update compacting record'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/compactings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compactings'] });
      toast.success('Compacting record deleted');
    },
    onError: () => toast.error('Failed to delete compacting record'),
  });

  const closeDialogs = () => {
    setCreateOpen(false);
    setEditRecord(null);
    setFormData(EMPTY_FORM);
  };

  const openEditDialog = (record: Compacting) => {
    setEditRecord(record);
    setFormData({
      lotNo: record.lotNo ?? '',
      dyeingId: String(record.dyeingId ?? ''),
      compacterId: String(record.compacterId ?? ''),
      finalWeight: record.finalWeight != null ? String(record.finalWeight) : '',
      receivedDate: record.createdAt?.split('T')[0] ?? '',
      beforeCompactingWeight: record.dyeing?.finalWeight != null ? String(record.dyeing.finalWeight) : '',
      finalDia: '',
      numRolls: '',
      dyerDcNo: record.dyeing?.knitterDcNo ?? '',
      companyDcNo: record.dyeing?.companyDcNo ?? '',
    });
  };

  const handleDyeingSelect = (dyeingId: string) => {
    const d = dyeings.find(x => String(x.id) === dyeingId);
    setFormData({
      ...formData,
      dyeingId,
      lotNo: d?.lotNo ?? formData.lotNo,
      beforeCompactingWeight: d?.finalWeight != null ? String(d.finalWeight) : '',
      companyDcNo: d?.companyDcNo ?? '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      lotNo: formData.lotNo,
      dyeingId: formData.dyeingId ? parseInt(formData.dyeingId) : undefined,
      compacterId: formData.compacterId ? parseInt(formData.compacterId) : undefined,
      finalWeight: formData.finalWeight ? parseFloat(formData.finalWeight) : undefined,
    };
    if (editRecord) {
      updateMutation.mutate({ id: editRecord.id, compactWeight: parseFloat(formData.finalWeight) });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Process Loss Calculation
  const beforeWeight = parseFloat(formData.beforeCompactingWeight) || 0;
  const afterWeight = parseFloat(formData.finalWeight) || 0;
  const processLossPct = beforeWeight > 0 ? ((beforeWeight - afterWeight) / beforeWeight) * 100 : 0;

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <ProtectedRoute>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              Compactor
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {isLoading ? 'Loading…' : `${records.length} record${records.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => { setEditRecord(null); setFormData(EMPTY_FORM); setCreateOpen(true); }}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all duration-200"
          >
            <PlusCircle className="h-4 w-4" /> Add Compacting
          </button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 bg-slate-900/80 hover:bg-slate-900/80">
                  {['Lot No', 'Dyer DC', 'Company DC', 'Compacter', 'Grey Wt (kg)', 'Dyed Wt (kg)', 'Final Wt (kg)', 'Loss %', 'Status', 'Actions'].map(h => (
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
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-12 text-center text-sm text-slate-500">
                      No compacting records yet. Click &quot;Add Compacting&quot; to create one.
                    </TableCell>
                  </TableRow>
                ) : records.map((r) => {
                  const greyWt = r.dyeing?.initialWeight;
                  const dyedWt = r.dyeing?.finalWeight;
                  const lossPct = greyWt && r.finalWeight != null
                    ? ((greyWt - r.finalWeight) / greyWt * 100).toFixed(1)
                    : '–';
                  return (
                    <TableRow key={r.id} className="border-slate-800/60 hover:bg-slate-800/20 transition-colors">
                      <TableCell className="font-mono text-sm font-semibold text-violet-300">{r.lotNo}</TableCell>
                      <TableCell className="text-slate-300">{r.dyeing?.knitterDcNo ?? '–'}</TableCell>
                      <TableCell className="text-slate-300">{r.dyeing?.companyDcNo ?? '–'}</TableCell>
                      <TableCell className="text-slate-200">{r.compacter?.name ?? '–'}</TableCell>
                      <TableCell className="text-slate-300">{fmt(greyWt)}</TableCell>
                      <TableCell className="text-slate-300">{fmt(dyedWt)}</TableCell>
                      <TableCell className="font-semibold text-slate-200">{fmt(r.finalWeight)}</TableCell>
                      <TableCell>
                        <span className={`font-mono text-sm font-semibold ${Number(lossPct) > 10 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {lossPct}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-400' :
                          r.status === 'PENDING' ? 'bg-amber-500/15 text-amber-400' :
                          'bg-slate-500/15 text-slate-400'
                        }`}>
                          {r.status ?? 'PENDING'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1.5">
                          <button title="Edit" onClick={() => openEditDialog(r)}
                            className="inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-xs text-blue-300 hover:bg-blue-500/20 transition-all">
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button title="Delete" onClick={() => window.confirm('Delete this record?') && deleteMutation.mutate(r.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-xs text-rose-400 hover:bg-rose-500/20 transition-all">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {records.length > 0 && !isLoading && (
            <div className="border-t border-slate-800/60 px-4 py-2.5 text-right">
              <span className="text-xs text-slate-500">{records.length} record{records.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Create / Edit Dialog */}
        <Dialog open={createOpen || editRecord !== null} onOpenChange={(open) => { if (!open) closeDialogs(); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-100 flex items-center gap-2">
                <Layers className="h-5 w-5 text-violet-400" />
                {editRecord ? 'Edit Compacting' : 'Add Compacting'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              {/* Row 1 — Dyeing Lot + Compacter */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Dyeing Lot <span className="text-rose-400">*</span></Label>
                  <select required className={SELECT_CLASS} value={formData.dyeingId}
                    onChange={(e) => handleDyeingSelect(e.target.value)}>
                    <option value="">Select Lot…</option>
                    {dyeings.filter(d => d.status === 'COMPLETED' || editRecord).map(d => (
                      <option key={d.id} value={d.id}>{d.lotNo} — {d.dyer?.name ?? 'Unknown'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Compacter <span className="text-rose-400">*</span></Label>
                  <select required className={SELECT_CLASS} value={formData.compacterId}
                    onChange={(e) => setFormData({ ...formData, compacterId: e.target.value })}>
                    <option value="">Select Compacter…</option>
                    {compacters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2 — DC Numbers */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Dyer DC Number</Label>
                  <Input placeholder="e.g. DY-DC-001" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={formData.dyerDcNo} onChange={(e) => setFormData({ ...formData, dyerDcNo: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Company DC Number</Label>
                  <Input placeholder="Auto from Dyeing" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={formData.companyDcNo} readOnly />
                </div>
              </div>

              {/* Row 3 — Received Date + Dia + Rolls */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Received Date</Label>
                  <Input type="date" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={formData.receivedDate} onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Final Dia</Label>
                  <Input placeholder="e.g. 72&quot;" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={formData.finalDia} onChange={(e) => setFormData({ ...formData, finalDia: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Number of Rolls</Label>
                  <Input type="number" min="0" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={formData.numRolls} onChange={(e) => setFormData({ ...formData, numRolls: e.target.value })} />
                </div>
              </div>

              {/* Row 4 — Weights */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Before-Compacting Weight (kg)</Label>
                  <Input type="number" step="0.01" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={formData.beforeCompactingWeight} readOnly />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Final Weight (kg) <span className="text-rose-400">*</span></Label>
                  <Input type="number" step="0.01" min="0" required className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={formData.finalWeight} onChange={(e) => setFormData({ ...formData, finalWeight: e.target.value })} />
                </div>
              </div>

              {/* Process Loss Summary */}
              <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Process Loss Calculation</p>
                {[
                  { label: 'Grey Fabric Weight (from Dyeing)', value: `${beforeWeight.toFixed(2)} kg` },
                  { label: 'Final Compacted Weight', value: `${afterWeight.toFixed(2)} kg` },
                  { label: 'Weight Lost', value: `${(beforeWeight - afterWeight).toFixed(2)} kg` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-slate-400">{label}</span>
                    <span className="text-slate-200 font-medium">{value}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm border-t border-slate-700/60 pt-2 mt-1">
                  <span className="font-semibold text-slate-200">Process Loss %</span>
                  <span className={`text-lg font-bold ${processLossPct > 10 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {processLossPct.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={closeDialogs}
                  className="border-slate-700 hover:bg-slate-800 text-slate-300">
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold disabled:opacity-60">
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
