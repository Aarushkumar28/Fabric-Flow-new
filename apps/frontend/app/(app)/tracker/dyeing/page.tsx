'use client';
import { useState, useRef } from 'react';
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
import { Pencil, Printer, Droplets } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';

const SELECT_CLASS =
  'w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all';

interface DyeingRecord {
  id: number;
  lotNo: string;
  hfCode?: string;
  memoLineId: number;
  dyerId: number;
  colourId: number;
  initialWeight: number;
  finalWeight?: number;
  processLoss?: number;
  status?: string;
  noOfRolls?: number;
  knitterDcNo?: string;
  companyDcNo?: string;
  compacterId?: number;
  dateGiven?: string;
  sourceType?: string;
  dyer?: { id: number; name: string };
  colour?: { id: number; name: string };
  compacter?: { id: number; name: string };
  memoLine?: {
    id: number;
    sentWeight: number;
    memo?: { id: number; memoNo: number; issueDate: string };
    greyFabricLot?: { id: number; lotNumber: string; knitter?: { name: string } };
    knittingLot?: {
      lotNo: string;
      knitting?: { knitter?: { name: string } };
    };
  };
  createdAt: string;
}

interface Dyer { id: number; name: string; }
interface Colour { id: number; name: string; code: string; }
interface Compacter { id: number; name: string; }

interface DyeingFormData {
  knitterDcNo: string;
  companyDcNo: string;
  dyerJobNo: string;
  dyeingDeliveryNo: string;
  deliveryDate: string;
  receivedWeight: string;
  finalWeight: string;
  compacterId: string;
  colourId: string;
  lotNumber: string;
}

const EMPTY_FORM: DyeingFormData = {
  knitterDcNo: '',
  companyDcNo: '',
  dyerJobNo: '',
  dyeingDeliveryNo: '',
  deliveryDate: '',
  receivedWeight: '',
  finalWeight: '',
  compacterId: '',
  colourId: '',
  lotNumber: '',
};

const fmt = (v: number | null | undefined) =>
  v != null ? Number(v).toFixed(2) : '–';

