'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import PurchaseOrderPrintTemplate from './PurchaseOrderPrintTemplate';

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

interface POData {
  poNumber?: string;
  hfCode?: string;
  agent?: string;
  date?: string;
  deliveryDate?: string;
  supplierName?: string;
  supplierAddress?: string;
  supplierGST?: string;
  deliveryName?: string;
  deliveryAddress?: string;
  deliveryGST?: string;
  items?: POItem[];
  poType?: 'YARN' | 'GREY_FABRIC';
  fabricType?: string;
  fabricColour?: string;
  fabricDia?: string;
  fabricGsm?: string;
  totalFabricWeight?: string | number;
}

interface PurchaseOrderPreviewProps {
  open: boolean;
  onClose: () => void;
  data: POData;
  onConfirm: () => void;
}

export default function PurchaseOrderPreview({
  open,
  onClose,
  data,
  onConfirm,
}: PurchaseOrderPreviewProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[95vw] h-[95vh] flex flex-col bg-slate-900 text-white border-slate-700">
        <DialogHeader className="border-b border-slate-800 pb-3 flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold text-white uppercase tracking-wider">
            Purchase Order Preview
          </DialogTitle>
        </DialogHeader>

        {/* Gray background scrollable body container with A4 page preview */}
        <div className="flex-1 overflow-auto bg-slate-800 p-6 flex justify-center">
          <div className="shadow-2xl bg-white text-black my-4">
            <PurchaseOrderPrintTemplate data={data} />
          </div>
        </div>

        {/* Footer controls */}
        <div className="border-t border-slate-800 pt-4 flex justify-end gap-3 mt-auto">
          <Button variant="outline" className="border-slate-600 hover:bg-slate-800 hover:text-white" onClick={onClose}>
            Edit
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-white font-bold" onClick={onConfirm}>
            Confirm &amp; Generate PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
