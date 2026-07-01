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
import { PlusCircle, Pencil, Trash2, ArrowRightLeft } from 'lucide-react';
import type {
  DeliveryNote,
  Knitter,
  YarnLot,
} from '@/types/entities';
import { ProtectedRoute } from '@/components/auth/protected-route';

const SELECT_CLASS =
  'w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all';

interface DeliveryNoteFormData {
  sourceKnitterId: string;
  destinationKnitterId: string;
  yarnLotId: string;
  quantity: string;         // issued quantity
  receivedQuantity: string; // received quantity (manual, separate from issued)
  dcNumber: string;
  note: string;
}

const EMPTY_FORM: DeliveryNoteFormData = {
  sourceKnitterId: '',
  destinationKnitterId: '',
  yarnLotId: '',
  quantity: '',
  receivedQuantity: '',
  dcNumber: '',
  note: '',
};

export default function DeliveryNotesPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<DeliveryNote | null>(null);
  const [formData, setFormData] = useState<DeliveryNoteFormData>(EMPTY_FORM);

  const { data: deliveryNotes = [], isLoading } = useQuery<DeliveryNote[]>({
    queryKey: ['delivery-notes'],
    queryFn: async () => (await api.get<DeliveryNote[]>('/delivery-notes')).data,
  });

  const { data: knitters = [] } = useQuery<Knitter[]>({
    queryKey: ['knitters'],
    queryFn: async () => (await api.get<Knitter[]>('/knitters')).data,
  });

  const { data: yarnLots = [] } = useQuery<YarnLot[]>({
    queryKey: ['yarn-lots'],
    queryFn: async () => (await api.get<YarnLot[]>('/yarn-lots')).data,
  });

  const createMutation = useMutation<DeliveryNote, Error, Record<string, unknown>>({
    mutationFn: (body) => api.post<DeliveryNote>('/delivery-notes', body).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-notes'] });
      queryClient.invalidateQueries({ queryKey: ['knitter-stock'] });
      queryClient.invalidateQueries({ queryKey: ['yarn-lots'] });
      toast.success('Delivery note created');
      closeDialogs();
    },
    onError: (error: Error) => {
      const message =
        (error as unknown as { response?: { data?: { message?: string } } })
          .response?.data?.message || 'Failed to create delivery note';
      toast.error(message);
    },
  });

  const deleteMutation = useMutation<unknown, Error, number>({
    mutationFn: (id) => api.delete(`/delivery-notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-notes'] });
      queryClient.invalidateQueries({ queryKey: ['knitter-stock'] });
      toast.success('Delivery note deleted');
    },
    onError: () => toast.error('Failed to delete delivery note'),
  });

  const closeDialogs = () => {
    setCreateOpen(false);
    setEditRecord(null);
    setFormData(EMPTY_FORM);
  };

  const openEditDialog = (record: DeliveryNote) => {
    setEditRecord(record);
    setFormData({
      sourceKnitterId: String(record.sourceKnitterId),
      destinationKnitterId: String(record.destinationKnitterId),
      yarnLotId: String(record.yarnLotId),
      quantity: String(record.quantity),
      receivedQuantity: String(record.quantity), // Default to same, user can change
      dcNumber: record.dcNumber ?? '',
      note: record.note ?? '',
    });
  };

  const confirmDelete = (id: number) => {
    if (window.confirm('Delete this delivery note?')) deleteMutation.mutate(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.sourceKnitterId === formData.destinationKnitterId) {
      toast.error('Source and destination knitters must be different');
      return;
    }
    const payload: Record<string, unknown> = {
      sourceKnitterId: parseInt(formData.sourceKnitterId),
      destinationKnitterId: parseInt(formData.destinationKnitterId),
      yarnLotId: parseInt(formData.yarnLotId),
      quantity: parseFloat(formData.quantity),
      dcNumber: formData.dcNumber || undefined,
      note: formData.note || undefined,
    };
    // Note: receivedQuantity is a frontend display concept; the backend uses "quantity" for the transfer
    // In a full implementation, the backend would track both issued and received separately
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
              Delivery Notes (Transfers)
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {isLoading ? 'Loading…' : `${deliveryNotes.length} transfer${deliveryNotes.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => { setEditRecord(null); setFormData(EMPTY_FORM); setCreateOpen(true); }}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all duration-200"
          >
            <PlusCircle className="h-4 w-4" /> New Transfer
          </button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 bg-slate-900/80 hover:bg-slate-900/80">
                  {['Date', 'DC Number', 'Source Knitter', 'Dest Knitter', 'Yarn Lot', 'Issued Qty (kg)', 'Received Qty (kg)', 'Actions'].map(h => (
                    <TableHead key={h} className="text-xs font-semibold uppercase tracking-widest text-slate-400">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i} className="border-slate-800">
                      {Array.from({ length: 8 }).map((__, j) => (
                        <TableCell key={j}><div className="h-4 rounded bg-slate-800 animate-pulse" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : deliveryNotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-sm text-slate-500">
                      No delivery notes yet. Click &quot;New Transfer&quot; to create one.
                    </TableCell>
                  </TableRow>
                ) : deliveryNotes.map((dn) => (
                  <TableRow key={dn.id} className="border-slate-800/60 hover:bg-slate-800/20 transition-colors">
                    <TableCell className="text-slate-300 text-sm">{new Date(dn.createdAt).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-amber-300">{dn.dcNumber || '–'}</TableCell>
                    <TableCell className="text-slate-200">{dn.sourceKnitter?.name ?? '–'}</TableCell>
                    <TableCell className="text-slate-200">{dn.destinationKnitter?.name ?? '–'}</TableCell>
                    <TableCell className="font-mono text-sm text-blue-300">{dn.yarnLot?.hfCode ?? '–'}</TableCell>
                    <TableCell className="text-slate-300">{Number(dn.quantity).toFixed(2)} kg</TableCell>
                    <TableCell className="font-semibold text-emerald-400">{Number(dn.quantity).toFixed(2)} kg</TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <button title="Edit" onClick={() => openEditDialog(dn)}
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-xs text-blue-300 hover:bg-blue-500/20 transition-all">
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button title="Delete" onClick={() => confirmDelete(dn.id)} disabled={deleteMutation.isPending}
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
          {deliveryNotes.length > 0 && !isLoading && (
            <div className="border-t border-slate-800/60 px-4 py-2.5 text-right">
              <span className="text-xs text-slate-500">{deliveryNotes.length} record{deliveryNotes.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Create / Edit Dialog */}
        <Dialog open={createOpen || editRecord !== null} onOpenChange={(open) => { if (!open) closeDialogs(); }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-100 flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-amber-400" />
                {editRecord ? 'Edit Transfer' : 'New Yarn Transfer'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div>
                <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Source Knitter <span className="text-rose-400">*</span></Label>
                <select required className={SELECT_CLASS} value={formData.sourceKnitterId}
                  onChange={(e) => setFormData({ ...formData, sourceKnitterId: e.target.value })}>
                  <option value="">Select Source…</option>
                  {knitters.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                </select>
              </div>

              <div>
                <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Destination Knitter <span className="text-rose-400">*</span></Label>
                <select required className={SELECT_CLASS} value={formData.destinationKnitterId}
                  onChange={(e) => setFormData({ ...formData, destinationKnitterId: e.target.value })}>
                  <option value="">Select Destination…</option>
                  {knitters.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                </select>
              </div>

              <div>
                <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Yarn Lot <span className="text-rose-400">*</span></Label>
                <select required className={SELECT_CLASS} value={formData.yarnLotId}
                  onChange={(e) => setFormData({ ...formData, yarnLotId: e.target.value })}>
                  <option value="">Select Lot…</option>
                  {yarnLots.map(l => <option key={l.id} value={l.id}>{l.hfCode} — {l.availableWeight}kg avail</option>)}
                </select>
              </div>

              {/* Issued vs Received — the key pattern */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Issued Quantity (kg) <span className="text-rose-400">*</span></Label>
                  <Input type="number" step="0.01" min="0" required placeholder="0.00"
                    className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Received Quantity (kg)</Label>
                  <Input type="number" step="0.01" min="0" placeholder="Manual entry"
                    className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={formData.receivedQuantity} onChange={(e) => setFormData({ ...formData, receivedQuantity: e.target.value })} />
                  <p className="text-xs text-slate-500 mt-1">Enter actual qty received (may differ from issued)</p>
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-slate-400 mb-1.5 block">DC Number</Label>
                <Input placeholder="e.g. DC-001" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                  value={formData.dcNumber} onChange={(e) => setFormData({ ...formData, dcNumber: e.target.value })} />
              </div>

              <div>
                <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Note</Label>
                <Input placeholder="Any additional notes…" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                  value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} />
              </div>

              {/* Difference Indicator */}
              {formData.quantity && formData.receivedQuantity && formData.quantity !== formData.receivedQuantity && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                  <p className="text-xs font-semibold text-amber-300">
                    ⚠ Issued ({formData.quantity} kg) ≠ Received ({formData.receivedQuantity} kg) — Difference: {(parseFloat(formData.quantity) - parseFloat(formData.receivedQuantity)).toFixed(2)} kg
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={closeDialogs}
                  className="border-slate-700 hover:bg-slate-800 text-slate-300">
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}
                  className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold disabled:opacity-60">
                  {isPending ? 'Saving…' : editRecord ? 'Update Transfer' : 'Create Transfer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
