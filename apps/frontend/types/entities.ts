import { WorkflowStatus } from '@textile-flow/shared';

export type EntityWorkflowStatus = WorkflowStatus;

// ===================== Delivery Note =====================
export interface DeliveryNote {
  id: number;
  sourceKnitterId: number;
  destinationKnitterId: number;
  yarnLotId: number;
  quantity: number;
  dcNumber?: string | null;
  note?: string | null;
  createdAt: string;
  sourceKnitter?: { id: number; name: string } | null;
  destinationKnitter?: { id: number; name: string } | null;
  yarnLot?: { id: number; hfCode: string; availableWeight?: number } | null;
}

export interface DeliveryNoteFormData {
  sourceKnitterId: string;
  destinationKnitterId: string;
  yarnLotId: string;
  quantity: string;
  dcNumber: string;
  note: string;
}

// ===================== Grey Fabric Inward =====================
export interface GreyFabricInward {
  id: number;
  receiptDate: string;
  supplierName: string;
  fabricType?: string | null;
  colour?: string | null;
  totalWeight: number;
  rollCount?: number | null;
  ratePerKg?: number | null;
  totalCost?: number | null;
  purchaseAccount?: string | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
  greyFabricLots?: unknown[];
}

export interface GreyFabricInwardFormData {
  receiptDate: string;
  supplierName: string;
  fabricType: string;
  colour: string;
  totalWeight: string;
  rollCount: string;
  ratePerKg: string;
  purchaseAccount: string;
  remarks: string;
}

// ===================== Memo =====================
export interface MemoLine {
  id?: number;
  memoId?: number;
  yarnLotId: number;
  knitterId: number;
  yarnCount?: string | null;
  dia?: string | null;
  gg?: string | null;
  loopLength?: string | null;
  fabricName?: string | null;
  fabricColour?: string | null;
  expectedRolls?: number | null;
  preAssignedDyerId?: number | null;
  yarnLot?: { id: number; hfCode: string; availableWeight: number } | null;
  knitter?: { id: number; name: string } | null;
  dyer?: { id: number; name: string } | null;
}

export interface Memo {
  id: number;
  memoNo: number;
  issueDate: string;
  programmeRef?: string | null;
  account?: string | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
  lines?: MemoLine[];
}

export interface MemoLineFormData {
  yarnLotId: string;
  knitterId: string;
  yarnCount: string;
  dia: string;
  gg: string;
  loopLength: string;
  fabricName: string;
  fabricColour: string;
  expectedRolls: string;
  preAssignedDyerId: string;
}

export interface MemoFormData {
  issueDate: string;
  programmeRef: string;
  account: string;
  remarks: string;
  lines: MemoLineFormData[];
}

// ===================== Yarn Inward =====================
export interface YarnInward {
  id: number;
  receiptDate: string;
  millId: number;
  deliveryKnitterId: number;
  mill?: { id: number; name: string };
  deliveryKnitter?: { id: number; name: string };
  hfBatch?: string | null;
  yarnCount?: string | null;
  yarnQuality?: string | null;
  rlVl?: string | null;
  description?: string | null;
  numBags?: number | null;
  bagWeight?: number | null;
  totalWeight: number;
  ratePerKg?: number | null;
  cgstRate?: number | null;
  sgstRate?: number | null;
  cgstAmount?: number | null;
  sgstAmount?: number | null;
  totalCost?: number | null;
  purchaseAccount?: string | null;
  remarks?: string | null;
  createdAt: string;
  yarnLots?: { id: number; hfCode: string; totalWeight: number; availableWeight: number }[];
  purchaseOrderId?: string | null;
  purchaseOrder?: {
    poNumber: string;
    date: string;
    hfCode: string;
    items?: {
      count: string;
      quality: string;
      rate: number;
      bags: number;
      bagWeight: number;
      totalWeight: number;
    }[];
  } | null;
  millInvoiceNo?: string | null;
  millDcNo?: string | null;
  receivedWeight?: number | null;
  status: string;
}

export interface YarnInwardFormData {
  receiptDate: string;
  millId: string;
  deliveryKnitterId: string;
  hfBatch: string;
  yarnCount: string;
  yarnQuality: string;
  rlVl: string;            // 'RL' | 'VL' | ''
  description: string;
  numBags: string;
  bagWeight: string;       // default '60'
  ratePerKg: string;
  cgstRate: string;        // default '2.5'
  sgstRate: string;        // default '2.5'
  purchaseAccount: string;
  remarks: string;
  purchaseOrderId: string;
  millInvoiceNo: string;
  millDcNo: string;
  receivedWeight: string;
  status: string;
}

// Re-export commonly used types from yarn.ts for convenience
export type { YarnLot, Knitter } from './yarn';

// ===================== Phase 3D =====================
export interface KnitterProgramYarnUsage {
  id: number;
  knitterProgramId: number;
  yarnLotId: number;
  quantityUsed: number;
  yarnLot?: { id: number; hfCode: string };
}

export interface KnitterProgram {
  id: number;
  knitterId: number;
  // Kept for backward compatibility
  yarnLotId?: number | null;
  quantityUsed?: number | null;
  
  greyWeight: number;
  numRolls?: number | null;
  dia?: string | null;
  gg?: string | null;
  loopLength?: string | null;
  fabricName?: string | null;
  fabricColour?: string | null;
  programmeRef?: string | null;
  preAssignedDyerId?: number | null;
  programDate: string;
  anomalyFlag: boolean;
  knitter?: { id: number; name: string };
  yarnLot?: { id: number; hfCode: string };
  yarnUsages?: KnitterProgramYarnUsage[];
  greyFabricLots?: GreyFabricLot[];
  preAssignedDyer?: { id: number; name: string };
}

export interface KnitterProgramFormData {
  knitterId: string;
  yarns: { yarnLotId: string; quantityUsed: string }[];
  greyWeight: string;
  dia: string;
  gg: string;
  loopLength: string;
  programDate: string;
}

export interface DyeingDispatch {
  id: number;
  dispatchDate: string;
  dyerId: number;
  remarks?: string;
  dyer?: { id: number; name: string };
  lines?: DyeingDispatchLine[];
}

export interface DyeingDispatchLine {
  id: number;
  dispatchId: number;
  greyFabricLotId: number;
  sentWeight: number;
  receivedWeight?: number;
  receivedDate?: string;
  processLossPercent?: number;
  status: EntityWorkflowStatus;
  greyFabricLot?: GreyFabricLot;
}

export interface DyeingDispatchFormData {
  dispatchDate: string;
  dyerId: string;
  remarks: string;
  lines: { greyFabricLotId: string }[];
}

export interface GreyFabricLot {
  id: number;
  lotNumber: string;
  greyWeight: number;
  rollCount?: number;
  source: 'KNITTED' | 'PURCHASED';
  status: EntityWorkflowStatus;
  knitter?: { id: number; name: string };
}
