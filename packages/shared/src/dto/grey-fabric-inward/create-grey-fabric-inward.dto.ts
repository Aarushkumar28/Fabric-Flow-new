import { z } from 'zod';

export const CreateGreyFabricInwardSchema = z.object({
  receiptDate: z.string().optional(), // ISO date
  supplierName: z.string().min(1, 'Supplier name is required'),
  fabricType: z.string().optional(),
  fbNo: z.string().optional(),
  colour: z.string().optional(),
  totalWeight: z.number().positive(),
  rollCount: z.number().int().positive().optional(),
  ratePerKg: z.number().positive().optional(),
  purchaseAccount: z.string().optional(),
  remarks: z.string().optional(),
});

export type CreateGreyFabricInwardDto = z.infer<typeof CreateGreyFabricInwardSchema>;