export default function DyeingPage() {
  const queryClient = useQueryClient();
  const [editRecord, setEditRecord] = useState<DyeingRecord | null>(null);
  const [formData, setFormData] = useState<DyeingFormData>(EMPTY_FORM);
  const [printId, setPrintId] = useState<number | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: records = [], isLoading } = useQuery<DyeingRecord[]>({
    queryKey: ['dyeings'],
    queryFn: async () => (await api.get<DyeingRecord[]>('/dyeings')).data,
  });

  const { data: dyers = [] } = useQuery<Dyer[]>({
    queryKey: ['dyers'],
    queryFn: async () => (await api.get<Dyer[]>('/dyers')).data,
  });

  const { data: colours = [] } = useQuery<Colour[]>({
    queryKey: ['colours'],
    queryFn: async () => (await api.get<Colour[]>('/colours')).data,
  });



  const { data: compacters = [] } = useQuery<Compacter[]>({
    queryKey: ['compacters'],
    queryFn: async () => (await api.get<Compacter[]>('/compacters')).data,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: { id: number } & Record<string, unknown>) =>
      api.patch(`/dyeings/${id}`, body).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dyeings'] });
      toast.success('Dyeing record updated');
      closeDialogs();
    },
    onError: () => toast.error('Failed to update dyeing record'),
  });

  const closeDialogs = () => {
    setEditRecord(null);
    setFormData(EMPTY_FORM);
  };

  const openEditDialog = (record: DyeingRecord) => {
    setEditRecord(record);
    setFormData({
      knitterDcNo: record.knitterDcNo ?? '',
      companyDcNo: record.companyDcNo ?? '',
      dyerJobNo: '',
      dyeingDeliveryNo: '',
      deliveryDate: record.dateGiven?.split('T')[0] ?? '',
      receivedWeight: '',
      finalWeight: record.finalWeight != null ? String(record.finalWeight) : '',
      compacterId: String(record.compacterId ?? ''),
      colourId: String(record.colourId ?? ''),
      lotNumber: record.lotNo,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRecord) return;
    const payload: Record<string, unknown> = {};
    if (formData.knitterDcNo) payload.knitterDcNo = formData.knitterDcNo;
    if (formData.companyDcNo) payload.companyDcNo = formData.companyDcNo;
    if (formData.deliveryDate) payload.dateGiven = formData.deliveryDate;
    if (formData.finalWeight) payload.finalWeight = parseFloat(formData.finalWeight);
    if (formData.compacterId) payload.compacterId = parseInt(formData.compacterId);
    updateMutation.mutate({ id: editRecord.id, ...payload });
  };

  const handlePrint = (record: DyeingRecord) => {
    setPrintId(record.id);
    setTimeout(() => {
      if (printRef.current) {
        const w = window.open('', '_blank');
        if (w) {
          w.document.write(`<html><head><title>DC - ${record.lotNo}</title>
            <style>body{font-family:Arial,sans-serif;margin:20px;color:#000}
            table{width:100%;border-collapse:collapse;margin-top:10px}
            th,td{border:1px solid #333;padding:8px;text-align:left}
            th{background:#f0f0f0}h1{font-size:18px}h2{font-size:14px;margin-top:20px}
            .header{display:flex;justify-content:space-between}</style></head><body>`);
          w.document.write(printRef.current.innerHTML);
          w.document.write('</body></html>');
          w.document.close();
          w.print();
        }
      }
      setPrintId(null);
    }, 100);
  };

  // Live process loss calc
  const initialWeight = editRecord?.initialWeight ?? 0;
  const finalWeightVal = parseFloat(formData.finalWeight) || 0;
  const processLossPct = initialWeight > 0 && finalWeightVal > 0
    ? ((initialWeight - finalWeightVal) / initialWeight) * 100
    : 0;

  return (
    <ProtectedRoute>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              Dyeing Dispatch
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {isLoading ? 'Loading…' : `${records.length} record${records.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 bg-slate-900/80 hover:bg-slate-900/80">
                  {['Lot No', 'HF Code', 'Memo #', 'Knitter', 'Dyer', 'Colour', 'Grey Wt', 'Final Wt', 'Loss %', 'Knitter DC', 'Company DC', 'Status', 'Actions'].map(h => (
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
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="py-12 text-center text-sm text-slate-500">
                      No dyeing records yet. Create a Memo to generate dyeing dispatches.
                    </TableCell>
                  </TableRow>
                ) : records.map((r) => {
                  const lossPct = r.initialWeight > 0 && r.finalWeight != null
                    ? ((r.initialWeight - r.finalWeight) / r.initialWeight * 100).toFixed(1)
                    : '–';
                  const knitterName = r.memoLine?.greyFabricLot?.knitter?.name
                    ?? r.memoLine?.knittingLot?.knitting?.knitter?.name ?? '–';
                  return (
                    <TableRow key={r.id} className="border-slate-800/60 hover:bg-slate-800/20 transition-colors">
                      <TableCell className="font-mono text-sm font-semibold text-cyan-300">{r.lotNo}</TableCell>
                      <TableCell className="text-slate-300">{r.hfCode ?? '–'}</TableCell>
                      <TableCell className="text-slate-300">#{r.memoLine?.memo?.memoNo ?? '–'}</TableCell>
                      <TableCell className="text-slate-200">{knitterName}</TableCell>
                      <TableCell className="text-slate-200">{r.dyer?.name ?? '–'}</TableCell>
                      <TableCell className="text-slate-300">{r.colour?.name ?? '–'}</TableCell>
                      <TableCell className="text-slate-300">{fmt(r.initialWeight)} kg</TableCell>
                      <TableCell className="font-semibold text-slate-200">{fmt(r.finalWeight)} kg</TableCell>
                      <TableCell>
                        <span className={`font-mono text-sm font-semibold ${Number(lossPct) > 10 ? 'text-rose-400' : typeof lossPct === 'string' && lossPct !== '–' ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {lossPct}{lossPct !== '–' ? '%' : ''}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-blue-300">{r.knitterDcNo ?? '–'}</TableCell>
                      <TableCell className="font-mono text-xs text-blue-300">{r.companyDcNo ?? '–'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-400' :
                          r.status === 'IN_DYEING' ? 'bg-blue-500/15 text-blue-400' :
                          r.status === 'SENT' ? 'bg-amber-500/15 text-amber-400' :
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
                          <button title="Print DC" onClick={() => handlePrint(r)}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20 transition-all">
                            <Printer className="h-3 w-3" />
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

        {/* Edit Dialog */}
        <Dialog open={editRecord !== null} onOpenChange={(open) => { if (!open) closeDialogs(); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-100 flex items-center gap-2">
                <Droplets className="h-5 w-5 text-cyan-400" />
                Edit Dyeing — {editRecord?.lotNo}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              {/* Memo & Source Info (Read-only) */}
              <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Source Details</p>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Memo #</span>
                  <span className="text-slate-200 font-medium">#{editRecord?.memoLine?.memo?.memoNo ?? '–'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Lot Number</span>
                  <span className="text-slate-200 font-mono font-medium">{editRecord?.lotNo}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Grey Fabric Weight (sent)</span>
                  <span className="text-slate-200 font-medium">{fmt(editRecord?.initialWeight)} kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Dyer</span>
                  <span className="text-slate-200 font-medium">{editRecord?.dyer?.name ?? '–'}</span>
                </div>
              </div>

              {/* Row 1 — DC Numbers */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Knitter DC Number</Label>
                  <Input placeholder="e.g. KN-DC-001" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={formData.knitterDcNo} onChange={(e) => setFormData({ ...formData, knitterDcNo: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Company DC Number (Job No)</Label>
                  <Input placeholder="e.g. CNT-DC-001" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={formData.companyDcNo} onChange={(e) => setFormData({ ...formData, companyDcNo: e.target.value })} />
                </div>
              </div>

              {/* Row 2 — Dyer Job No + Delivery No */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Dyer Job Number</Label>
                  <Input placeholder="Manual entry" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={formData.dyerJobNo} onChange={(e) => setFormData({ ...formData, dyerJobNo: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Dyeing Delivery Number</Label>
                  <Input placeholder="e.g. DY-DEL-001" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={formData.dyeingDeliveryNo} onChange={(e) => setFormData({ ...formData, dyeingDeliveryNo: e.target.value })} />
                </div>
              </div>

              {/* Row 3 — Colour */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Colour</Label>
                  <select className={SELECT_CLASS} value={formData.colourId}
                    onChange={(e) => setFormData({ ...formData, colourId: e.target.value })}>
                    <option value="">Select…</option>
                    {colours.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                  </select>
                </div>
              </div>

              {/* Row 4 — Delivery Date + Compacter */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Delivery Date</Label>
                  <Input type="date" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={formData.deliveryDate} onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Destination Compacter</Label>
                  <select className={SELECT_CLASS} value={formData.compacterId}
                    onChange={(e) => setFormData({ ...formData, compacterId: e.target.value })}>
                    <option value="">Select…</option>
                    {compacters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 5 — Received Weight + Final Weight */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Received Weight (by dyer) (kg)</Label>
                  <Input type="number" step="0.01" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={formData.receivedWeight} onChange={(e) => setFormData({ ...formData, receivedWeight: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Final Fabric Weight (after dyeing) (kg)</Label>
                  <Input type="number" step="0.01" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={formData.finalWeight} onChange={(e) => setFormData({ ...formData, finalWeight: e.target.value })} />
                </div>
              </div>

              {/* Process Loss Summary */}
              {finalWeightVal > 0 && (
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Process Loss Calculation</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Before Dyeing Weight</span>
                    <span className="text-slate-200 font-medium">{initialWeight.toFixed(2)} kg</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">After Dyeing Weight</span>
                    <span className="text-slate-200 font-medium">{finalWeightVal.toFixed(2)} kg</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-slate-700/60 pt-2 mt-1">
                    <span className="font-semibold text-slate-200">Process Loss %</span>
                    <span className={`text-lg font-bold ${processLossPct > 10 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {processLossPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={closeDialogs}
                  className="border-slate-700 hover:bg-slate-800 text-slate-300">
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold disabled:opacity-60">
                  {updateMutation.isPending ? 'Saving…' : 'Update Record'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Hidden Print Template */}
        {printId && (
          <div ref={printRef} style={{ display: 'none' }}>
            {(() => {
              const r = records.find(x => x.id === printId);
              if (!r) return null;
              const knitterName = r.memoLine?.greyFabricLot?.knitter?.name
                ?? r.memoLine?.knittingLot?.knitting?.knitter?.name ?? '–';
              return (
                <div>
                  <h1>DELIVERY CHALLAN — DYEING TO COMPACTING</h1>
                  <div className="header">
                    <div><strong>Lot No:</strong> {r.lotNo}</div>
                    <div><strong>Date:</strong> {r.dateGiven ? new Date(r.dateGiven).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</div>
                  </div>
                  <table>
                    <tbody>
                      <tr><th>HF Code</th><td>{r.hfCode ?? '–'}</td><th>Memo #</th><td>{r.memoLine?.memo?.memoNo ?? '–'}</td></tr>
                      <tr><th>Knitter</th><td>{knitterName}</td><th>Dyer</th><td>{r.dyer?.name ?? '–'}</td></tr>
                      <tr><th>Knitter DC No</th><td>{r.knitterDcNo ?? '–'}</td><th>Company DC No</th><td>{r.companyDcNo ?? '–'}</td></tr>
                      <tr><th>Colour</th><td colSpan={3}>{r.colour?.name ?? '–'}</td></tr>
                      <tr><th>Grey Weight (kg)</th><td>{fmt(r.initialWeight)}</td><th>Final Weight (kg)</th><td>{fmt(r.finalWeight)}</td></tr>
                      <tr><th>Process Loss (kg)</th><td>{fmt(r.processLoss)}</td><th>No of Rolls</th><td>{r.noOfRolls ?? '–'}</td></tr>
                      <tr><th>Destination Compacter</th><td colSpan={3}>{r.compacter?.name ?? '–'}</td></tr>
                    </tbody>
                  </table>
                  <br />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px' }}>
                    <div>_______________<br />Authorized Signature</div>
                    <div>_______________<br />Received By</div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
