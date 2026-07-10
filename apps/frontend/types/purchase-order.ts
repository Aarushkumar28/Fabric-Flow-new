export interface PurchaseOrderItem {
  description: string;
  hsnCode?: string;
  quantity?: number;
  rate: number;
  amount?: number;
  // Existing form uses bags/bagWeight/totalWeight; keep flexible
  bags: number;
  bagWeight: number;
  totalWeight: number;
  cgst: number;
  sgst: number;
  count: string;
  quality: string;
}

export interface PurchaseOrder {
  id: string | number;
  poNumber: string;
  hfCode?: string;
  fbNo?: string;
  date: string;
  supplierName?: string;
  supplierAddress?: string;
  supplierGST?: string;
  supplier?: string;
  agent?: string;
  deliveryDate?: string;
  poType?: 'YARN' | 'GREY_FABRIC';
  deliveryName?: string;
  deliveryAddress?: string;
  deliveryGST?: string;
  fabricType?: string;
  fabricColour?: string;
  fabricDia?: string;
  fabricGsm?: string;
  totalFabricWeight?: number;
  items: PurchaseOrderItem[];
  totalAmount?: number;
  status?: string;
  createdAt?: string;
  /** Returned by backend when YarnInward auto-link was skipped (non-fatal). Shows as yellow warning toast. */
  inwardLinkWarning?: string | null;
}

export interface CreatePurchaseOrderInput {
  poNumber?: string;
  hfCode?: string;
  fbNo?: string;
  supplierName?: string;
  supplierAddress?: string;
  supplierGST?: string;
  supplier?: string;
  agent?: string;
  date: string;
  deliveryDate?: string;
  poType?: 'YARN' | 'GREY_FABRIC';
  deliveryName?: string;
  deliveryAddress?: string;
  deliveryGST?: string;
  fabricType?: string;
  fabricColour?: string;
  fabricDia?: string;
  fabricGsm?: string;
  totalFabricWeight?: number;
  /** Exact Mill ID from dropdown — bypasses fuzzy name matching. */
  millId?: number;
  /** Exact Knitter ID from dropdown — bypasses fuzzy name matching. */
  knitterId?: number;
  items: PurchaseOrderItem[];
}
