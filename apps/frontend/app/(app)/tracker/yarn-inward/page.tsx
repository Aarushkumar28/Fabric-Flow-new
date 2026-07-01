'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Pencil, Trash2, FileText, Package } from 'lucide-react';
import type { YarnInward, YarnInwardFormData, Knitter } from '@/types/entities';
import type { Mill } from '@/types/yarn';
import YarnPOPreviewModal from '@/components/po/YarnPOPreviewModal';
import type { YarnPOData } from '@/components/po/YarnPOPrint';
import { ProtectedRoute } from '@/components/auth/protected-route';

// ── Constants ─────────────────────────────────────────────────────────────────
const SELECT_CLASS =
  'w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all';

const EMPTY_FORM: YarnInwardFormData = {
  receiptDate: new Date().toISOString().split('T')[0],
  millId: '',
  deliveryKnitterId: '',
  hfBatch: '',
  yarnCount: '',
  yarnQuality: '',
  rlVl: '',
  description: '',
  numBags: '',
  bagWeight: '60',
  ratePerKg: '',
  cgstRate: '2.5',
  sgstRate: '2.5',
  purchaseAccount: 'C.N.T.LLP',
  remarks: '',
  purchaseOrderId: '',
  millInvoiceNo: '',
  millDcNo: '',
  receivedWeight: '',
  status: 'PENDING',
};

const fmt = (v: number | null | undefined, prefix = '') =>
  v != null ? `${prefix}${Number(v).toFixed(2)}` : '–';

