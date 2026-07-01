'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { PurchaseOrder, CreatePurchaseOrderInput } from '@/types/purchase-order';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Printer, FileText, Download, Trash2, CheckCircle, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import PurchaseOrderPreview from './PurchaseOrderPreview';
import PurchaseOrderPrintTemplate from './PurchaseOrderPrintTemplate';
import { generatePOPDF } from '@/lib/generatePOPDF';
import { printElement } from '@/lib/printElement';

interface POItem {
  description: string;
  count: string;
  quality: string;
  bags: number;
  bagWeight: number;
  totalWeight: number;
  rate: number;
  cgst: number;
  sgst: number;
}

interface POFormData {
  hfCode: string;
  fbNo: string;
  agent: string;
  date: string;
  deliveryDate: string;
  supplierName: string;
  supplierAddress: string;
  supplierGST: string;
  deliveryName: string;
  deliveryAddress: string;
  deliveryGST: string;
  items: POItem[];
  // Grey Fabric PO fields
  fabricType: string;
  fabricColour: string;
  fabricDia: string;
  fabricGsm: string;
  totalFabricWeight: string;
}

const EMPTY_FORM: POFormData = {
  hfCode: '',
  fbNo: '',
  agent: '',
  date: new Date().toISOString().split('T')[0],
  deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  supplierName: '',
  supplierAddress: '',
  supplierGST: '',
  deliveryName: 'CHHAVI NEETU TEXTILES LLP',
  deliveryAddress: 'No. 789, Kallangayam, Andipalayam, Tirupur - 641601',
  deliveryGST: '33AATFC5860D1ZC',
  items: [
    {
      description: '',
      count: '',
      quality: '',
      bags: 0,
      bagWeight: 0,
      totalWeight: 0,
      rate: 0,
      cgst: 9,
      sgst: 9,
    },
  ],
  fabricType: '',
  fabricColour: '',
  fabricDia: '',
  fabricGsm: '',
  totalFabricWeight: '',
};

