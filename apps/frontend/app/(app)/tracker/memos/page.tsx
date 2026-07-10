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
import { PlusCircle, Trash2, Printer, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';
import type { Knitter, YarnLot } from '@/types/entities';
import { ProtectedRoute } from '@/components/auth/protected-route';

const SELECT_CLASS =
  'w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all';

interface Dyer { id: number; name: string; }
interface Colour { id: number; name: string; code: string; }
interface KnitterProgram {
  id: number;
  programNo?: string | null;
  greyWeight: number;
  knitter?: { name: string };
  greyFabricLots?: { id: number; lotNumber: string; status: string; greyWeight: number }[];
}

interface GreyFabricLot {
  id: number;
  lotNumber: string;
  source: 'KNITTED' | 'PURCHASED';
  status: string;
  greyWeight: number;
  knitter?: { name: string };
}

/** Source options for a memo line */
type LineSource = 'YARN_LOT' | 'PROGRAM_LOT' | 'NEW_PROGRAM';

interface MemoLineFormData {
  /** Which sourcing mode is selected for this line */
  source: LineSource;
  // YARN_LOT mode (legacy)
  yarnLotId: string;
  knitterId: string;
  // PROGRAM_LOT mode
  knitterProgramId: string;
  // NEW_PROGRAM mode
  newProgramKnitterId: string;
  newProgramYarnLotId: string;
  newProgramQty: string;
  newProgramGreyWeight: string;
  // Common optional fields
  sentWeight: string;
  expectedRolls: string;
  yarnCount: string;
  dia: string;
  gg: string;
  loopLength: string;
  fabricName: string;
  fabricColour: string;
}

interface MemoLineApi {
  id?: number;
  sentWeight: number;
  yarnCount?: string | null;
  dia?: string | null;
  gg?: string | null;
  loopLength?: string | null;
  fabricName?: string | null;
  fabricColour?: string | null;
  knittingLot?: {
    lotNo: string;
    knitting?: {
      knitter?: { name: string };
      dia?: string;
      gauge?: string;
      loopLength?: string;
      count?: string;
    };
    entries?: { colour: { name: string }; weight: number }[];
  };
  greyFabricLot?: {
    lotNumber: string;
    knitter?: { name: string };
    greyWeight?: number;
  };
  dyeing?: {
    lotNo: string;
    hfCode?: string;
    status?: string;
    colour?: { name: string };
  };
}

interface MemoApi {
  id: number;
  memoNo: number;
  issueDate: string;
  dyerId: number;
  dyer?: { id: number; name: string };
  remarks?: string;
  lines?: MemoLineApi[];
  createdAt: string;
}

interface MemoFormData {
  issueDate: string;
  dyerId: string;
  remarks: string;
  lines: MemoLineFormData[];
}

const emptyLine = (): MemoLineFormData => ({
  source: 'YARN_LOT',
  yarnLotId: '',
  knitterId: '',
  knitterProgramId: '',
  newProgramKnitterId: '',
  newProgramYarnLotId: '',
  newProgramQty: '',
  newProgramGreyWeight: '',
  sentWeight: '',
  expectedRolls: '',
  yarnCount: '',
  dia: '',
  gg: '',
  loopLength: '',
  fabricName: '',
  fabricColour: '',
});

// ── PDF generation using double-rAF (same pattern as PurchaseOrderForm) ──────
async function generateMemoPDF(elementId: string, memoNo: number) {
  const el = document.getElementById(elementId);
  if (!el) {
    toast.error(`Print template not found for Memo #${memoNo}`);
    return;
  }
  // Double requestAnimationFrame: ensures React has completed re-render + paint
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
  const html2pdf = (await import('html2pdf.js')).default;
  await html2pdf()
    .set({
      margin: [10, 10, 10, 10],
      filename: `Memo-${memoNo}.pdf`,
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(el)
    .save();
}

export default function MemosPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [printingId, setPrintingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<MemoFormData>({
    issueDate: new Date().toISOString().split('T')[0],
    dyerId: '',
    remarks: '',
    lines: [emptyLine()],
  });

  const { data: memos = [], isLoading } = useQuery<MemoApi[]>({
    queryKey: ['memos'],
    queryFn: async () => (await api.get<MemoApi[]>('/memos')).data,
  });

  const { data: lots = [] } = useQuery<YarnLot[]>({
    queryKey: ['yarn-lots'],
    queryFn: async () => (await api.get<YarnLot[]>('/yarn-lots')).data,
  });

  const { data: knitters = [] } = useQuery<Knitter[]>({
    queryKey: ['knitters'],
    queryFn: async () => (await api.get<Knitter[]>('/knitters')).data,
  });

  const { data: dyers = [] } = useQuery<Dyer[]>({
    queryKey: ['dyers'],
    queryFn: async () => (await api.get<Dyer[]>('/dyers')).data,
  });

  const { data: colours = [] } = useQuery<Colour[]>({
    queryKey: ['colours'],
    queryFn: async () => (await api.get<Colour[]>('/colours')).data,
  });

  const { data: knitterPrograms = [] } = useQuery<KnitterProgram[]>({
    queryKey: ['knitter-programs'],
    queryFn: async () => (await api.get<KnitterProgram[]>('/knitter-programs')).data,
  });

  const { data: purchasedLots = [] } = useQuery<GreyFabricLot[]>({
    queryKey: ['grey-fabric-lots', 'PURCHASED'],
    queryFn: async () =>
      (await api.get<GreyFabricLot[]>('/grey-fabric-lots', { params: { source: 'PURCHASED', status: 'AVAILABLE' } })).data,
  });

  const createMutation = useMutation<MemoApi, Error, Record<string, unknown>>({
    mutationFn: (body) => api.post<MemoApi>('/memos', body).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memos'] });
      queryClient.invalidateQueries({ queryKey: ['dyeings'] });
      queryClient.invalidateQueries({ queryKey: ['knitter-programs'] });
      toast.success('Memo created');
      setCreateOpen(false);
      setFormData({ issueDate: new Date().toISOString().split('T')[0], dyerId: '', remarks: '', lines: [emptyLine()] });
    },
    onError: (err: Error & { response?: { data?: { message?: string | { message?: string[] } } } }) => {
      const data = err?.response?.data;
      let msg = 'Failed to create memo';
      if (data?.message) {
        if (typeof data.message === 'string') msg = data.message;
        else if (Array.isArray(data.message.message)) msg = data.message.message.map((m: string | { message?: string }) => typeof m === 'string' ? m : m?.message).join(', ');
      }
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation<unknown, Error, number>({
    mutationFn: (id) => api.delete(`/memos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memos'] });
      queryClient.invalidateQueries({ queryKey: ['dyeings'] });
      toast.success('Memo deleted');
    },
    onError: () => toast.error('Failed to delete memo'),
  });

  const handleLineChange = (index: number, field: keyof MemoLineFormData, value: string) => {
    const newLines = [...formData.lines];
    newLines[index] = { ...newLines[index], [field]: value };

    // Auto-fill weight from yarn lot
    if (field === 'yarnLotId' && value) {
      const lot = lots.find(l => String(l.id) === value);
      if (lot) {
        const weight = lot.availableWeight ?? lot.totalWeight;
        if (!newLines[index].sentWeight && weight && weight > 0) {
          newLines[index].sentWeight = String(weight);
        }
        if (lot.count && !newLines[index].yarnCount) {
          newLines[index].yarnCount = lot.count;
        }
      }
    }
    setFormData({ ...formData, lines: newLines });
  };

  const addLine = () => setFormData({ ...formData, lines: [...formData.lines, emptyLine()] });
  const removeLine = (i: number) => setFormData({ ...formData, lines: formData.lines.filter((_, idx) => idx !== i) });
  const confirmDelete = (id: number) => { if (window.confirm('Delete this memo and its dyeing records?')) deleteMutation.mutate(id); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = formData.lines.map(l => {
      if (l.source === 'PROGRAM_LOT' && l.knitterProgramId) {
        return {
          knitterProgramId: parseInt(l.knitterProgramId),
          sentWeight: l.sentWeight ? parseFloat(l.sentWeight) : undefined,
          yarnCount: l.yarnCount || undefined,
          dia: l.dia || undefined,
          gg: l.gg || undefined,
          loopLength: l.loopLength || undefined,
          fabricName: l.fabricName || undefined,
          fabricColour: l.fabricColour || undefined,
        };
      }
      if (l.source === 'NEW_PROGRAM' && l.newProgramKnitterId && l.newProgramYarnLotId) {
        return {
          newProgram: {
            knitterId: parseInt(l.newProgramKnitterId),
            yarns: [{ yarnLotId: parseInt(l.newProgramYarnLotId), quantityUsed: parseFloat(l.newProgramQty) }],
            greyWeight: parseFloat(l.newProgramGreyWeight),
          },
          sentWeight: l.sentWeight ? parseFloat(l.sentWeight) : undefined,
          yarnCount: l.yarnCount || undefined,
          dia: l.dia || undefined,
          gg: l.gg || undefined,
          loopLength: l.loopLength || undefined,
          fabricName: l.fabricName || undefined,
          fabricColour: l.fabricColour || undefined,
        };
      }
      // Default: YARN_LOT (legacy)
      return {
        yarnLotId: l.yarnLotId ? parseInt(l.yarnLotId) : undefined,
        knitterId: l.knitterId ? parseInt(l.knitterId) : undefined,
        sentWeight: l.sentWeight ? parseFloat(l.sentWeight) : undefined,
        expectedRolls: l.expectedRolls ? parseInt(l.expectedRolls) : undefined,
        yarnCount: l.yarnCount || undefined,
        dia: l.dia || undefined,
        gg: l.gg || undefined,
        loopLength: l.loopLength || undefined,
        fabricName: l.fabricName || undefined,
        fabricColour: l.fabricColour || undefined,
      };
    });

    const payload: Record<string, unknown> = {
      issueDate: formData.issueDate,
      dyerId: formData.dyerId ? parseInt(formData.dyerId) : undefined,
      remarks: formData.remarks || undefined,
      lines,
    };
    createMutation.mutate(payload);
  };

  const handlePrint = async (memo: MemoApi) => {
    setPrintingId(memo.id);
    try {
      await queryClient.refetchQueries({ queryKey: ['memos'] });
      await generateMemoPDF(`memo-pdf-${memo.id}`, memo.memoNo);
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast.error('PDF generation failed — try again.');
    } finally {
      setPrintingId(null);
    }
  };

  return (
    <ProtectedRoute>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              Dispatch Memos
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {isLoading ? 'Loading…' : `${memos.length} memo${memos.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200"
          >
            <PlusCircle className="h-4 w-4" /> New Memo
          </button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 bg-slate-900/80 hover:bg-slate-900/80">
                  {['', 'Memo #', 'Lot No', 'Issue Date', 'Dyer', 'Lines', 'Total Wt (kg)', 'Remarks', 'Actions'].map(h => (
                    <TableHead key={h} className="text-xs font-semibold uppercase tracking-widest text-slate-400">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-slate-800">
                      {Array.from({ length: 9 }).map((__, j) => (
                        <TableCell key={j}><div className="h-4 rounded bg-slate-800 animate-pulse" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : memos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center text-sm text-slate-500">
                      No memos yet. Click &quot;New Memo&quot; to create one.
                    </TableCell>
                  </TableRow>
                ) : memos.map((m) => {
                  const totalWt = (m.lines ?? []).reduce((s, l) => s + l.sentWeight, 0);
                  const isExpanded = expandedId === m.id;
                  return (
                    <>
                      <TableRow key={m.id} className="border-slate-800/60 hover:bg-slate-800/20 transition-colors cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : m.id)}>
                        <TableCell className="w-8">
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                        </TableCell>
                        <TableCell className="font-mono text-sm font-semibold text-indigo-300">#{m.memoNo}</TableCell>
                        <TableCell className="font-mono text-sm font-semibold text-violet-300">LOT-{m.memoNo}</TableCell>
                        <TableCell className="text-slate-300">{new Date(m.issueDate).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell className="text-slate-200">{m.dyer?.name ?? '–'}</TableCell>
                        <TableCell className="text-slate-300">{m.lines?.length ?? 0} line{(m.lines?.length ?? 0) !== 1 ? 's' : ''}</TableCell>
                        <TableCell className="font-semibold text-slate-200">{totalWt.toFixed(2)} kg</TableCell>
                        <TableCell className="text-slate-400 max-w-[200px] truncate">{m.remarks || '–'}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1.5">
                            <button
                              id={`memo-print-btn-${m.id}`}
                              title="Download PDF"
                              disabled={printingId === m.id}
                              onClick={() => handlePrint(m)}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                            >
                              <Printer className="h-3 w-3" />
                              {printingId === m.id ? '…' : ''}
                            </button>
                            <button title="Delete" onClick={() => confirmDelete(m.id)} disabled={deleteMutation.isPending}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/20 transition-all disabled:opacity-50">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {/* Expanded Detail Rows */}
                      {isExpanded && m.lines?.map((line, li) => {
                        const lotNo = line.knittingLot?.lotNo ?? line.greyFabricLot?.lotNumber ?? '–';
                        const hfCode = line.dyeing?.hfCode ?? '–';
                        const knitter = line.knittingLot?.knitting?.knitter?.name ?? line.greyFabricLot?.knitter?.name ?? '–';
                        const diaVal = line.dia ?? line.knittingLot?.knitting?.dia;
                        const ggVal = line.gg ?? line.knittingLot?.knitting?.gauge;
                        const llVal = line.loopLength ?? line.knittingLot?.knitting?.loopLength;
                        const countVal = line.yarnCount ?? line.knittingLot?.knitting?.count;
                        const nameVal = line.fabricName;
                        const colourVal = line.fabricColour ?? line.knittingLot?.entries?.[0]?.colour?.name ?? line.dyeing?.colour?.name;

                        return (
                          <TableRow key={`${m.id}-${li}`} className="border-slate-800/30 bg-slate-800/15">
                            <TableCell />
                            <TableCell className="text-xs text-slate-500">Line {li + 1}</TableCell>
                            <TableCell className="font-mono text-xs text-violet-300">LOT-{m.memoNo}</TableCell>
                            <TableCell colSpan={2} className="text-slate-300 text-sm">
                              <div className="flex flex-col gap-1">
                                <div>
                                  <span className="text-slate-400 mr-1">Lot:</span>
                                  <span className="font-mono text-indigo-300">{lotNo}</span>
                                  <span className="text-slate-500 mx-2">|</span>
                                  <span className="text-slate-400 mr-1">HF:</span>
                                  <span className="text-teal-300">{hfCode}</span>
                                </div>
                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs mt-1">
                                  {diaVal && <span><span className="text-slate-500">Dia:</span> <span className="text-amber-300">{diaVal}</span></span>}
                                  {ggVal && <span><span className="text-slate-500">GG:</span> <span className="text-amber-300">{ggVal}</span></span>}
                                  {llVal && <span><span className="text-slate-500">LL:</span> <span className="text-amber-300">{llVal}</span></span>}
                                  {countVal && <span><span className="text-slate-500">Count:</span> <span className="text-amber-300">{countVal}</span></span>}
                                  {colourVal && <span><span className="text-slate-500">Colour:</span> <span className="text-amber-300">{colourVal}</span></span>}
                                  {nameVal && <span><span className="text-slate-500">Fabric:</span> <span className="text-amber-300">{nameVal}</span></span>}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-300 text-sm">{knitter}</TableCell>
                            <TableCell className="text-slate-200 font-medium">{line.sentWeight.toFixed(2)} kg</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                line.dyeing?.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-400' :
                                line.dyeing?.status === 'IN_DYEING' ? 'bg-blue-500/15 text-blue-400' :
                                'bg-slate-500/15 text-slate-400'
                              }`}>
                                {line.dyeing?.status ?? 'PENDING'}
                              </span>
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        );
                      })}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Hidden PDF print templates — one per memo, rendered off-screen */}
        <div className="hidden print:hidden" aria-hidden="true">
          {memos.map(m => (
            <div
              key={m.id}
              id={`memo-pdf-${m.id}`}
              style={{
                position: 'fixed', left: '-9999px', top: 0,
                width: '210mm', padding: '15mm',
                fontFamily: 'Arial, sans-serif', color: '#000', background: '#fff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>HF TEXTILES</h2>
                  <p style={{ fontSize: 11, margin: '2px 0 0', color: '#555' }}>Dyeing Dispatch Memo</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#1e40af' }}>Memo #{m.memoNo}</p>
                  <p style={{ fontSize: 11, margin: '2px 0 0', color: '#555' }}>
                    Date: {new Date(m.issueDate).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>
              <hr style={{ borderColor: '#ccc', margin: '8px 0' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12, fontSize: 12 }}>
                <div><strong>Dyer:</strong> {m.dyer?.name ?? '–'}</div>
                {m.remarks && <div><strong>Remarks:</strong> {m.remarks}</div>}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#f0f4f8' }}>
                    {['#', 'Lot No', 'HF Code', 'Knitter', 'Fabric / Specs', 'Sent Wt (kg)', 'Status'].map(h => (
                      <th key={h} style={{ border: '1px solid #bbb', padding: '5px 8px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(m.lines ?? []).map((line, i) => {
                    const lotNo = line.knittingLot?.lotNo ?? line.greyFabricLot?.lotNumber ?? '–';
                    const hfCode = line.dyeing?.hfCode ?? '–';
                    const knitter = line.knittingLot?.knitting?.knitter?.name ?? line.greyFabricLot?.knitter?.name ?? '–';
                    const specs = [
                      line.dia ? `Dia: ${line.dia}` : '',
                      line.gg ? `GG: ${line.gg}` : '',
                      line.loopLength ? `LL: ${line.loopLength}` : '',
                      line.yarnCount ? `Count: ${line.yarnCount}` : '',
                      line.fabricColour ? `Colour: ${line.fabricColour}` : '',
                      line.fabricName ? `Fabric: ${line.fabricName}` : '',
                    ].filter(Boolean).join(' | ');
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                        <td style={{ border: '1px solid #bbb', padding: '4px 8px' }}>{i + 1}</td>
                        <td style={{ border: '1px solid #bbb', padding: '4px 8px', fontFamily: 'monospace' }}>{lotNo}</td>
                        <td style={{ border: '1px solid #bbb', padding: '4px 8px' }}>{hfCode}</td>
                        <td style={{ border: '1px solid #bbb', padding: '4px 8px' }}>{knitter}</td>
                        <td style={{ border: '1px solid #bbb', padding: '4px 8px', fontSize: 10 }}>{specs || '–'}</td>
                        <td style={{ border: '1px solid #bbb', padding: '4px 8px', textAlign: 'right' }}>{line.sentWeight.toFixed(2)}</td>
                        <td style={{ border: '1px solid #bbb', padding: '4px 8px' }}>{line.dyeing?.status ?? 'PENDING'}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f0f4f8' }}>
                    <td colSpan={5} style={{ border: '1px solid #bbb', padding: '5px 8px', fontWeight: 700, textAlign: 'right' }}>Total</td>
                    <td style={{ border: '1px solid #bbb', padding: '5px 8px', fontWeight: 700, textAlign: 'right' }}>
                      {(m.lines ?? []).reduce((s, l) => s + l.sentWeight, 0).toFixed(2)}
                    </td>
                    <td style={{ border: '1px solid #bbb' }} />
                  </tr>
                </tfoot>
              </table>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 60, fontSize: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ borderTop: '1px solid #333', width: 140, margin: '0 auto 4px' }} />
                  Authorized By
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ borderTop: '1px solid #333', width: 140, margin: '0 auto 4px' }} />
                  Received By (Dyer)
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-100 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-indigo-400" />
                Create New Memo
                <span className="ml-auto text-sm font-mono text-violet-400 bg-violet-500/10 border border-violet-500/30 px-2.5 py-0.5 rounded-lg">
                  Lot No: LOT-{(memos.length > 0 ? Math.max(...memos.map(m => m.memoNo)) + 1 : 1)}
                </span>
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Issue Date</Label>
                  <Input type="date" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={formData.issueDate} onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Dyer <span className="text-rose-400">*</span></Label>
                  <select className={SELECT_CLASS} value={formData.dyerId}
                    onChange={(e) => setFormData({ ...formData, dyerId: e.target.value })}>
                    <option value="">Select Dyer…</option>
                    {dyers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Remarks</Label>
                  <Input placeholder="Optional" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} />
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <p className="text-sm font-semibold text-slate-300">Memo Lines</p>
                <button type="button" onClick={addLine}
                  className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                  <PlusCircle className="h-3.5 w-3.5" /> Add Line
                </button>
              </div>

              {formData.lines.map((line, i) => (
                <div key={i} className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">Line {i + 1}</span>
                    {formData.lines.length > 1 && (
                      <button type="button" onClick={() => removeLine(i)} className="text-rose-400 hover:text-rose-300">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Source selector */}
                  <div>
                    <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Grey Fabric Source</Label>
                    <div className="flex rounded-lg overflow-hidden border border-slate-700/60">
                      {([['YARN_LOT', 'Yarn Lot'], ['PROGRAM_LOT', 'Knitter Program'], ['NEW_PROGRAM', 'New Program']] as const).map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleLineChange(i, 'source', val)}
                          className={`flex-1 py-1.5 text-xs font-medium transition-all ${
                            line.source === val
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Source-specific fields */}
                  <div className="grid grid-cols-2 gap-3">
                    {line.source === 'YARN_LOT' && (
                      <>
                        <div>
                          <Label className="text-xs font-medium text-slate-400 mb-1 block">Yarn Lot (HF Code) <span className="text-rose-400">*</span></Label>
                          <select className={SELECT_CLASS} value={line.yarnLotId}
                            onChange={(e) => handleLineChange(i, 'yarnLotId', e.target.value)}>
                            <option value="">Select…</option>
                            {lots.map(l => <option key={l.id} value={l.id}>{l.hfCode} ({l.availableWeight ?? l.totalWeight}kg)</option>)}
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-slate-400 mb-1 block">Knitter <span className="text-rose-400">*</span></Label>
                          <select className={SELECT_CLASS} value={line.knitterId}
                            onChange={(e) => handleLineChange(i, 'knitterId', e.target.value)}>
                            <option value="">Select…</option>
                            {knitters.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                          </select>
                        </div>
                      </>
                    )}

                    {line.source === 'PROGRAM_LOT' && (
                      <div className="col-span-2">
                        <Label className="text-xs font-medium text-slate-400 mb-1 block">Knitter Program <span className="text-rose-400">*</span></Label>
                        <select className={SELECT_CLASS} value={line.knitterProgramId}
                          onChange={(e) => handleLineChange(i, 'knitterProgramId', e.target.value)}>
                          <option value="">Select Program…</option>
                          {knitterPrograms.map(p => {
                            const availLot = p.greyFabricLots?.find(l => l.status === 'AVAILABLE');
                            return (
                              <option key={p.id} value={p.id} disabled={!availLot}>
                                {p.programNo ?? `#${p.id}`} — {p.knitter?.name ?? '?'} — {p.greyWeight}kg
                                {!availLot ? ' (no lot available)' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    )}

                    {line.source === 'NEW_PROGRAM' && (
                      <>
                        <div>
                          <Label className="text-xs font-medium text-slate-400 mb-1 block">Knitter <span className="text-rose-400">*</span></Label>
                          <select className={SELECT_CLASS} value={line.newProgramKnitterId}
                            onChange={(e) => handleLineChange(i, 'newProgramKnitterId', e.target.value)}>
                            <option value="">Select…</option>
                            {knitters.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-slate-400 mb-1 block">Yarn Lot <span className="text-rose-400">*</span></Label>
                          <select className={SELECT_CLASS} value={line.newProgramYarnLotId}
                            onChange={(e) => handleLineChange(i, 'newProgramYarnLotId', e.target.value)}>
                            <option value="">Select…</option>
                            {lots.map(l => <option key={l.id} value={l.id}>{l.hfCode} ({l.availableWeight ?? l.totalWeight}kg)</option>)}
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-slate-400 mb-1 block">Qty Used (kg) <span className="text-rose-400">*</span></Label>
                          <Input type="number" step="0.01" placeholder="Yarn consumed" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                            value={line.newProgramQty} onChange={(e) => handleLineChange(i, 'newProgramQty', e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-slate-400 mb-1 block">Grey Weight (kg) <span className="text-rose-400">*</span></Label>
                          <Input type="number" step="0.01" placeholder="Fabric produced" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                            value={line.newProgramGreyWeight} onChange={(e) => handleLineChange(i, 'newProgramGreyWeight', e.target.value)} />
                        </div>
                      </>
                    )}

                    {/* Common fields for all source types */}
                    <div>
                      <Label className="text-xs font-medium text-slate-400 mb-1 block">Sent Weight (kg)</Label>
                      <Input type="number" step="0.01" placeholder="Auto from lot" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                        value={line.sentWeight} onChange={(e) => handleLineChange(i, 'sentWeight', e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-400 mb-1 block">Expected Rolls</Label>
                      <Input type="number" min="0" placeholder="Optional" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                        value={line.expectedRolls} onChange={(e) => handleLineChange(i, 'expectedRolls', e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-400 mb-1 block">Dia</Label>
                      <Input placeholder="e.g. 30" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                        value={line.dia} onChange={(e) => handleLineChange(i, 'dia', e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-400 mb-1 block">Gauge (GG)</Label>
                      <Input placeholder="e.g. 24" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                        value={line.gg} onChange={(e) => handleLineChange(i, 'gg', e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-400 mb-1 block">Loop Length</Label>
                      <Input placeholder="e.g. 3.20" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                        value={line.loopLength} onChange={(e) => handleLineChange(i, 'loopLength', e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-400 mb-1 block">Yarn Count</Label>
                      <Input placeholder="e.g. 30s Combed" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                        value={line.yarnCount} onChange={(e) => handleLineChange(i, 'yarnCount', e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-400 mb-1 block">Fabric Name</Label>
                      <Input placeholder="e.g. S/J" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                        value={line.fabricName} onChange={(e) => handleLineChange(i, 'fabricName', e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-400 mb-1 block">Colour</Label>
                      <select className={SELECT_CLASS} value={line.fabricColour}
                        onChange={(e) => handleLineChange(i, 'fabricColour', e.target.value)}>
                        <option value="">Select Colour…</option>
                        {colours.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}
                  className="border-slate-700 hover:bg-slate-800 text-slate-300">
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold disabled:opacity-60">
                  {createMutation.isPending ? 'Creating…' : 'Create Memo'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
