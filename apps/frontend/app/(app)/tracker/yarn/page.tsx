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
import { Package2, Search, Pencil, Trash2, ChevronDown } from 'lucide-react';
import { YarnLotForm } from '@/components/yarn/YarnLotForm';
import type { YarnLot, YarnLotFormData, Mill, Knitter } from '@/types/yarn';
import { ProtectedRoute } from '@/components/auth/protected-route';

const SELECT_CLASS =
  'rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all';

export default function YarnPage() {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editLot, setEditLot] = useState<YarnLot | null>(null);
  const [searchHF, setSearchHF] = useState('');
  const [selectedKnitterId, setSelectedKnitterId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'all' | 'knitter'>('all');

  const { data: lots = [], isLoading } = useQuery<YarnLot[]>({
    queryKey: ['yarn-lots', searchHF, selectedKnitterId, viewMode],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (viewMode === 'all' && searchHF) params['hfCode'] = searchHF;
      if (viewMode === 'knitter' && selectedKnitterId) params['knitterId'] = selectedKnitterId;
      const { data } = await api.get<YarnLot[]>('/yarn-lots', { params });
      return data;
    },
  });

  const { data: mills = [] } = useQuery<Mill[]>({
    queryKey: ['mills'],
    queryFn: async () => (await api.get<Mill[]>('/mills')).data,
  });

  const { data: knitters = [] } = useQuery<Knitter[]>({
    queryKey: ['knitters'],
    queryFn: async () => (await api.get<Knitter[]>('/knitters')).data,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: { id: number } & Partial<YarnLotFormData>) =>
      api.patch(`/yarn-lots/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yarn-lots'] });
      toast.success('Yarn lot updated');
      setEditOpen(false);
      setEditLot(null);
    },
    onError: () => toast.error('Update failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/yarn-lots/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yarn-lots'] });
      toast.success('Yarn lot deleted');
    },
    onError: () => toast.error('Delete failed'),
  });

  const openEdit = (lot: YarnLot) => { setEditLot(lot); setEditOpen(true); };
  const confirmDelete = (id: number) => {
    if (window.confirm('Delete this yarn lot?')) deleteMutation.mutate(id);
  };

  return (
    <ProtectedRoute>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              Yarn Inventory
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {isLoading ? 'Loading…' : `${lots.length} lot${lots.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          {/* Add Yarn Lot button removed — yarn lots are created automatically
              via the PO → Yarn Inward → RECEIVED transition to ensure
              every lot is traceable to a Purchase Order. */}
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search HF code…"
              value={searchHF}
              onChange={(e) => setSearchHF(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-lg border border-slate-700/60 bg-slate-800/80 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all w-48"
            />
          </div>
          <div className="relative">
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'all' | 'knitter')}
              className={SELECT_CLASS + ' pr-8 appearance-none'}
            >
              <option value="all">All Inventory</option>
              <option value="knitter">By Knitter</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
          </div>
          {viewMode === 'knitter' && (
            <div className="relative">
              <select
                value={selectedKnitterId}
                onChange={(e) => setSelectedKnitterId(e.target.value)}
                className={SELECT_CLASS + ' pr-8 appearance-none'}
              >
                <option value="">All knitters…</option>
                {knitters.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 bg-slate-900/80 hover:bg-slate-900/80">
                  {viewMode === 'knitter' ? (
                    <>
                      {['HF Code','Mill','Knitter','Received (kg)','Used (kg)','Available (kg)','Actions'].map(h => (
                        <TableHead key={h} className="text-xs font-semibold uppercase tracking-widest text-slate-400">{h}</TableHead>
                      ))}
                    </>
                  ) : (
                    <>
                      {['HF Code','PO No','Mill','Count','Status','Total (kg)','Available (kg)','Rate/kg','Total Cost','Actions'].map(h => (
                        <TableHead key={h} className="text-xs font-semibold uppercase tracking-widest text-slate-400">{h}</TableHead>
                      ))}
                    </>
                  )}
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
                ) : lots.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-sm text-slate-500">
                      No yarn lots found. Add one to get started.
                    </TableCell>
                  </TableRow>
                ) : lots.map((lot) => {
                  if (viewMode === 'knitter') {
                    // If this lot has no knitter stock entries, show a placeholder row
                    if (!lot.knitterStocks || lot.knitterStocks.length === 0) {
                      return (
                        <TableRow key={lot.id} className="border-slate-800/60 hover:bg-slate-800/20 transition-colors">
                          <TableCell className="font-mono text-sm font-semibold text-blue-300">{lot.hfCode}</TableCell>
                          <TableCell className="text-slate-200">{lot.mill?.name}</TableCell>
                          <TableCell className="text-slate-500 italic" colSpan={3}>No stock with any knitter</TableCell>
                          <TableCell>
                            <div className="flex gap-1.5">
                              <button onClick={() => openEdit(lot)}
                                className="inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-xs text-blue-300 hover:bg-blue-500/20 transition-all">
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button onClick={() => confirmDelete(lot.id)} disabled={deleteMutation.isPending}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/20 transition-all disabled:opacity-50">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return lot.knitterStocks?.map((stock) => {
                      const used = stock.receivedWeight - stock.remainingWeight;
                      return (
                        <TableRow key={`${lot.id}-${stock.knitterId}`} className="border-slate-800/60 hover:bg-slate-800/20 transition-colors">
                          <TableCell className="font-mono text-sm font-semibold text-blue-300">{lot.hfCode}</TableCell>
                          <TableCell className="text-slate-200">{lot.mill?.name}</TableCell>
                          <TableCell className="text-slate-200">{stock.knitter?.name}</TableCell>
                          <TableCell className="text-slate-300">{stock.receivedWeight.toFixed(2)} kg</TableCell>
                          <TableCell className="text-slate-300">{used.toFixed(2)} kg</TableCell>
                          <TableCell className="font-semibold text-emerald-400">{stock.remainingWeight.toFixed(2)} kg</TableCell>
                          <TableCell>
                            <div className="flex gap-1.5">
                              <button onClick={() => openEdit(lot)}
                                className="inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-xs text-blue-300 hover:bg-blue-500/20 transition-all">
                                <Pencil className="h-3 w-3" /> Edit
                              </button>
                              <button onClick={() => confirmDelete(lot.id)} disabled={deleteMutation.isPending}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/20 transition-all disabled:opacity-50">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    });
                  }
                  return (
                    <TableRow key={lot.id} className="border-slate-800/60 hover:bg-slate-800/20 transition-colors">
                      <TableCell className="font-mono text-sm font-semibold text-blue-300">{lot.hfCode}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-400">{lot.purchaseOrderNo ?? '—'}</TableCell>
                      <TableCell className="text-slate-200">{lot.mill?.name}</TableCell>
                      <TableCell className="text-slate-300">{lot.count ?? '—'}</TableCell>
                      <TableCell>
                        {lot.status === 'PENDING' ? (
                          <span className="inline-flex items-center rounded-md bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-400 ring-1 ring-inset ring-yellow-500/20">PENDING</span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">{lot.status || 'ACTIVE'}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-300">{Number(lot.totalWeight).toFixed(2)} kg</TableCell>
                      <TableCell className="font-semibold text-emerald-400">{Number(lot.availableWeight).toFixed(2)} kg</TableCell>
                      <TableCell className="text-slate-300">₹{Number(lot.ratePerKg).toFixed(2)}</TableCell>
                      <TableCell className="font-semibold text-slate-200">₹{Number(lot.totalCost).toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1.5">
                          <button onClick={() => openEdit(lot)}
                            className="inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-xs text-blue-300 hover:bg-blue-500/20 transition-all">
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button onClick={() => confirmDelete(lot.id)} disabled={deleteMutation.isPending}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/20 transition-all disabled:opacity-50">
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
          {lots.length > 0 && !isLoading && (
            <div className="border-t border-slate-800/60 px-4 py-2.5 text-right">
              <span className="text-xs text-slate-500">{lots.length} lot{lots.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Edit Dialog — only opens when editing an existing lot */}
        <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) setEditLot(null); }}>
          <DialogContent className="max-w-lg bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-100 flex items-center gap-2">
                <Package2 className="h-5 w-5 text-emerald-400" />
                Edit Yarn Lot
              </DialogTitle>
            </DialogHeader>
            <div className="mt-2">
              <YarnLotForm
                key={editLot?.id ?? 'edit'}
                initial={editLot}
                mills={mills}
                onSubmit={(data: YarnLotFormData) => {
                  if (editLot) updateMutation.mutate({ id: editLot.id, ...data });
                }}
                isSubmitting={updateMutation.isPending}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