export default function PurchaseOrderForm() {
  const queryClient = useQueryClient();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [poType, setPoType] = useState<'YARN' | 'GREY_FABRIC'>('YARN');
  const [manualSupplier, setManualSupplier] = useState(false);
  const [printConfirmPO, setPrintConfirmPO] = useState<PurchaseOrder | null>(null);
  const [printingPDF, setPrintingPDF] = useState(false);
  const [hfCodeError, setHfCodeError] = useState<string | null>(null);
  // Track exact IDs from dropdown selection for reliable inward auto-linking
  const [selectedMillId, setSelectedMillId] = useState<number | null>(null);
  const [selectedKnitterId, setSelectedKnitterId] = useState<number | null>(null);

  const form = useForm<POFormData>({
    defaultValues: EMPTY_FORM,
  });

  const { control, register, handleSubmit, watch, setValue, getValues } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Watch items to dynamically calculate totals and weights
  // eslint-disable-next-line react-hooks/incompatible-library
  const watchedItems = watch('items');

  // Fetch mills for supplier dropdown
  interface SupplierEntity { id: number; name: string; addressLine1?: string; addressLine2?: string; city?: string; state?: string; pincode?: string; gstin?: string; }
  const { data: mills = [] } = useQuery<SupplierEntity[]>({
    queryKey: ['mills'],
    queryFn: async () => (await api.get('/mills')).data,
  });

  // Fetch knitters for supplier dropdown
  const { data: knitters = [] } = useQuery<SupplierEntity[]>({
    queryKey: ['knitters'],
    queryFn: async () => (await api.get('/knitters')).data,
  });

  // Build full address from entity address fields
  const buildAddress = (entity: SupplierEntity) => {
    return [entity.addressLine1, entity.addressLine2, entity.city, entity.state, entity.pincode]
      .filter(Boolean).join(', ');
  };

  // Combined supplier list logic removed since it is handled inline in the template

  const handleSupplierSelect = (val: string) => {
    if (val === '__manual__') {
      setManualSupplier(true);
      setValue('supplierName', '');
      setSelectedMillId(null);
      return;
    }
    // val format: "type:id"
    const [type, idStr] = val.split(':');
    const id = parseInt(idStr);
    const entity = type === 'Mill'
      ? mills.find(m => m.id === id)
      : knitters.find(k => k.id === id);
    if (!entity) return;
    setValue('supplierName', entity.name);
    const address = buildAddress(entity);
    setValue('supplierAddress', address || '');
    setValue('supplierGST', entity.gstin || '');
    // Store the resolved Mill ID for reliable inward linking
    if (type === 'Mill') setSelectedMillId(id);
    else setSelectedMillId(null);
  };

  // Query existing POs for review and listing
  const { data: purchaseOrders = [] } = useQuery<PurchaseOrder[]>({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      const response = await api.get('/purchase-orders');
      return response.data;
    },
  });

  // Create PO Mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreatePurchaseOrderInput) => {
      const response = await api.post('/purchase-orders', data);
      return response.data as PurchaseOrder & { inwardLinkWarning?: string | null };
    },
    onSuccess: (result) => {
      toast.success('Purchase Order saved successfully!');
      // Surface a non-blocking yellow warning if mill/knitter could not be auto-linked
      if (result?.inwardLinkWarning) {
        toast.warning(
          `PO saved — Yarn Inward auto-link pending. ${result.inwardLinkWarning}`,
          { duration: 8000 }
        );
      }
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      form.reset(EMPTY_FORM);
      setSelectedMillId(null);
      setSelectedKnitterId(null);
      setHfCodeError(null);
    },
    onError: (err: unknown) => {
      console.error('[PO Create Error]', err);
      const axiosErr = err as {
        response?: {
          data?: {
            message?: string | string[] | { message?: string | string[] };
          };
        };
      };
      let msg = axiosErr?.response?.data?.message;
      if (msg && typeof msg === 'object' && !Array.isArray(msg) && 'message' in msg) {
        msg = msg.message;
      }
      if (Array.isArray(msg)) {
        toast.error('Validation errors: ' + msg.join('; '));
      } else if (typeof msg === 'string') {
        // Surface HF Code / FB No. duplicate errors near the field
        if (msg.includes('HF Code') || msg.includes('FB No.')) {
          setHfCodeError(msg);
        } else {
          toast.error(msg);
        }
      } else {
        toast.error('Failed to save Purchase Order to database');
      }
    },
  });

  // Handle dynamic weight calculation when bags or bagWeight change
  const handleBagsOrWeightChange = (index: number) => {
    const item = getValues(`items.${index}`);
    const bags = Number(item.bags) || 0;
    const bagWeight = Number(item.bagWeight) || 0;
    setValue(`items.${index}.totalWeight`, Number((bags * bagWeight).toFixed(2)));
  };

  const addRow = () => {
    append({
      description: '',
      count: '',
      quality: '',
      bags: 0,
      bagWeight: 0,
      totalWeight: 0,
      rate: 0,
      cgst: 9,
      sgst: 9,
    });
  };

  const handleConfirm = async () => {
    const formData = getValues();
    setHfCodeError(null);

    // Include poType, fabric-specific fields, and resolved IDs in the payload
    const payload: CreatePurchaseOrderInput = {
      ...formData,
      poType,
      totalFabricWeight: formData.totalFabricWeight ? parseFloat(formData.totalFabricWeight) : undefined,
      // Pass exact IDs when available — eliminates fuzzy string matching on the backend
      ...(selectedMillId !== null && { millId: selectedMillId }),
      ...(selectedKnitterId !== null && { knitterId: selectedKnitterId }),
      // FB No. for Fabric POs
      ...(poType === 'GREY_FABRIC' && formData.fbNo && { fbNo: formData.fbNo }),
    };
    
    // Fix #4: Strip hfCode if GREY_FABRIC, strip fbNo if YARN to avoid unique constraint violations
    if (poType === 'GREY_FABRIC') delete payload.hfCode;
    if (poType === 'YARN') delete payload.fbNo;
    
    // Remove poNumber from payload — server generates it auto-sequentially
    const payloadWithoutPoNumber: Partial<CreatePurchaseOrderInput> & { poNumber?: string } = { ...payload };
    delete payloadWithoutPoNumber.poNumber;

    // 1. Save to the database — returns the newly created PO with its real `id`
    const savedPO = await createMutation.mutateAsync(payloadWithoutPoNumber as CreatePurchaseOrderInput);

    // 2. Wait for the list to fully refetch so the hidden print template
    //    for this PO is rendered in the DOM before we try to capture it.
    await queryClient.refetchQueries({ queryKey: ['purchase-orders'] });

    // 3. Generate PDF — use double requestAnimationFrame to ensure React has
    //    completed its re-render cycle and painted the hidden template to the DOM
    //    before html2pdf tries to capture it. Single rAF is not enough because
    //    React batches updates and may not flush synchronously within one frame.
    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });
      await generatePOPDF(`po-pdf-overlay-${savedPO.id}`, savedPO.poNumber);
    } catch (pdfErr) {
      console.error('PDF generation failed:', pdfErr);
      toast.error('PO saved, but PDF generation failed. You can download it later from the list below.');
    } finally {
      setPreviewOpen(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/purchase-orders/${id}`);
    },
    onSuccess: () => {
      toast.success('Purchase Order deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
    onError: () => {
      toast.error('Failed to delete Purchase Order');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/purchase-orders/${id}/cancel`);
    },
    onSuccess: () => {
      toast.success('Purchase Order cancelled successfully!');
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message || 'Failed to cancel Purchase Order';
      toast.error(msg);
    },
  });

  const confirmDelete = (id: string) => {
    if (window.confirm('Delete this purchase order?')) deleteMutation.mutate(id);
  };

  const confirmCancel = (po: PurchaseOrder) => {
    if (po.status === 'CANCELLED') return;
    if (window.confirm(`Are you sure you want to cancel PO ${po.poNumber}? This will also cancel any pending Yarn Inward.`)) {
      cancelMutation.mutate(String(po.id));
    }
  };

  // Grand totals computed for display
  const grandTotal = watchedItems.reduce((acc, item) => {
    const tw = Number(item.totalWeight) || 0;
    const rate = Number(item.rate) || 0;
    const taxable = tw * rate;
    const cgst = taxable * ((Number(item.cgst) || 0) / 100);
    const sgst = taxable * ((Number(item.sgst) || 0) / 100);
    return acc + taxable + cgst + sgst;
  }, 0);

  return (
    <div className="space-y-8">
      <Card className="bg-slate-900 border-slate-800 text-white shadow-xl">
        <CardHeader className="border-b border-slate-800 pb-4">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <FileText className="text-primary w-6 h-6" />
            {poType === 'YARN' ? 'Yarn Purchase Order' : 'Fabric Purchase Order'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {/* PO Type Toggle */}
          <div className="flex gap-2 mb-6">
            {(['YARN', 'GREY_FABRIC'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setPoType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  poType === type
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                {type === 'YARN' ? '🧵 Yarn PO' : '🧶 Fabric PO'}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit(() => setPreviewOpen(true))} className="space-y-6">
            
            {/* HEADER GRID — PO Number is auto-generated server-side (Issues 7) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                {/* Issue 9: Fabric PO uses FB No., Yarn PO uses HF Code */}
                <Label className="text-slate-300 font-semibold text-xs uppercase tracking-wider">
                  {poType === 'GREY_FABRIC' ? 'FB No. *' : 'HF Code *'}
                </Label>
                {poType === 'GREY_FABRIC' ? (
                  <Input
                    className="bg-slate-800 border-slate-700 mt-1 text-white focus:ring-primary"
                    placeholder="e.g. FB-001"
                    required
                    {...register('fbNo')}
                    onChange={() => setHfCodeError(null)}
                  />
                ) : (
                  <Input
                    className={`bg-slate-800 border-slate-700 mt-1 text-white focus:ring-primary ${
                      hfCodeError ? 'border-rose-500' : ''
                    }`}
                    placeholder="e.g. HF-72"
                    required
                    {...register('hfCode')}
                    onChange={() => setHfCodeError(null)}
                  />
                )}
                {hfCodeError && (
                  <p className="text-rose-400 text-xs mt-1">{hfCodeError}</p>
                )}
              </div>
              <div>
                <Label className="text-slate-300 font-semibold text-xs uppercase tracking-wider">Agent</Label>
                <Input
                  className="bg-slate-800 border-slate-700 mt-1 text-white focus:ring-primary"
                  placeholder="e.g. Self / Agent Name"
                  {...register('agent')}
                />
              </div>
              <div>
                <Label className="text-slate-300 font-semibold text-xs uppercase tracking-wider">PO Date *</Label>
                <Input
                  type="date"
                  className="bg-slate-800 border-slate-700 mt-1 text-white focus:ring-primary"
                  required
                  {...register('date')}
                />
              </div>
              <div>
                <Label className="text-slate-300 font-semibold text-xs uppercase tracking-wider">Delivery Date *</Label>
                <Input
                  type="date"
                  className="bg-slate-800 border-slate-700 mt-1 text-white focus:ring-primary"
                  required
                  {...register('deliveryDate')}
                />
              </div>
            </div>

            {/* ADDRESS SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Supplier Info */}
              <Card className="bg-slate-800 border-slate-700 text-white shadow-md">
                <CardHeader className="border-b border-slate-700 py-3 bg-slate-900/50">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">Supplier Details</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <Label className="text-slate-300 font-semibold text-xs uppercase">Supplier Name *</Label>
                    {!manualSupplier ? (
                      <>
                        <select
                          className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 mt-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                          value=""
                          onChange={(e) => handleSupplierSelect(e.target.value)}
                        >
                          <option value="">
                            {watch('supplierName') ? `✓ ${watch('supplierName')}` : 'Select Supplier…'}
                          </option>
                          {mills.length > 0 && (
                            <optgroup label="🏭 Mills">
                              {mills.map(m => (
                                <option key={`mill-${m.id}`} value={`Mill:${m.id}`}>{m.name}</option>
                              ))}
                            </optgroup>
                          )}
                          {knitters.length > 0 && (
                            <optgroup label="🧶 Knitters">
                              {knitters.map(k => (
                                <option key={`knitter-${k.id}`} value={`Knitter:${k.id}`}>{k.name}</option>
                              ))}
                            </optgroup>
                          )}
                          <option value="__manual__">✏️ Enter manually…</option>
                        </select>
                        <input type="hidden" {...register('supplierName', { required: true })} />
                        {watch('supplierName') && (
                          <p className="text-xs text-emerald-400 mt-1">✓ Selected: {watch('supplierName')}</p>
                        )}
                      </>
                    ) : (
                      <div className="flex gap-2 mt-1">
                        <Input
                          className="bg-slate-900 border-slate-700 text-white focus:ring-primary flex-1"
                          placeholder="e.g. ABC Spinning Mills"
                          required
                          {...register('supplierName')}
                        />
                        <button
                          type="button"
                          onClick={() => setManualSupplier(false)}
                          className="text-xs text-blue-400 hover:text-blue-300 whitespace-nowrap"
                        >
                          ← Back to list
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-slate-300 font-semibold text-xs uppercase">Supplier Address *</Label>
                    <textarea
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 mt-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="e.g. 123 Textile Street, Tirupur"
                      required
                      {...register('supplierAddress')}
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 font-semibold text-xs uppercase">Supplier GSTIN *</Label>
                    <Input
                      className="bg-slate-900 border-slate-700 mt-1 text-white focus:ring-primary"
                      placeholder="e.g. 33AATFC5860D1ZC"
                      required
                      {...register('supplierGST')}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Info */}
              <Card className="bg-slate-800 border-slate-700 text-white shadow-md">
                <CardHeader className="border-b border-slate-700 py-3 bg-slate-900/50">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">Delivery Address</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Knitter selector for delivery — drives auto-inward linking */}
                  <div className="space-y-1">
                    <Label className="text-slate-300 font-semibold text-xs uppercase">Delivery To (Knitter)</Label>
                    <select
                      className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 mt-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) { 
                          setSelectedKnitterId(null); 
                          setValue('deliveryName', '');
                          setValue('deliveryAddress', '');
                          setValue('deliveryGST', '');
                          return; 
                        }
                        const id = parseInt(val);
                        const k = knitters.find(k => k.id === id);
                        if (!k) return;
                        setSelectedKnitterId(id);
                        setValue('deliveryName', k.name);
                        setValue('deliveryAddress', buildAddress(k) || '');
                        setValue('deliveryGST', k.gstin || '');
                      }}
                    >
                      <option value="">— Select Knitter —</option>
                      {knitters.map(k => (
                        <option key={k.id} value={k.id}>{k.name}</option>
                      ))}
                    </select>
                    <input type="hidden" {...register('deliveryName', { required: true })} />
                    {watch('deliveryName') && (
                      <p className="text-xs text-emerald-400 mt-1">✓ Selected: {watch('deliveryName')}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-slate-300 font-semibold text-xs uppercase">Delivery Address *</Label>
                    <textarea
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 mt-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                      {...register('deliveryAddress')}
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 font-semibold text-xs uppercase">Delivery GSTIN *</Label>
                    <Input
                      className="bg-slate-900 border-slate-700 mt-1 text-white focus:ring-primary"
                      required
                      {...register('deliveryGST')}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* GREY FABRIC SPECIFIC FIELDS */}
            {poType === 'GREY_FABRIC' && (
              <Card className="bg-slate-800 border-slate-700 text-white shadow-md">
                <CardHeader className="border-b border-slate-700 py-3 bg-slate-900/50">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">Fabric Specifications</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300 font-semibold text-xs uppercase">Fabric Type *</Label>
                      <Input
                        className="bg-slate-900 border-slate-700 mt-1 text-white focus:ring-primary"
                        placeholder="e.g. INTERLOCK, SINGLE JERSEY"
                        {...register('fabricType')}
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300 font-semibold text-xs uppercase">Fabric Colour</Label>
                      <Input
                        className="bg-slate-900 border-slate-700 mt-1 text-white focus:ring-primary"
                        placeholder="e.g. Grey, RFD"
                        {...register('fabricColour')}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-slate-300 font-semibold text-xs uppercase">Dia</Label>
                      <Input
                        className="bg-slate-900 border-slate-700 mt-1 text-white focus:ring-primary"
                        placeholder='e.g. 72"'
                        {...register('fabricDia')}
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300 font-semibold text-xs uppercase">GSM</Label>
                      <Input
                        className="bg-slate-900 border-slate-700 mt-1 text-white focus:ring-primary"
                        placeholder="e.g. 180"
                        {...register('fabricGsm')}
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300 font-semibold text-xs uppercase">Total Fabric Weight (kg)</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        className="bg-slate-900 border-slate-700 mt-1 text-white focus:ring-primary"
                        placeholder="0.00"
                        {...register('totalFabricWeight')}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* DYNAMIC ITEMS SECTION */}
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="text-base font-semibold uppercase tracking-wider text-slate-200">
                  {poType === 'YARN' ? 'Yarn Particulars' : 'Fabric Particulars'}
                </h3>
                <Button type="button" size="sm" className="bg-primary hover:bg-primary/90 text-white flex items-center gap-1 font-semibold" onClick={addRow}>
                  <Plus className="w-4 h-4" /> Add Row
                </Button>
              </div>

              <div className="overflow-x-auto rounded border border-slate-750">
                <Table className="text-slate-200 min-w-[900px]">
                  <TableHeader className="bg-slate-800/80 border-b border-slate-750">
                    <TableRow className="hover:bg-slate-800/80 border-slate-750">
                      <TableHead className="text-slate-300 font-semibold w-[22%]">Description</TableHead>
                      {poType === 'YARN' ? (
                        <>
                          <TableHead className="text-slate-300 font-semibold w-[10%]">Count</TableHead>
                          <TableHead className="text-slate-300 font-semibold w-[10%]">Quality</TableHead>
                          <TableHead className="text-slate-300 font-semibold w-[8%] text-center">Bags</TableHead>
                          <TableHead className="text-slate-300 font-semibold w-[8%] text-center">Bag Wt (kg)</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead className="text-slate-300 font-semibold w-[10%]">Fabric Type</TableHead>
                          <TableHead className="text-slate-300 font-semibold w-[10%]">Colour</TableHead>
                          <TableHead className="text-slate-300 font-semibold w-[8%] text-center">Rolls</TableHead>
                          <TableHead className="text-slate-300 font-semibold w-[8%] text-center">Wt/Roll (kg)</TableHead>
                        </>
                      )}
                      <TableHead className="text-slate-300 font-semibold w-[10%] text-center">Total Wt (kg)</TableHead>
                      <TableHead className="text-slate-300 font-semibold w-[10%] text-center">Rate / kg</TableHead>
                      <TableHead className="text-slate-300 font-semibold w-[6%] text-center">CGST (%)</TableHead>
                      <TableHead className="text-slate-300 font-semibold w-[6%] text-center">SGST (%)</TableHead>
                      <TableHead className="text-slate-300 font-semibold w-[10%] text-center">Total</TableHead>
                      <TableHead className="text-slate-300 font-semibold w-[5%] text-center"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-800">
                    {fields.map((field, index) => {
                      const item = watchedItems?.[index] || field;
                      const bags = Number(item.bags) || 0;
                      const bagWeight = Number(item.bagWeight) || 0;
                      const totalWeight = bags * bagWeight;
                      const rate = Number(item.rate) || 0;
                      const taxable = totalWeight * rate;
                      const cgstRate = Number(item.cgst) || 0;
                      const sgstRate = Number(item.sgst) || 0;
                      const cgstAmount = taxable * (cgstRate / 100);
                      const sgstAmount = taxable * (sgstRate / 100);
                      const total = taxable + cgstAmount + sgstAmount;

                      return (
                        <TableRow key={field.id} className="hover:bg-slate-800/40 border-slate-800 text-white font-medium">
                          {/* Description — same for both */}
                          <TableCell className="p-2">
                            <Input
                              className="bg-slate-900 border-slate-700 text-white text-xs"
                              placeholder={poType === 'YARN' ? 'e.g. 30s Combed Cotton' : 'e.g. Single Jersey Grey'}
                              required
                              {...register(`items.${index}.description` as const)}
                            />
                          </TableCell>

                          {poType === 'YARN' ? (
                            <>
                              {/* Count */}
                              <TableCell className="p-2">
                                <Input
                                  className="bg-slate-900 border-slate-700 text-white text-xs"
                                  placeholder="e.g. 30s"
                                  required
                                  {...register(`items.${index}.count` as const)}
                                />
                              </TableCell>
                              {/* Quality */}
                              <TableCell className="p-2">
                                <Input
                                  className="bg-slate-900 border-slate-700 text-white text-xs"
                                  placeholder="e.g. Combed"
                                  required
                                  {...register(`items.${index}.quality` as const)}
                                />
                              </TableCell>
                              {/* Bags */}
                              <TableCell className="p-2 text-center">
                                <Input
                                  type="number"
                                  min={0}
                                  className="bg-slate-900 border-slate-700 text-white text-xs text-center"
                                  required
                                  {...register(`items.${index}.bags` as const, {
                                    valueAsNumber: true,
                                    onChange: () => handleBagsOrWeightChange(index),
                                  })}
                                />
                              </TableCell>
                              {/* Bag Weight */}
                              <TableCell className="p-2 text-center">
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  className="bg-slate-900 border-slate-700 text-white text-xs text-center"
                                  required
                                  {...register(`items.${index}.bagWeight` as const, {
                                    valueAsNumber: true,
                                    onChange: () => handleBagsOrWeightChange(index),
                                  })}
                                />
                              </TableCell>
                            </>
                          ) : (
                            <>
                              {/* Fabric Type — reuses count field */}
                              <TableCell className="p-2">
                                <Input
                                  className="bg-slate-900 border-slate-700 text-white text-xs"
                                  placeholder="e.g. Interlock"
                                  {...register(`items.${index}.count` as const)}
                                />
                              </TableCell>
                              {/* Colour — reuses quality field */}
                              <TableCell className="p-2">
                                <Input
                                  className="bg-slate-900 border-slate-700 text-white text-xs"
                                  placeholder="e.g. Grey"
                                  {...register(`items.${index}.quality` as const)}
                                />
                              </TableCell>
                              {/* Rolls — reuses bags field */}
                              <TableCell className="p-2 text-center">
                                <Input
                                  type="number"
                                  min={0}
                                  className="bg-slate-900 border-slate-700 text-white text-xs text-center"
                                  placeholder="Rolls"
                                  {...register(`items.${index}.bags` as const, {
                                    valueAsNumber: true,
                                    onChange: () => handleBagsOrWeightChange(index),
                                  })}
                                />
                              </TableCell>
                              {/* Weight per Roll — reuses bagWeight field */}
                              <TableCell className="p-2 text-center">
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  className="bg-slate-900 border-slate-700 text-white text-xs text-center"
                                  placeholder="kg/roll"
                                  {...register(`items.${index}.bagWeight` as const, {
                                    valueAsNumber: true,
                                    onChange: () => handleBagsOrWeightChange(index),
                                  })}
                                />
                              </TableCell>
                            </>
                          )}

                          {/* Total Weight */}
                          <TableCell className="p-2 text-center">
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              className="bg-slate-900 border-slate-700 text-white text-xs text-center font-bold text-primary"
                              required
                              {...register(`items.${index}.totalWeight` as const, { valueAsNumber: true })}
                            />
                          </TableCell>
                          {/* Rate */}
                          <TableCell className="p-2 text-center">
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              className="bg-slate-900 border-slate-700 text-white text-xs text-center"
                              required
                              {...register(`items.${index}.rate` as const, { valueAsNumber: true })}
                            />
                          </TableCell>
                          {/* CGST */}
                          <TableCell className="p-2 text-center">
                            <Input
                              type="number"
                              min={0}
                              step="0.1"
                              className="bg-slate-900 border-slate-700 text-white text-xs text-center"
                              required
                              {...register(`items.${index}.cgst` as const, { valueAsNumber: true })}
                            />
                          </TableCell>
                          {/* SGST */}
                          <TableCell className="p-2 text-center">
                            <Input
                              type="number"
                              min={0}
                              step="0.1"
                              className="bg-slate-900 border-slate-700 text-white text-xs text-center"
                              required
                              {...register(`items.${index}.sgst` as const, { valueAsNumber: true })}
                            />
                          </TableCell>
                          {/* Calculated Row Total */}
                          <TableCell className="p-2 text-center font-bold text-sm text-green-400">
                            ₹{total.toFixed(2)}
                          </TableCell>
                          {/* Delete Row Action */}
                          <TableCell className="p-2 text-center">
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-slate-800"
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* GRAND TOTAL SUMMARY PANEL */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-800 p-4 rounded-lg border border-slate-700">
              <div className="text-sm font-semibold text-slate-300">
                Number of unique items: <span className="text-white text-lg font-bold ml-1">{fields.length}</span>
              </div>
              <div className="text-right">
                <span className="text-sm text-slate-300 font-semibold mr-2 uppercase tracking-wide">Grand Total:</span>
                <span className="text-2xl font-black text-green-400">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* PREVIEW SUBMIT BUTTON */}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold tracking-wider px-6 uppercase shadow-lg">
                Preview PO
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* HISTORICAL PURCHASE ORDERS LIST */}
      <Card className="bg-slate-900 border-slate-800 text-white shadow-xl mt-6">
        <CardHeader className="border-b border-slate-800 pb-4">
          <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-200">
            <Download className="text-primary w-5 h-5" /> Previously Generated Purchase Orders
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {purchaseOrders.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm italic border border-dashed border-slate-800 rounded">
              No historical purchase orders found in the database.
            </div>
          ) : (
            <div className="overflow-x-auto rounded border border-slate-800">
              <Table className="text-slate-200">
                <TableHeader className="bg-slate-800/50">
                  <TableRow className="hover:bg-slate-800/50 border-slate-800">
                    <TableHead className="text-slate-300 font-semibold">PO Number</TableHead>
                    <TableHead className="text-slate-300 font-semibold">HF Code / FB No.</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Type</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Supplier Name</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Date</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-center">Status</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-center">No. of Items</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-800">
                  {purchaseOrders.map((po) => (
                    <TableRow key={po.id} className={`hover:bg-slate-800/20 border-slate-800 text-white ${po.status === 'CANCELLED' ? 'opacity-50' : ''}`}>
                      <TableCell className="font-semibold">{po.poNumber}</TableCell>
                      <TableCell>{po.poType === 'GREY_FABRIC' ? po.fbNo || '—' : po.hfCode}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                          po.poType === 'GREY_FABRIC' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {po.poType === 'GREY_FABRIC' ? 'FABRIC' : 'YARN'}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{po.supplierName}</TableCell>
                      <TableCell>{new Date(po.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                          po.status === 'CANCELLED' ? 'bg-slate-700 text-slate-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {po.status || 'ACTIVE'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-bold">{po.items?.length || 0}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-1.5 justify-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-primary hover:text-primary/80 hover:bg-slate-800 flex items-center gap-1"
                            onClick={() => setPrintConfirmPO(po)}
                          >
                            <Download className="w-4 h-4" /> PDF
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-orange-400 hover:text-orange-300 hover:bg-slate-800 flex items-center gap-1"
                            onClick={() => confirmCancel(po)}
                            disabled={cancelMutation.isPending || po.status === 'CANCELLED'}
                          >
                            <XCircle className="w-4 h-4" /> Cancel
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-rose-400 hover:text-rose-300 hover:bg-slate-800 flex items-center gap-1"
                            onClick={() => confirmDelete(String(po.id))}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* RENDER PREVIEW MODAL */}
      <PurchaseOrderPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        data={watchedItems ? { ...form.getValues(), items: watchedItems, poType } : { ...form.getValues(), poType }}
        onConfirm={handleConfirm}
      />

      {/*
        ── HIDDEN PDF PRINT TEMPLATES ──
        Rendered off-screen so generatePOPDF can capture the correct element
        by its unique id without any DOM collision. One template per historical PO.
      */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none' }}>
        {purchaseOrders.map((po) => (
          <div key={po.id} id={`po-pdf-overlay-${po.id}`}>
            <PurchaseOrderPrintTemplate data={po} id={`po-pdf-overlay-${po.id}`} />
          </div>
        ))}
      </div>

      {/* ── PRINT CONFIRMATION DIALOG ── */}
      <Dialog open={!!printConfirmPO} onOpenChange={(o) => { if (!o) setPrintConfirmPO(null); }}>
        <DialogContent className="max-w-3xl bg-slate-900 border-slate-700 text-slate-100 max-h-[90vh] overflow-y-auto">
          {printConfirmPO && (() => {
            const po = printConfirmPO;
            const items = po.items ?? [];
            const grandTotal = items.reduce((acc, item) => {
              const tw = Number(item.totalWeight) || 0;
          const rate = Number(item.rate) || 0;
          const taxable = tw * rate;
          const cgst = taxable * ((Number(item.cgst) || 0) / 100);
          const sgst = taxable * ((Number(item.sgst) || 0) / 100);
          return acc + taxable + cgst + sgst;
        }, 0);
        const totalBags = items.reduce((s, i) => s + (Number(i.bags) || 0), 0);
        const totalWeight = items.reduce((s, i) => s + (Number(i.totalWeight) || 0), 0);
        const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        return (
          <>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  Confirm Before Printing — {po.poNumber}
                </DialogTitle>
              </DialogHeader>

              {/* PO Meta */}
              <div className="grid grid-cols-2 gap-3 text-sm mt-2">
                <div className="bg-slate-800 rounded-lg p-3 space-y-1">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Purchase Order Details</p>
                  <div className="flex justify-between"><span className="text-slate-400">PO Number</span><span className="font-semibold">{po.poNumber}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">HF Code</span><span className="font-semibold">{po.hfCode || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Agent</span><span className="font-semibold">{po.agent || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">PO Date</span><span className="font-semibold">{po.date ? new Date(po.date).toLocaleDateString('en-IN') : '—'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Delivery Date</span><span className="font-semibold">{po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString('en-IN') : '—'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Type</span><span className="font-semibold">{po.poType === 'GREY_FABRIC' ? 'Grey Fabric' : 'Yarn'}</span></div>
                </div>
                <div className="space-y-3">
                  <div className="bg-slate-800 rounded-lg p-3">
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Supplier</p>
                    <p className="font-semibold text-white">{po.supplierName}</p>
                    <p className="text-slate-400 text-xs whitespace-pre-wrap">{po.supplierAddress}</p>
                    <p className="text-slate-500 text-xs mt-1">GSTIN: {po.supplierGST}</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3">
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Delivery To</p>
                    <p className="font-semibold text-white">{po.deliveryName || '—'}</p>
                    <p className="text-slate-400 text-xs whitespace-pre-wrap">{po.deliveryAddress}</p>
                    <p className="text-slate-500 text-xs mt-1">GSTIN: {po.deliveryGST}</p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mt-3">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Items ({items.length})</p>
                <div className="overflow-x-auto rounded-lg border border-slate-700">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-800 text-slate-300">
                        {['#', 'Description', 'Count', 'Quality', 'Bags', 'Bag Wt', 'Total Wt', 'Rate', 'Taxable', 'CGST', 'SGST', 'Total'].map(h => (
                          <th key={h} className="px-2 py-2 text-center font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => {
                        const tw = Number(item.totalWeight) || 0;
                        const rate = Number(item.rate) || 0;
                        const taxable = tw * rate;
                        const cgstAmt = taxable * ((Number(item.cgst) || 0) / 100);
                        const sgstAmt = taxable * ((Number(item.sgst) || 0) / 100);
                        const total = taxable + cgstAmt + sgstAmt;
                        return (
                          <tr key={idx} className="border-t border-slate-700 hover:bg-slate-800/50">
                            <td className="px-2 py-1.5 text-center text-slate-400">{idx + 1}</td>
                            <td className="px-2 py-1.5 font-medium text-white">{item.description}</td>
                            <td className="px-2 py-1.5 text-center">{item.count}</td>
                            <td className="px-2 py-1.5 text-center">{item.quality}</td>
                            <td className="px-2 py-1.5 text-center">{item.bags}</td>
                            <td className="px-2 py-1.5 text-center">{fmt(Number(item.bagWeight))}</td>
                            <td className="px-2 py-1.5 text-center font-semibold">{fmt(tw)}</td>
                            <td className="px-2 py-1.5 text-center">₹{fmt(rate)}</td>
                            <td className="px-2 py-1.5 text-center">₹{fmt(taxable)}</td>
                            <td className="px-2 py-1.5 text-center text-amber-400">{item.cgst}%</td>
                            <td className="px-2 py-1.5 text-center text-amber-400">{item.sgst}%</td>
                            <td className="px-2 py-1.5 text-center font-bold text-emerald-400">₹{fmt(total)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div className="bg-slate-800 rounded-lg p-3 text-center">
                  <p className="text-slate-400 text-xs">Total Bags</p>
                  <p className="font-bold text-lg text-white">{totalBags}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 text-center">
                  <p className="text-slate-400 text-xs">Total Weight</p>
                  <p className="font-bold text-lg text-white">{fmt(totalWeight)} kg</p>
                </div>
                <div className="bg-emerald-900/40 border border-emerald-700/50 rounded-lg p-3 text-center">
                  <p className="text-emerald-400 text-xs">Grand Total</p>
                  <p className="font-bold text-lg text-emerald-300">₹{fmt(grandTotal)}</p>
                </div>
              </div>

              <DialogFooter className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  onClick={() => setPrintConfirmPO(null)}
                  disabled={printingPDF}
                >
                  <XCircle className="w-4 h-4 mr-1.5" /> Cancel
                </Button>
                <Button
                  variant="secondary"
                  className="bg-slate-700 hover:bg-slate-600 text-white flex items-center gap-2"
                  disabled={printingPDF}
                  onClick={() => {
                    // Temporarily render template to DOM so iframe can grab it
                    const printContainer = document.createElement('div');
                    printContainer.id = 'temp-po-print-container';
                    printContainer.style.position = 'absolute';
                    printContainer.style.left = '-9999px';
                    document.body.appendChild(printContainer);
                    
                    // We can just print the existing hidden one in the list
                    printElement(`po-pdf-overlay-${po.id}`, `PO_${po.poNumber}`);
                  }}
                >
                  <Printer className="w-4 h-4" /> Print Document
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/90 flex items-center gap-2"
                  disabled={printingPDF}
                  onClick={async () => {
                    setPrintingPDF(true);
                    toast.loading('Generating PDF for ' + po.poNumber + '...');
                    try {
                      await generatePOPDF(`po-pdf-overlay-${po.id}`, po.poNumber);
                      toast.dismiss();
                      toast.success('PDF generated!');
                    } catch (err) {
                      console.error(err);
                      toast.dismiss();
                      toast.error('Error generating PDF');
                    } finally {
                      setPrintingPDF(false);
                      setPrintConfirmPO(null); // Always close modal — prevents navigation freeze
                    }
                  }}
                >
                  {printingPDF ? (
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {printingPDF ? 'Generating…' : 'Confirm & Print PDF'}
                </Button>
              </DialogFooter>
          </>
        );
      })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