export default function YarnInwardPage() {
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<YarnInward | null>(null);
  const [poData, setPoData] = useState<YarnPOData | null>(null);
  const [poPreviewOpen, setPoPreviewOpen] = useState(false);
  const [formData, setFormData] = useState<YarnInwardFormData>(EMPTY_FORM);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: records = [], isLoading } = useQuery<YarnInward[]>({
    queryKey: ['yarn-inward'],
    queryFn: async () => (await api.get<YarnInward[]>('/yarn-inward')).data,
  });

  const { data: mills = [] } = useQuery<Mill[]>({
    queryKey: ['mills'],
    queryFn: async () => (await api.get<Mill[]>('/mills')).data,
  });

  const { data: knitters = [] } = useQuery<Knitter[]>({
    queryKey: ['knitters'],
    queryFn: async () => (await api.get<Knitter[]>('/knitters')).data,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation<YarnInward, Error, Record<string, unknown>>({
    mutationFn: (body) => api.post<YarnInward>('/yarn-inward', body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yarn-inward'] });
      toast.success('Yarn inward record created');
      closeDialogs();
    },
    onError: () => toast.error('Failed to create yarn inward'),
  });

  const updateMutation = useMutation<YarnInward, Error, { id: number } & Record<string, unknown>>({
    mutationFn: ({ id, ...body }) =>
      api.patch<YarnInward>(`/yarn-inward/${id}`, body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yarn-inward'] });
      toast.success('Yarn inward record updated');
      closeDialogs();
    },
    onError: () => toast.error('Failed to update yarn inward'),
  });

  const deleteMutation = useMutation<unknown, Error, number>({
    mutationFn: (id) => api.delete(`/yarn-inward/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yarn-inward'] });
      toast.success('Record deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  const closeDialogs = () => {
    setCreateOpen(false);
    setEditRecord(null);
    setFormData(EMPTY_FORM);
  };

  const openEditDialog = (record: YarnInward) => {
    setEditRecord(record);
    setFormData({
      receiptDate: record.receiptDate?.split('T')[0] ?? '',
      millId: String(record.millId ?? ''),
      deliveryKnitterId: String(record.deliveryKnitterId ?? ''),
      hfBatch: record.hfBatch ?? '',
      yarnCount: record.yarnCount ?? '',
      yarnQuality: record.yarnQuality ?? '',
      rlVl: record.rlVl ?? '',
      description: record.description ?? '',
      numBags: record.numBags != null ? String(record.numBags) : '',
      bagWeight: record.bagWeight != null ? String(record.bagWeight) : '60',
      ratePerKg: record.ratePerKg != null ? String(record.ratePerKg) : '',
      cgstRate: record.cgstRate != null ? String(record.cgstRate) : '2.5',
      sgstRate: record.sgstRate != null ? String(record.sgstRate) : '2.5',
      purchaseAccount: record.purchaseAccount ?? 'C.N.T.LLP',
      remarks: record.remarks ?? '',
      purchaseOrderId: record.purchaseOrderId ?? '',
      millInvoiceNo: record.millInvoiceNo ?? '',
      millDcNo: record.millDcNo ?? '',
      receivedWeight: record.receivedWeight != null ? String(record.receivedWeight) : '',
      status: record.status ?? 'PENDING',
    });
  };

  const confirmDelete = (id: number) => {
    if (window.confirm('Delete this yarn inward record?')) deleteMutation.mutate(id);
  };

  const handleGeneratePO = async (id: number) => {
    try {
      const { data } = await api.get<YarnPOData>(`/yarn-inward/${id}`);
      setPoData(data);
      setPoPreviewOpen(true);
    } catch {
      toast.error('Failed to fetch PO details');
    }
  };

  // ── Live calculation ──────────────────────────────────────────────────────
  const numBagsVal = parseInt(formData.numBags) || 0;
  const bagWeightVal = parseFloat(formData.bagWeight) || 0;
  const ratePerKgVal = parseFloat(formData.ratePerKg) || 0;
  const cgstRateVal = parseFloat(formData.cgstRate) || 0;
  const sgstRateVal = parseFloat(formData.sgstRate) || 0;
  const totalWeightCalc = numBagsVal * bagWeightVal;
  const taxableCostCalc = totalWeightCalc * ratePerKgVal;
  const cgstAmountCalc = taxableCostCalc * (cgstRateVal / 100);
  const sgstAmountCalc = taxableCostCalc * (sgstRateVal / 100);
  const totalCostCalc = taxableCostCalc + cgstAmountCalc + sgstAmountCalc;

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      receiptDate: formData.receiptDate,
      millInvoiceNo: formData.millInvoiceNo || undefined,
      millDcNo: formData.millDcNo || undefined,
      receivedWeight: formData.receivedWeight ? Number(formData.receivedWeight) : undefined,
    };

    // If it's a manual inward, include all fields
    if (!editRecord || editRecord.status !== 'PENDING') {
      payload.millId = parseInt(formData.millId);
      payload.deliveryKnitterId = parseInt(formData.deliveryKnitterId);
      payload.hfBatch = formData.hfBatch || undefined;
      payload.yarnCount = formData.yarnCount || undefined;
      payload.yarnQuality = formData.yarnQuality || undefined;
      payload.rlVl = formData.rlVl || undefined;
      payload.description = formData.description || undefined;
      payload.numBags = formData.numBags ? parseInt(formData.numBags) : undefined;
      payload.bagWeight = formData.bagWeight ? parseFloat(formData.bagWeight) : undefined;
      payload.ratePerKg = parseFloat(formData.ratePerKg);
      payload.cgstRate = formData.cgstRate ? parseFloat(formData.cgstRate) : undefined;
      payload.sgstRate = formData.sgstRate ? parseFloat(formData.sgstRate) : undefined;
      payload.purchaseAccount = formData.purchaseAccount || undefined;
      payload.remarks = formData.remarks || undefined;
    }

    if (editRecord) updateMutation.mutate({ id: editRecord.id, ...payload });
    else createMutation.mutate(payload);
  };

  const isPendingMutation = createMutation.isPending || updateMutation.isPending;

  const TABLE_HEADERS = [
    'Status', 'PO No.', 'Issued PO Date', 'Mill', 'Knitter',
    'HF Code', 'Count', 'Bags', 'Total Wt (PO)',
    'Received Wt', 'Mill Invoice #', 'Mill DC No.', 'Actions',
  ];

  return (
    <ProtectedRoute>
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              Yarn Inward
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {isLoading ? 'Loading…' : `${records.length} inward record${records.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => { setEditRecord(null); setFormData(EMPTY_FORM); setCreateOpen(true); }}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all duration-200"
          >
            <PlusCircle className="h-4 w-4" /> Add Manual Inward
          </button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 bg-slate-900/80 hover:bg-slate-900/80">
                  {TABLE_HEADERS.map((h) => (
                    <TableHead key={h} className="text-xs font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i} className="border-slate-800">
                      {Array.from({ length: TABLE_HEADERS.length }).map((__, j) => (
                        <TableCell key={j}><div className="h-4 rounded bg-slate-800 animate-pulse" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={TABLE_HEADERS.length} className="py-12 text-center text-sm text-slate-500">
                      No inward records yet. Create a Yarn PO or click &quot;Add Manual Inward&quot; to create one.
                    </TableCell>
                  </TableRow>
                ) : records.map((r) => {
                  const isPending = r.status === 'PENDING';
                  // Get details from PO items if inward doesn't override it natively
                  const poItem = r.purchaseOrder?.items?.[0];
                  return (
                  <TableRow key={r.id} className={`border-slate-800/60 transition-colors ${isPending ? 'bg-yellow-500/5 border-yellow-500/20 hover:bg-yellow-500/10' : 'hover:bg-slate-800/20'}`}>
                    <TableCell className="whitespace-nowrap">
                      {isPending ? (
                        <span className="inline-flex w-fit items-center px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">{r.status}</span>
                      ) : (
                        <span className={`inline-flex w-fit items-center px-2 py-0.5 rounded text-[10px] font-bold border ${r.status === 'CANCELLED' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
                          {r.status}
                        </span>
                      )}
                    </TableCell>
                    {/* PO No. */}
                    <TableCell className="font-mono text-xs font-semibold text-blue-400 whitespace-nowrap">
                      {r.purchaseOrder?.poNumber ?? '–'}
                    </TableCell>
                    {/* Issued PO Date */}
                    <TableCell className="text-slate-300 text-xs whitespace-nowrap">
                      {r.purchaseOrder?.date
                        ? new Date(r.purchaseOrder.date).toLocaleDateString('en-IN')
                        : '–'}
                    </TableCell>
                    <TableCell className="text-slate-200 whitespace-nowrap">{r.mill?.name ?? '–'}</TableCell>
                    <TableCell className="text-slate-200 whitespace-nowrap">{r.deliveryKnitter?.name ?? '–'}</TableCell>
                    <TableCell className="text-slate-300">{r.hfBatch ?? r.purchaseOrder?.hfCode ?? '–'}</TableCell>
                    <TableCell className="text-slate-300">{r.yarnCount ?? poItem?.count ?? '–'}</TableCell>
                    <TableCell className="text-slate-300">{r.numBags ?? poItem?.bags ?? '–'}</TableCell>
                    <TableCell className="font-semibold text-slate-200 whitespace-nowrap">{fmt(r.totalWeight)} kg</TableCell>
                    {/* Received Weight */}
                    <TableCell className="font-semibold text-emerald-400 whitespace-nowrap">
                      {r.receivedWeight != null ? `${Number(r.receivedWeight).toFixed(2)} kg` : <span className="text-yellow-400/80 font-normal text-xs italic">Pending</span>}
                    </TableCell>
                    <TableCell className="text-slate-300 text-xs">{r.millInvoiceNo ?? '–'}</TableCell>
                    <TableCell className="text-slate-300 text-xs">{r.millDcNo ?? '–'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <button title="Edit" onClick={() => openEditDialog(r)}
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-xs text-blue-300 hover:bg-blue-500/20 transition-all">
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button title="Delete" onClick={() => confirmDelete(r.id)} disabled={deleteMutation.isPending}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/20 transition-all disabled:opacity-50">
                          <Trash2 className="h-3 w-3" />
                        </button>
                        {r.status === 'RECEIVED' && (
                        <button title="Generate PO" onClick={() => handleGeneratePO(r.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20 transition-all">
                          <FileText className="h-3 w-3" />
                        </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )})}
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
                <Package className="h-5 w-5 text-blue-400" />
                {editRecord ? (editRecord.status === 'PENDING' ? 'Receive Pending Yarn Inward' : 'Edit Yarn Inward') : 'Add Manual Yarn Inward'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">

              {editRecord?.status === 'PENDING' ? (
                <>
                  <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 mb-4">
                     <p className="text-xs font-semibold text-blue-400 mb-2 uppercase tracking-wide">Purchase Order Details</p>
                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                       <div><span className="block text-slate-500 text-xs">PO No.</span><span className="text-slate-200">{editRecord.purchaseOrder?.poNumber || '–'}</span></div>
                       <div><span className="block text-slate-500 text-xs">Mill</span><span className="text-slate-200">{editRecord.mill?.name || '–'}</span></div>
                       <div><span className="block text-slate-500 text-xs">Knitter</span><span className="text-slate-200">{editRecord.deliveryKnitter?.name || '–'}</span></div>
                       <div><span className="block text-slate-500 text-xs">Yarn</span><span className="text-slate-200">{editRecord.yarnCount || editRecord.purchaseOrder?.items?.[0]?.count || '–'}</span></div>
                       <div><span className="block text-slate-500 text-xs">Bags</span><span className="text-slate-200">{editRecord.numBags || editRecord.purchaseOrder?.items?.[0]?.bags || '–'}</span></div>
                       <div><span className="block text-slate-500 text-xs">Total PO Weight</span><span className="text-slate-200">{fmt(editRecord.totalWeight)} kg</span></div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Actual Receipt Date <span className="text-rose-400">*</span></Label>
                      <Input type="date" required value={formData.receiptDate}
                        className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                        onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-400 mb-1.5 block">
                        Received Weight (kg) <span className="text-rose-400">*</span>
                      </Label>
                      <Input type="number" step="0.01" min="0" required placeholder="e.g. 2895.60"
                        className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                        value={formData.receivedWeight} onChange={(e) => setFormData({ ...formData, receivedWeight: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Mill Invoice Number</Label>
                      <Input placeholder="e.g. INV-2024-001" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                        value={formData.millInvoiceNo} onChange={(e) => setFormData({ ...formData, millInvoiceNo: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Mill DC Number</Label>
                      <Input placeholder="e.g. DC-2024-001" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                        value={formData.millDcNo} onChange={(e) => setFormData({ ...formData, millDcNo: e.target.value })} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* FULL FORM FOR MANUAL OR NON-PENDING EDIT */}
                  {/* Row 1 – Date + Mill */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Receipt Date <span className="text-rose-400">*</span></Label>
                      <Input type="date" required value={formData.receiptDate}
                        className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                        onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Mill <span className="text-rose-400">*</span></Label>
                      <select required className={SELECT_CLASS} value={formData.millId}
                        onChange={(e) => setFormData({ ...formData, millId: e.target.value })}>
                        <option value="">Select Mill…</option>
                        {mills.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Row 2 – Knitter + HF Batch */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Delivery Knitter <span className="text-rose-400">*</span></Label>
                      <select required className={SELECT_CLASS} value={formData.deliveryKnitterId}
                        onChange={(e) => setFormData({ ...formData, deliveryKnitterId: e.target.value })}>
                        <option value="">Select Knitter…</option>
                        {knitters.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-400 mb-1.5 block">HF Batch</Label>
                      <Input placeholder="e.g. HF-24" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                        value={formData.hfBatch} onChange={(e) => setFormData({ ...formData, hfBatch: e.target.value })} />
                    </div>
                  </div>

                  {/* Row 3 – Yarn Count + Quality */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Yarn Count</Label>
                      <Input placeholder="e.g. 30/1" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                        value={formData.yarnCount} onChange={(e) => setFormData({ ...formData, yarnCount: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Yarn Quality</Label>
                      <Input placeholder="e.g. Super Carded" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                        value={formData.yarnQuality} onChange={(e) => setFormData({ ...formData, yarnQuality: e.target.value })} />
                    </div>
                  </div>

                  {/* Row 4 – RL/VL + Description */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Quality (RL/VL)</Label>
                      <select className={SELECT_CLASS} value={formData.rlVl}
                        onChange={(e) => setFormData({ ...formData, rlVl: e.target.value })}>
                        <option value="">Select…</option>
                        <option value="RL">RL</option>
                        <option value="VL">VL</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Description</Label>
                      <Input placeholder="Optional description" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                        value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                  </div>

                  {/* Row 5 – Bags + Bag Weight */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Number of Bags</Label>
                      <Input type="number" min="0" placeholder="0" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                        value={formData.numBags} onChange={(e) => setFormData({ ...formData, numBags: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Bag Weight (kg)</Label>
                      <Input type="number" step="0.01" min="0" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                        value={formData.bagWeight} onChange={(e) => setFormData({ ...formData, bagWeight: e.target.value })} />
                    </div>
                  </div>

                  {/* Row 5b – Received Weight (manual) */}
                  <div>
                    <Label className="text-xs font-medium text-slate-400 mb-1.5 block">
                      Received Weight (kg) — manual entry
                      <span className="ml-2 text-slate-500 font-normal">Actual scale reading; separate from computed total weight</span>
                    </Label>
                    <Input type="number" step="0.01" min="0" placeholder="e.g. 2895.60"
                      className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                      value={formData.receivedWeight} onChange={(e) => setFormData({ ...formData, receivedWeight: e.target.value })} />
                  </div>

                  {/* Row 6 – Rate */}
                  <div>
                    <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Rate per Kg (₹) <span className="text-rose-400">*</span></Label>
                    <Input type="number" step="0.01" min="0" required placeholder="0.00"
                      className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                      value={formData.ratePerKg} onChange={(e) => setFormData({ ...formData, ratePerKg: e.target.value })} />
                  </div>

                  {/* Row 7 – CGST + SGST */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-slate-400 mb-1.5 block">CGST (%)</Label>
                      <Input type="number" step="0.1" min="0" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                        value={formData.cgstRate} onChange={(e) => setFormData({ ...formData, cgstRate: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-400 mb-1.5 block">SGST (%)</Label>
                      <Input type="number" step="0.1" min="0" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                        value={formData.sgstRate} onChange={(e) => setFormData({ ...formData, sgstRate: e.target.value })} />
                    </div>
                  </div>

                  {/* Row 8 – Mill Invoice + Mill DC */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Mill Invoice Number</Label>
                      <Input placeholder="e.g. INV-2024-001" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                        value={formData.millInvoiceNo} onChange={(e) => setFormData({ ...formData, millInvoiceNo: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Mill DC Number</Label>
                      <Input placeholder="e.g. DC-2024-001" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                        value={formData.millDcNo} onChange={(e) => setFormData({ ...formData, millDcNo: e.target.value })} />
                    </div>
                  </div>

                  {/* Row 9 – Account + Remarks */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Purchase Account</Label>
                      <Input placeholder="e.g. C.N.T.LLP" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                        value={formData.purchaseAccount} onChange={(e) => setFormData({ ...formData, purchaseAccount: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Remarks</Label>
                      <Input placeholder="Any additional notes…" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                        value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} />
                    </div>
                  </div>

                  {/* Live Calculation Summary */}
                  <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Live Calculation</p>
                    {[
                      { label: 'Total Weight (computed)', value: `${totalWeightCalc.toFixed(2)} kg` },
                      { label: 'Taxable Amount', value: `₹${taxableCostCalc.toFixed(2)}` },
                      { label: `CGST (${cgstRateVal}%)`, value: `₹${cgstAmountCalc.toFixed(2)}` },
                      { label: `SGST (${sgstRateVal}%)`, value: `₹${sgstAmountCalc.toFixed(2)}` },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-slate-400">{label}</span>
                        <span className="text-slate-200 font-medium">{value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm border-t border-slate-700/60 pt-2 mt-1">
                      <span className="font-semibold text-slate-200">Total Cost</span>
                      <span className="text-lg font-bold text-emerald-400">₹{totalCostCalc.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={closeDialogs}
                  className="border-slate-700 hover:bg-slate-800 text-slate-300">
                  Cancel
                </Button>
                <Button type="submit" disabled={isPendingMutation}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold disabled:opacity-60">
                  {isPendingMutation ? 'Saving…' : editRecord ? (editRecord.status === 'PENDING' ? 'Confirm Receipt' : 'Update Record') : 'Create Record'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* PO Preview Modal */}
        <YarnPOPreviewModal
          data={poPreviewOpen ? poData : null}
          onClose={() => { setPoPreviewOpen(false); setPoData(null); }}
        />
      </div>
    </ProtectedRoute>
  );
}
