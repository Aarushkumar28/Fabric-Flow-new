import { z } from 'zod';
import { WorkflowStatus } from '../../workflow/enums/workflow-status.enum';

export const UpdateYarnLotSchema = z.object({
  hfCode: z.string().min(1).optional(),
  purchaseOrderNo: z.string().optional(),
  invoiceNo: z.string().optional(),
  deliveryTo: z.string().optional(),
  millId: z.number().int().positive().optional(),
  description: z.string().optional(),
  count: z.string().optional(),
  quality: z.string().optional(),
  noOfBags: z.number().int().nonnegative().optional(),
  bagWeight: z.number().positive().optional(),
  totalWeight: z.number().positive().optional(),
  availableWeight: z.number().min(0).optional(),
  ratePerKg: z.number().nonnegative().optional(),
  totalCost: z.number().nonnegative().optional(),
  cgstRate: z.number().min(0).optional(),
  sgstRate: z.number().min(0).optional(),
  cgstAmount: z.number().min(0).optional(),
  sgstAmount: z.number().min(0).optional(),
  receivedWeight: z.number().optional(),
  shortage: z.number().optional(),
  status: z.nativeEnum(WorkflowStatus).optional(),
});

export type UpdateYarnLotDto = z.infer<typeof UpdateYarnLotSchema>;
