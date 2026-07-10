'use client';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Printer, X, CheckCircle2, ChevronLeft, AlertCircle, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import YarnPOPrint, { type YarnPOData } from './YarnPOPrint';

interface Props {
  data: YarnPOData | null;
  onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtINR = (v?: number | null) =>
  v != null
    ? Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '—';

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ── Sub-component: Detail row ─────────────────────────────────────────────────
function Row({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`flex justify-between items-start py-2 border-b border-slate-700/50 text-sm ${highlight ? 'text-white font-semibold' : ''}`}>
      <span className="text-slate-400 shrink-0 w-44">{label}</span>
      <span className={`text-right ${highlight ? 'text-emerald-400 font-bold' : 'text-slate-200'}`}>{value || '—'}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 bg-slate-800/40 p-4 rounded-lg border border-slate-700/30">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-700 pb-1.5">{title}</div>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function YarnPOPreviewModal({ data, onClose }: Props) {
  const [step, setStep] = useState<'confirm' | 'preview'>('confirm');
  const [zoom, setZoom] = useState(1);
  const printRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-fit effect
  useEffect(() => {
    if (step === 'preview' && containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 48; // padding
      const poWidth = 1000; // Expected width of the printed template
      if (containerWidth < poWidth) {
        setZoom(Number((containerWidth / poWidth).toFixed(2)));
      } else {
        setZoom(1);
      }
    }
  }, [step, data]);

  if (!data) return null;

  const totalWeight   = Number(data.totalWeight ?? 0);
  const ratePerKg     = Number(data.ratePerKg ?? 0);
  const taxable       = totalWeight * ratePerKg;
  const cgstAmt       = Number(data.cgstAmount ?? 0);
  const sgstAmt       = Number(data.sgstAmount ?? 0);
  const total         = Number(data.totalCost ?? (taxable + cgstAmt + sgstAmt));
  const cgstRate      = Number(data.cgstRate ?? 2.5);
  const sgstRate      = Number(data.sgstRate ?? 2.5);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank', 'width=1100,height=800');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Yarn PO – PO-${String(data.id).padStart(4, '0')}</title>
      <meta charset="utf-8"/>
      <script src="https://cdn.tailwindcss.com"><\/script>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;font-size:12px;background:#fff;color:#000}
        @media print{@page{size:A4 landscape;margin:8mm}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
      </style>
    </head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 700);
  };

  const handleClose = () => {
    setStep('confirm');
    onClose();
  };

  const zoomIn = () => setZoom(prev => Math.min(prev + 0.1, 1.5));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const resetZoom = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 48;
      const poWidth = 1000;
      setZoom(containerWidth < poWidth ? Number((containerWidth / poWidth).toFixed(2)) : 1);
    }
  };

  return (
    <Dialog open={!!data} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent 
        showCloseButton={false}
        className={`w-full max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-900 text-white border-slate-800 transition-all duration-300 ${step === 'confirm' ? 'max-w-2xl sm:max-w-2xl' : 'max-w-[95vw] sm:max-w-[95vw]'}`}
      >

        {/* ── Header ── */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-800/80 flex-shrink-0 bg-slate-900/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              {step === 'confirm' ? (
                <>
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <span>Confirm PO Details &mdash; PO-{String(data.id).padStart(4, '0')}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span>PO Preview &mdash; PO-{String(data.id).padStart(4, '0')}</span>
                </>
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {step === 'preview' && (
                <div className="flex items-center bg-slate-800 rounded-md border border-slate-700/80 p-0.5 mr-2">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white" onClick={zoomOut} title="Zoom Out">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs px-2 font-mono text-slate-300 w-12 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white" onClick={zoomIn} title="Zoom In">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white border-l border-slate-700/50 rounded-none rounded-r-md" onClick={resetZoom} title="Reset to Fit">
                    <Maximize2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {step === 'confirm'
              ? 'Please verify all fields are accurate before continuing.'
              : 'This is exactly how the purchase order sheet looks. Check print settings for landscape layout.'}
          </p>
        </DialogHeader>

        {/* ── STEP 1 : Confirm details ── */}
        {step === 'confirm' && (
          <div className="overflow-y-auto flex-1 px-6 py-4 bg-slate-900/40">
            <Section title="Basic Info">
              <Row label="PO Number"    value={`PO-${String(data.id).padStart(4, '0')}`} />
              <Row label="Receipt Date" value={fmtDate(data.receiptDate)} />
              <Row label="HF Batch"     value={data.hfBatch} />
              <Row label="Purchase Account" value={data.purchaseAccount} />
            </Section>

            <Section title="Supplier (Mill)">
              <Row label="Mill Name"     value={data.mill?.name} />
              <Row label="Address"       value={[data.mill?.addressLine1, data.mill?.addressLine2].filter(Boolean).join(', ')} />
              <Row label="City / State"  value={[data.mill?.city, data.mill?.state, data.mill?.pincode].filter(Boolean).join(', ')} />
              <Row label="GSTIN"         value={data.mill?.gstin} />
            </Section>

            <Section title="Delivery To (Knitter)">
              <Row label="Knitter Name"  value={data.deliveryKnitter?.name} />
              <Row label="Address"       value={[data.deliveryKnitter?.addressLine1, data.deliveryKnitter?.addressLine2].filter(Boolean).join(', ')} />
              <Row label="City / State"  value={[data.deliveryKnitter?.city, data.deliveryKnitter?.state].filter(Boolean).join(', ')} />
              <Row label="GSTIN"         value={data.deliveryKnitter?.gstin} />
            </Section>

            <Section title="Yarn Details">
              <Row label="Yarn Count"   value={data.yarnCount} />
              <Row label="Quality"      value={data.rlVl} />
              <Row label="Description"  value={data.description || data.yarnQuality} />
              <Row label="No. of Bags"  value={data.numBags != null ? String(data.numBags) : undefined} />
              <Row label="Bag Weight"   value={data.bagWeight != null ? `${Number(data.bagWeight).toFixed(2)} kg` : undefined} />
              <Row label="Total Weight" value={`${totalWeight.toFixed(2)} kg`} highlight />
            </Section>

            <Section title="Pricing">
              <Row label="Rate / kg"        value={`₹ ${fmtINR(ratePerKg)}`} />
              <Row label="Taxable Amount"   value={`₹ ${fmtINR(taxable)}`} />
              <Row label={`CGST (${cgstRate}%)`} value={`₹ ${fmtINR(cgstAmt)}`} />
              <Row label={`SGST (${sgstRate}%)`} value={`₹ ${fmtINR(sgstAmt)}`} />
              <Row label="Total Cost"       value={`₹ ${fmtINR(total)}`} highlight />
            </Section>

            {data.remarks && (
              <Section title="Remarks">
                <Row label="Remarks" value={data.remarks} />
              </Section>
            )}
          </div>
        )}

        {/* ── STEP 2 : PO Preview ── */}
        {step === 'preview' && (
          <div ref={containerRef} className="overflow-auto flex-1 bg-slate-950/80 p-8 flex items-start justify-center min-h-[500px]">
            <div
              className="bg-white shadow-2xl transition-all duration-200 border border-slate-200"
              style={{
                width: '1000px',
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                marginBottom: `${(1 - zoom) * -100}%`, // Compensation to avoid extra blank space below scaled element
              }}
            >
              <div ref={printRef}>
                <YarnPOPrint data={data} />
              </div>
            </div>
          </div>
        )}

        {/* ── Footer actions ── */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/90 backdrop-blur-sm flex-shrink-0">
          {step === 'confirm' ? (
            <>
              <Button variant="outline" onClick={handleClose} className="gap-2 border-slate-700 hover:bg-slate-800 hover:text-white">
                <X className="h-4 w-4" /> Cancel
              </Button>
              <Button
                className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                onClick={() => setStep('preview')}
              >
                <CheckCircle2 className="h-4 w-4" /> Details Look Good — Generate PO
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep('confirm')} className="gap-2 border-slate-700 hover:bg-slate-800 hover:text-white">
                <ChevronLeft className="h-4 w-4" /> Back to Details
              </Button>
              <Button variant="outline" onClick={handleClose} className="gap-2 border-slate-700 hover:bg-slate-800 hover:text-white">
                <X className="h-4 w-4" /> Close
              </Button>
              <Button
                className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4" /> Print / Download PO
              </Button>
            </>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}
