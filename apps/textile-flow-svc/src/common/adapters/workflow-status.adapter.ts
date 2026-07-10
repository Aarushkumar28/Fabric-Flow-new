import { WorkflowStatus } from '@textile-flow/shared';

export function yarnStatusFromInvoice(
  invoiceNo?: string | null,
): WorkflowStatus {
  return invoiceNo && invoiceNo.trim().length > 0
    ? WorkflowStatus.RECEIVED
    : WorkflowStatus.PENDING;
}

export function dyeingStatusFromDc(
  knitterDcNo?: string | null,
  companyDcNo?: string | null,
): WorkflowStatus {
  if (knitterDcNo && companyDcNo) {
    return WorkflowStatus.IN_DYEING;
  }
  if (knitterDcNo || companyDcNo) {
    return WorkflowStatus.SENT;
  }
  return WorkflowStatus.PENDING;
}

export function compactingStatus(completed?: boolean): WorkflowStatus {
  return completed ? WorkflowStatus.COMPLETED : WorkflowStatus.PENDING;
}

export function toOldYarnLookupShape(lot: {
  id: number;
  hfCode: string;
  description?: string | null;
  totalWeight: number;
  availableWeight: number;
}) {
  const used = lot.totalWeight - lot.availableWeight;

  return {
    id: lot.id,
    hf_code: lot.hfCode,
    description: lot.description ?? '',
    total_weight: lot.totalWeight,
    used,
    remaining: lot.availableWeight,
  };
}
